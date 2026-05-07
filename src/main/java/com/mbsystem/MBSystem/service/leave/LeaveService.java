package com.mbsystem.MBSystem.service.leave;

import com.mbsystem.MBSystem.domain.Ap;
import com.mbsystem.MBSystem.domain.Leave;
import com.mbsystem.MBSystem.domain.Module;
import com.mbsystem.MBSystem.dto.LeaveAlertMessage;
import com.mbsystem.MBSystem.dto.SensorDataRequest;
import com.mbsystem.MBSystem.repository.ap.ApRepository;
import com.mbsystem.MBSystem.repository.leave.LeaveRepository;
import com.mbsystem.MBSystem.repository.module.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRepository leaveRepository;
    private final ModuleRepository moduleRepository;
    private final ApRepository apRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // 모듈별 마지막으로 구역 내 AP가 감지된 시각
    private final Map<Long, Instant> lastSeenTime = new ConcurrentHashMap<>();
    // 모듈별 현재 이탈 상태 (알림 중복 방지)
    private final Map<Long, Boolean> isCurrentlyLeaved = new ConcurrentHashMap<>();
    
    private static final long LEAVE_THRESHOLD_MINUTES = 5;

    @Transactional
    public void checkDeparture(long moduleNum, long placeId, List<SensorDataRequest.WifiInfo> receivedWifi) {
        Module module = moduleRepository.findByModuleNumAndPlaceId(moduleNum, placeId)
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 모듈: " + moduleNum));

        // 해당 장소에 등록된 AP SSID 목록 조회
        List<Ap> placeAps = apRepository.findByPlaceId(placeId);
        Set<String> placeApSsids = placeAps.stream()
                .map(Ap::getSsid)
                .collect(Collectors.toSet());

        // 수신된 WiFi 중 장소 AP와 일치하는 SSID가 있는지 확인
        boolean isInPlace = receivedWifi != null && receivedWifi.stream()
                .anyMatch(w -> w.getSsid() != null && placeApSsids.contains(w.getSsid()));

        Instant now = Instant.now();

        if (isInPlace) {
            // 구역 내에 있음: 마지막 감지 시간 업데이트 및 이탈 상태 해제
            lastSeenTime.put(module.getId(), now);
            if (Boolean.TRUE.equals(isCurrentlyLeaved.get(module.getId()))) {
                isCurrentlyLeaved.put(module.getId(), false);
                // (선택 사항) 다시 돌아왔다는 알림을 보낼 수도 있습니다.
            }
            return;
        }

        // 구역 내 AP가 보이지 않음: 마지막으로 본 시각으로부터 얼마나 지났는지 체크
        Instant lastSeen = lastSeenTime.get(module.getId());
        
        // 만약 처음 신호를 받았는데 AP가 없다면 현재 시간을 처음 안 보인 시간으로 설정
        if (lastSeen == null) {
            lastSeenTime.put(module.getId(), now);
            return;
        }

        // 5분 이상 안 보였고, 아직 이탈 알림을 보내지 않은 상태라면 이탈 처리
        if (now.isAfter(lastSeen.plusSeconds(LEAVE_THRESHOLD_MINUTES * 60))) {
            if (!Boolean.TRUE.equals(isCurrentlyLeaved.get(module.getId()))) {
                
                Leave leave = new Leave();
                leave.setModule(module);
                leave.setLeavedAt(now);
                Leave saved = leaveRepository.save(leave);

                isCurrentlyLeaved.put(module.getId(), true);

                LeaveAlertMessage alert = new LeaveAlertMessage(
                        saved.getId(),
                        module.getModuleNum(),
                        module.getPlace().getId(),
                        saved.getLeavedAt()
                );

                messagingTemplate.convertAndSend("/topic/leave/" + placeId, alert);
            }
        }
    }
}
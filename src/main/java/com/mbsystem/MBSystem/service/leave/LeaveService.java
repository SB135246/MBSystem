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

    // 모듈별 마지막 이탈 알림 시각 (30초 쓰로틀)
    private final Map<Long, Instant> lastAlertTime = new ConcurrentHashMap<>();
    private static final long ALERT_THROTTLE_SECONDS = 30;

    @Transactional
    public void checkDeparture(long moduleNum, long placeId, List<SensorDataRequest.WifiInfo> receivedWifi) {
        Module module = moduleRepository.findByModuleNumAndPlaceId(moduleNum, placeId)
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 모듈: " + moduleNum));

        // 해당 장소에 등록된 AP SSID 목록 조회
        List<Ap> placeAps = apRepository.findByPlaceId(placeId);
        Set<String> placeApSsids = placeAps.stream()
                .map(Ap::getSsid)
                .collect(Collectors.toSet());

        // 수신된 WiFi 중 장소 AP와 일치하는 SSID가 하나라도 있으면 정상 구역
        boolean isInPlace = receivedWifi != null && receivedWifi.stream()
                .anyMatch(w -> w.getSsid() != null && placeApSsids.contains(w.getSsid()));

        if (isInPlace) {
            return;
        }

        // 30초 이내 이미 알림을 보낸 경우 중복 방지
        Instant last = lastAlertTime.getOrDefault(module.getId(), Instant.MIN);
        if (Instant.now().isBefore(last.plusSeconds(ALERT_THROTTLE_SECONDS))) {
            return;
        }

        Leave leave = new Leave();
        leave.setModule(module);
        leave.setLeavedAt(Instant.now());
        Leave saved = leaveRepository.save(leave);

        lastAlertTime.put(module.getId(), saved.getLeavedAt());

        LeaveAlertMessage alert = new LeaveAlertMessage(
                saved.getId(),
                module.getModuleNum(),
                module.getPlace().getId(),
                saved.getLeavedAt()
        );

        messagingTemplate.convertAndSend("/topic/leave/" + placeId, alert);
    }
}
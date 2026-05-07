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
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRepository leaveRepository;
    private final ModuleRepository moduleRepository;
    private final ApRepository apRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // 모듈별 처음 이탈이 감지된 시각
    private final Map<Long, Instant> departureStartTimes = new ConcurrentHashMap<>();
    // 모듈별 알림 전송 여부 (이탈 중일 때 중복 알림 방지)
    private final Map<Long, Boolean> isAlertSentMap = new ConcurrentHashMap<>();

    private static final long LEAVE_DELAY_MINUTES = 5;

    @Transactional
    public void checkDeparture(SensorDataRequest request) {
        Module module = moduleRepository.findByModuleNumAndPlaceId(
                        (long) request.getModule_num(), (long) request.getPlace_id())
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 모듈: " + request.getModule_num()));

        Long moduleId = module.getId();

        // 해당 장소에 등록된 AP SSID 목록 조회
        List<Ap> placeAps = apRepository.findByPlaceId((long) request.getPlace_id());
        Set<String> placeApSsids = placeAps.stream()
                .map(Ap::getSsid)
                .collect(Collectors.toSet());

        // 수신된 WiFi 중 장소 AP와 일치하는 SSID가 하나라도 있는지 확인
        boolean isInPlace = request.getWifi() != null && request.getWifi().stream()
                .anyMatch(w -> w.getSsid() != null && placeApSsids.contains(w.getSsid()));

        if (isInPlace) {
            // 구역 내에 있으면 이탈 관련 상태 초기화
            if (departureStartTimes.containsKey(moduleId)) {
                log.info("[이탈감지] 모듈 {} 구역 복귀 확인 - 상태 초기화", request.getModule_num());
            }
            departureStartTimes.remove(moduleId);
            isAlertSentMap.remove(moduleId);
            return;
        }

        // --- 이탈 상태일 때 (지정된 AP가 없음) ---

        // 처음 이탈이 감지된 시각 기록
        Instant firstDetected = departureStartTimes.putIfAbsent(moduleId, Instant.now());
        if (firstDetected == null) {
            log.info("[이탈감지] 모듈 {} 이탈 처음 감지 - 5분 대기 시작", request.getModule_num());
            return;
        }

        // 5분이 경과했는지 확인
        long minutesPassed = java.time.Duration.between(firstDetected, Instant.now()).toMinutes();
        
        if (minutesPassed >= LEAVE_DELAY_MINUTES) {
            // 이미 알림을 보냈는지 확인 (이탈 상태 유지 중 중복 알림 방지)
            if (isAlertSentMap.getOrDefault(moduleId, false)) {
                return;
            }

            log.warn("[이탈감지] 모듈 {} 5분 이상 이탈 유지 - 알림 전송", request.getModule_num());

            Leave leave = new Leave();
            leave.setModule(module);
            leave.setLeavedAt(Instant.now());
            Leave saved = leaveRepository.save(leave);

            isAlertSentMap.put(moduleId, true);

            LeaveAlertMessage alert = new LeaveAlertMessage(
                    saved.getId(),
                    module.getModuleNum(),
                    module.getPlace().getId(),
                    saved.getLeavedAt()
            );

            messagingTemplate.convertAndSend("/topic/leave/" + request.getPlace_id(), alert);
        } else {
            log.info("[이탈감지] 모듈 {} 이탈 중... (현재 {}분 경과)", request.getModule_num(), minutesPassed);
        }
    }
}
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

    private static final long LEAVE_DELAY_MINUTES = 3;

    @Transactional
    public void checkDeparture(SensorDataRequest request) {
        Module module = moduleRepository.findByModuleNumAndPlaceId(
                        (long) request.getModule_num(), (long) request.getPlace_id())
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 모듈: " + request.getModule_num()));

        Long moduleId = module.getId();
        Long placeId = (long) request.getPlace_id();
        Long moduleNum = (long) request.getModule_num();

        // 해당 장소에 등록된 AP SSID 목록 조회
        List<Ap> placeAps = apRepository.findByPlaceId(placeId);
        Set<String> placeApSsids = placeAps.stream()
                .map(Ap::getSsid)
                .collect(Collectors.toSet());

        // 수신된 WiFi 중 장소 AP와 일치하는 SSID의 개수 확인
        long matchingApCount = request.getWifi() == null ? 0 : request.getWifi().stream()
                .filter(w -> w.getSsid() != null && placeApSsids.contains(w.getSsid()))
                .count();

        // 1차 판단: 현재 지정된 AP가 1개라도 잡히는가? (0개일 때만 이탈로 간주)
        boolean isNowInPlace = matchingApCount >= 1;

        if (isNowInPlace) {
            // --- 구역 내 정상 위치 ---
            if (departureStartTimes.containsKey(moduleId)) {
                log.info("[이탈감지] 모듈 {} 구역 복귀 확인 - 상태 초기화 (지정 AP {}개 감지)", moduleNum, matchingApCount);
            }
            departureStartTimes.remove(moduleId);
            isAlertSentMap.remove(moduleId);
        } else {
            // --- 이탈 가능성 감지 (지정 AP 0개) ---
            Instant firstDetected = departureStartTimes.putIfAbsent(moduleId, Instant.now());
            
            if (firstDetected == null) {
                log.info("[이탈감지] 모듈 {} 이탈 처음 감지 - 3분 대기 시작", moduleNum);
            } else {
                long minutesPassed = java.time.Duration.between(firstDetected, Instant.now()).toMinutes();
                
                if (minutesPassed >= LEAVE_DELAY_MINUTES) {
                    // --- 3분 경과: 확정적 이탈 ---
                    if (!isAlertSentMap.getOrDefault(moduleId, false)) {
                        log.warn("[이탈감지] 모듈 {} 3분 이상 이탈 확정 - 알림 및 DB 저장", moduleNum);
                        
                        Leave leave = new Leave();
                        leave.setModule(module);
                        leave.setLeavedAt(Instant.now());
                        Leave saved = leaveRepository.save(leave);
                        isAlertSentMap.put(moduleId, true);

                        // 공식 알림 메시지 발송 (3분에 한 번, 이탈 확정 시에만)
                        LeaveAlertMessage alert = new LeaveAlertMessage(
                                saved.getId(),
                                module.getModuleNum(),
                                module.getPlace().getId(),
                                saved.getLeavedAt(),
                                false // inPlace = false (이탈함)
                        );
                        messagingTemplate.convertAndSend("/topic/leave/" + placeId + "/" + moduleNum, alert);
                    }
                } else {
                    log.info("[이탈감지] 모듈 {} 이탈 유지 중... (현재 {}분 경과)", moduleNum, minutesPassed);
                }
            }
        }
    }
}
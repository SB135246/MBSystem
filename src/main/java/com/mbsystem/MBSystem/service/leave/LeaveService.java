//LeaveService 추가 (2026/06/04 서상범)
package com.mbsystem.MBSystem.service.leave;

import com.mbsystem.MBSystem.domain.Ap;
import com.mbsystem.MBSystem.domain.Leave;
import com.mbsystem.MBSystem.domain.Module;
import com.mbsystem.MBSystem.dto.AdminAlertMessage;
import com.mbsystem.MBSystem.dto.LeaveAlertMessage;
import com.mbsystem.MBSystem.dto.SensorDataRequest;
import com.mbsystem.MBSystem.repository.ap.ApRepository;
import com.mbsystem.MBSystem.repository.leave.LeaveRepository;
import com.mbsystem.MBSystem.repository.module.ModuleRepository;
import com.mbsystem.MBSystem.service.admin.AdminService;
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
    private final AdminService adminService;

    // 모듈별 처음 이탈이 감지된 시각
    private final Map<Long, Instant> departureStartTimes = new ConcurrentHashMap<>();
    // 알림 전송 여부 관리
    private final Map<Long, Boolean> alertSentMap = new ConcurrentHashMap<>();

    private static final long LEAVE_DELAY_SECONDS = 30;

    @Transactional
    public void checkDeparture(SensorDataRequest request) {
        Module module = moduleRepository.findByModuleNumAndPlaceId(
                        (long) request.getModule_num(), (long) request.getPlace_id())
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 모듈: " + request.getModule_num()));

        Long moduleId = module.getId();
        Long placeId = (long) request.getPlace_id();

        // 수신된 WiFi 중 장소 AP와 일치하는 것이 있는지 확인
        boolean isNowInPlace = isModuleInPlace(request, placeId);

        if (isNowInPlace) {
            // 정상 구역 내: 모든 상태 초기화
            departureStartTimes.remove(moduleId);
            alertSentMap.remove(moduleId);
            return;
        }

        // --- 이탈 감지 시 로직 ---
        Instant firstDetected = departureStartTimes.putIfAbsent(moduleId, Instant.now());
        if (firstDetected == null) return; // 처음 감지됨 (기록만 하고 종료)

        long secondsPassed = java.time.Duration.between(firstDetected, Instant.now()).toSeconds();

        // 30초 경과 및 아직 알림 미발송 시 확정 처리
        if (secondsPassed >= LEAVE_DELAY_SECONDS && !alertSentMap.getOrDefault(moduleId, false)) {
            processFinalDeparture(module, placeId);
            alertSentMap.put(moduleId, true);
        }
    }

    private boolean isModuleInPlace(SensorDataRequest request, Long placeId) {
        if (request.getWifi() == null || request.getWifi().isEmpty()) return false;

        List<Ap> placeAps = apRepository.findByPlaceId(placeId);
        Set<String> placeApSsids = placeAps.stream()
                .map(Ap::getSsid)
                .collect(Collectors.toSet());

        return request.getWifi().stream()
                .anyMatch(w -> w.getSsid() != null && placeApSsids.contains(w.getSsid()));
    }

    private void processFinalDeparture(Module module, Long placeId) {
        log.warn("[Leave] 이탈 확정: DB 기록 및 알림 전송 (모듈 {})", module.getModuleNum());

        Leave leave = new Leave();
        leave.setModule(module);
        leave.setLeavedAt(Instant.now());
        Leave saved = leaveRepository.save(leave);

        LeaveAlertMessage alert = new LeaveAlertMessage(
                saved.getId(),
                module.getModuleNum(),
                placeId,
                saved.getLeavedAt(),
                false
        );
        messagingTemplate.convertAndSend("/topic/leave/" + placeId + "/" + module.getModuleNum(), alert);

        adminService.broadcastToAdmin(new AdminAlertMessage(
                "LEAVE",
                saved.getId(),
                module.getModuleNum(),
                placeId,
                saved.getLeavedAt(),
                null,
                null
        ));
    }
}

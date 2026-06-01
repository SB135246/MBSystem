//LeaveService 추가 (2026/06/04 서상범)
package com.mbsystem.MBSystem.service.leave;

import com.mbsystem.MBSystem.domain.Leave;
import com.mbsystem.MBSystem.domain.Module;
import com.mbsystem.MBSystem.dto.AdminAlertMessage;
import com.mbsystem.MBSystem.dto.LeaveAlertMessage;
import com.mbsystem.MBSystem.dto.SensorDataRequest;
import com.mbsystem.MBSystem.repository.leave.LeaveRepository;
import com.mbsystem.MBSystem.repository.module.ModuleRepository;
import com.mbsystem.MBSystem.service.admin.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRepository leaveRepository;
    private final ModuleRepository moduleRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final AdminService adminService;

    // 알림 전송 여부 관리
    private final Map<Long, Boolean> alertSentMap = new ConcurrentHashMap<>();

    @Transactional
    public void checkDeparture(SensorDataRequest request) {
        Long moduleId = (long) request.getModule_num();
        Long placeId = (long) request.getPlace_id();

        // ESP32로부터 수신된 이탈 확정 상태 확인 (1: 이탈, 0: 정상)
        boolean isLeave = (request.getLeave() == 1);

        if (!isLeave) {
            // 정상 구역 내로 돌아왔다면 알림 발송 가능 상태로 초기화
            alertSentMap.put(moduleId, false);
            return;
        }

        // --- 이탈 감지 시 로직 ---
        // 이탈 상태(1)이고 아직 이번 이탈에 대해 알림을 안 보냈다면 처리
        if (!alertSentMap.getOrDefault(moduleId, false)) {
            Module module = moduleRepository.findByModuleNumAndPlaceId(moduleId, placeId)
                    .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 모듈: " + moduleId));
            
            processFinalDeparture(module, placeId);
            alertSentMap.put(moduleId, true); // 알림 발송 완료 처리 (복귀 전까지 재발송 안함)
        }
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

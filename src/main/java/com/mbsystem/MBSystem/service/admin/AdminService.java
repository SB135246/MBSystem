package com.mbsystem.MBSystem.service.admin;

import com.mbsystem.MBSystem.domain.Module;
import com.mbsystem.MBSystem.dto.AdminAlertMessage;
import com.mbsystem.MBSystem.dto.AlertHistoryResponse;
import com.mbsystem.MBSystem.repository.leave.LeaveRepository;
import com.mbsystem.MBSystem.repository.module.ModuleRepository;
import com.mbsystem.MBSystem.repository.sos.SosRepository;
import com.mbsystem.MBSystem.repository.wearing.WearingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final SimpMessagingTemplate messagingTemplate;
    private final SosRepository sosRepository;
    private final LeaveRepository leaveRepository;
    private final WearingRepository wearingRepository;
    private final ModuleRepository moduleRepository;

    // ===================== WebSocket =====================

    public void broadcastToAdmin(AdminAlertMessage message) {
        messagingTemplate.convertAndSend("/topic/admin/" + message.getPlaceId(), message);
        log.info("[Admin] 알림 브로드캐스트 - 타입: {}, 모듈: {}, 장소: {}",
                message.getType(), message.getModuleNum(), message.getPlaceId());
    }

    // ===================== 모듈 목록 =====================

    public List<Module> getModules(Long placeId) {
        return moduleRepository.findByPlaceId(placeId);
    }

    // ===================== 연결 종료 알림 =====================

    public void disconnectModule(Long moduleNum, Long placeId) {
        AdminAlertMessage message = new AdminAlertMessage(
                "DISCONNECT", null, moduleNum, placeId, Instant.now(), null, null
        );
        broadcastToAdmin(message);
        log.info("[Admin] 모듈 {} 연결 종료 알림 - 장소: {}", moduleNum, placeId);
    }

    // ===================== 모듈별 로그 삭제 =====================

    @Transactional
    public void deleteModuleLogs(Long moduleNum, Long placeId) {
        Module module = moduleRepository.findByModuleNumAndPlaceId(moduleNum, placeId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "등록되지 않은 모듈: " + moduleNum + ", 장소: " + placeId));

        Long moduleId = module.getId();
        sosRepository.delete(moduleId);
        leaveRepository.delete(moduleId);
        wearingRepository.delete(moduleId);
        log.info("[Admin] 모듈 {} 로그 삭제 완료 - 장소: {}", moduleNum, placeId);
    }

    // ===================== 알림 이력 =====================

    public List<AlertHistoryResponse> getAlertHistory(Long placeId) {
        List<AlertHistoryResponse> result = new ArrayList<>();

        sosRepository.findByPlaceId(placeId).forEach(sos ->
                result.add(new AlertHistoryResponse(
                        "SOS",
                        sos.getId(),
                        sos.getModule().getModuleNum(),
                        placeId,
                        sos.getSosAt(),
                        sos.getIsConfirmed(),
                        sos.getConfirmedAt()
                ))
        );

        leaveRepository.findByPlaceId(placeId).forEach(leave ->
                result.add(new AlertHistoryResponse(
                        "LEAVE",
                        leave.getId(),
                        leave.getModule().getModuleNum(),
                        placeId,
                        leave.getLeavedAt(),
                        null,
                        null
                ))
        );

        wearingRepository.findByPlaceId(placeId).forEach(wearing ->
                result.add(new AlertHistoryResponse(
                        "WEARING",
                        wearing.getId(),
                        wearing.getModule().getModuleNum(),
                        placeId,
                        wearing.getRemovedAt(),
                        null,
                        null
                ))
        );

        result.sort((a, b) -> b.getOccurredAt().compareTo(a.getOccurredAt()));
        return result;
    }
}

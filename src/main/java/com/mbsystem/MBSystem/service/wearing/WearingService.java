package com.mbsystem.MBSystem.service.wearing;

import com.mbsystem.MBSystem.domain.Wearing;
import com.mbsystem.MBSystem.dto.SensorDataRequest;
import com.mbsystem.MBSystem.dto.WearingStatusMessage;
import com.mbsystem.MBSystem.dto.AdminAlertMessage;
import com.mbsystem.MBSystem.repository.module.ModuleRepository;
import com.mbsystem.MBSystem.repository.wearing.WearingRepository;
import com.mbsystem.MBSystem.service.admin.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WearingService {

    private final SimpMessagingTemplate messagingTemplate;
    private final WearingRepository wearingRepository;
    private final ModuleRepository moduleRepository;
    private final AdminService adminService;

    // 모듈별 직전 착용 상태 저장 (메모리 관리)
    private final Map<String, Boolean> lastStatusMap = new ConcurrentHashMap<>();

    // 조도 임계값: 50 lx 이하일 때 착용으로 간주
    private static final float LUX_THRESHOLD = 50.0f;
    // 터치 임계값: ESP32 analogRead(0-4095) 기준
    private static final int TOUCH_THRESHOLD = 1000;

    @Transactional
    public void processWearingData(SensorDataRequest request) {
        boolean isWearing = determineWearingStatus(request.getLight(), request.getTouch());
        String statusKey = request.getPlace_id() + "_" + request.getModule_num();
        
        // 이전 상태 가져오기 (없으면 현재 상태로 초기화)
        Boolean lastStatus = lastStatusMap.get(statusKey);

        // 착용 상태가 변경되었을 때 (착용 -> 미착용) DB 기록 + 관리자 알림
        if (lastStatus != null && lastStatus && !isWearing) {
            moduleRepository.findByModuleNumAndPlaceId(
                    (long) request.getModule_num(), (long) request.getPlace_id())
                    .ifPresent(module -> {
                        // DB 저장
                        Wearing wearing = new Wearing();
                        wearing.setModule(module);
                        wearing.setRemovedAt(Instant.now());
                        Wearing saved = wearingRepository.save(wearing);
                        log.info("[Wearing] 미착용 감지: DB 기록 완료 (모듈 {})", request.getModule_num());

                        // 관리자 알림 (place 지연로딩 대신 request에서 직접 사용)
                        adminService.broadcastToAdmin(new AdminAlertMessage(
                                "WEARING",
                                saved.getId(),
                                module.getModuleNum(),
                                (long) request.getPlace_id(),
                                Instant.now(),
                                null,
                                null
                        ));
                    });
        }

        // 현재 상태 업데이트
        lastStatusMap.put(statusKey, isWearing);

        WearingStatusMessage message = new WearingStatusMessage(
                (long) request.getModule_num(),
                (long) request.getPlace_id(),
                isWearing
        );

        // 프론트엔드로 실시간 상태 전송
        messagingTemplate.convertAndSend("/topic/wearing/"+ message.getPlaceId()+ "/" + message.getModuleNum(), message);

        log.info("[Wearing] 장소 {} 모듈 {}: 착용 상태 = {}, (조도: {}, 터치: {})", 
                request.getPlace_id(), request.getModule_num(), isWearing ? "착용 중" : "미착용", request.getLight(), request.getTouch());
    }

    private boolean determineWearingStatus(float light, int touch) {
        return (light <= LUX_THRESHOLD) || (touch <= TOUCH_THRESHOLD);
    }

}

package com.mbsystem.MBSystem.service.wearing;

import com.mbsystem.MBSystem.domain.Wearing;
import com.mbsystem.MBSystem.dto.SensorDataRequest;
import com.mbsystem.MBSystem.dto.WearingStatusMessage;
import com.mbsystem.MBSystem.repository.module.ModuleRepository;
import com.mbsystem.MBSystem.repository.wearing.WearingRepository;
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

    // 모듈별 직전 착용 상태 저장 (메모리 관리)
    private final Map<String, Boolean> lastStatusMap = new ConcurrentHashMap<>();

    // 조도 임계값: 50 lx 이하일 때 착용으로 간주
    private static final float LUX_THRESHOLD = 50.0f;
    // 터치 임계값: ESP32 analogRead(0-4095) 기준
    private static final int TOUCH_THRESHOLD = 500;

    @Transactional
    public void processWearingData(SensorDataRequest request) {
        boolean isWearing = determineWearingStatus(request.getLight(), request.getTouch());
        String statusKey = request.getPlace_id() + "_" + request.getModule_num();
        
        // 이전 상태 가져오기 (없으면 현재 상태로 초기화)
        Boolean lastStatus = lastStatusMap.get(statusKey);

        // 착용 상태가 변경되었을 때 (특히 착용 -> 미착용으로 변할 때) DB 기록
        if (lastStatus != null && lastStatus && !isWearing) {
            saveWearingRecord(request);
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
        return (light <= LUX_THRESHOLD) || (touch >= TOUCH_THRESHOLD);
    }

    private void saveWearingRecord(SensorDataRequest request) {
        moduleRepository.findByModuleNumAndPlaceId((long) request.getModule_num(), (long) request.getPlace_id())
                .ifPresent(module -> {
                    Wearing wearing = new Wearing();
                    wearing.setModule(module);
                    wearing.setRemovedAt(Instant.now());
                    wearingRepository.save(wearing);
                    log.info("[Wearing] 미착용 감지: DB 기록 완료 (모듈 {})", request.getModule_num());
                });
    }
}

package com.mbsystem.MBSystem.service.wearing;

import com.mbsystem.MBSystem.dto.SensorDataRequest;
import com.mbsystem.MBSystem.dto.WearingStatusMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WearingService {

    private final SimpMessagingTemplate messagingTemplate;

    // 조도 임계값: 50 lx 이하일 때 착용으로 간주
    private static final float LUX_THRESHOLD = 50.0f;
    // 터치 임계값: ESP32 analogRead(0-4095) 기준, 접촉 시 보통 값이 크게 상승함
    // 구체적인 하드웨어 특성에 따라 조정이 필요할 수 있으나, 일단 1000 이상을 기준으로 설정
    private static final int TOUCH_THRESHOLD = 1000;

    public void processWearingData(SensorDataRequest request) {
        boolean isWearing = determineWearingStatus(request.getLight(), request.getTouch());
        
        WearingStatusMessage message = new WearingStatusMessage(
                request.getModule_num(),
                request.getPlace_id(),
                isWearing,
                request.getLight(),
                request.getTouch()
        );

        // 프론트엔드로 실시간 상태 전송
        // 구독 경로: /topic/wearing/{placeId}
        String destination = "/topic/wearing/" + request.getPlace_id();
        messagingTemplate.convertAndSend(destination, message);

        log.info("[Wearing] 모듈 {}: 착용 상태 = {}, (조도: {}, 터치: {})", 
                request.getModule_num(), isWearing ? "착용 중" : "미착용", request.getLight(), request.getTouch());
    }

    private boolean determineWearingStatus(float light, int touch) {
        // 사용자의 조건: 조도 50 이하 또는 터치(전도체) 감지 시 착용
        return (light <= LUX_THRESHOLD) || (touch >= TOUCH_THRESHOLD);
    }
}

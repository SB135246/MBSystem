package com.mbsystem.MBSystem.controller.leave;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class LeaveController {

    /**
     * 프론트엔드에서 특정 장소의 이탈 알림을 구독하는 Topic 예시:
     * /topic/leave/{placeId}
     * 
     * 이 컨트롤러는 현재 서버 푸시 방식으로 동작하므로, 
     * 클라이언트가 보낸 메시지를 처리하는 @MessageMapping이 필요할 경우 여기에 추가합니다.
     */
    
    @MessageMapping("/leave/status/{placeId}")
    @SendTo("/topic/leave/{placeId}")
    public String handleLeaveStatusRequest(@DestinationVariable Long placeId) {
        log.info("Place {} 에 대한 이탈 상태 구독 요청 수신", placeId);
        return "Subscribed to leave alerts for place " + placeId;
    }
}

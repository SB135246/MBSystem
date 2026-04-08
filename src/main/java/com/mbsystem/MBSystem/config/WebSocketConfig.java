package com.mbsystem.MBSystem.config;


import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  @Override
  public void configureMessageBroker(MessageBrokerRegistry config) {
    // 서버에서 클라이언트로 보낼 때의 접두사: /topic
    config.enableSimpleBroker("/topic");
    // 클라이언트에서 서버로 메시지를 보낼 때의 접두사: /app (필요시 사용)
    config.setApplicationDestinationPrefixes("/app");
  }

  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    // 웹 브라우저가 소켓에 연결하기 위한 주소: ws://서버주소/ws-location
    registry.addEndpoint("/ws-location")
        .setAllowedOriginPatterns("*") // CORS 허용
        .withSockJS(); // 브라우저 호환성을 위한 SockJS 사용
  }
}

package com.mbsystem.MBSystem.controller.ap;

import com.mbsystem.MBSystem.dto.RssiScanRequest;
import com.mbsystem.MBSystem.service.ap.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/location")
@RequiredArgsConstructor
public class LocationController {

  private final LocationService locationService;
  private final SimpMessagingTemplate messagingTemplate;

  @PostMapping("/calculate")
  public ResponseEntity<double[]> getCoords(@RequestBody List<RssiScanRequest> requests) {
      // 1. 데이터가 비어있으면 null이나 빈 배열을 반환
      if (requests == null || requests.isEmpty()) {
          return ResponseEntity.ok(new double[0]); // 혹은 null
      }
      // 2. 정렬 및 위치 계산
      requests.sort((a, b) -> Double.compare(b.getRssi(), a.getRssi()));
      double[] coords = locationService.calculateUserLocation(requests);
      // 3. 웹소켓 전송 (대시보드 실시간 업데이트용)
      Long placeId = requests.get(0).getPlaceId();
      Long moduleNum = requests.get(0).getModuleNum();
      String destination = "/topic/location/" + placeId + "/" + moduleNum;
      messagingTemplate.convertAndSend(destination, coords);
      // 4. HTTP 응답 (요청자에게 결과 전달)
      return ResponseEntity.ok(coords);
  }
}
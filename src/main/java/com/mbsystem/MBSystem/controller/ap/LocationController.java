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

    // 1. SSID가 "AP"로 시작하는 항목만 필터링
    List<RssiScanRequest> filteredRequests = requests.stream()
        .filter(req -> req.getSsid() != null && req.getSsid().startsWith("AP"))
        .sorted((a, b) -> Double.compare(b.getRssi(), a.getRssi())) // RSSI 강한 순 정렬
        .toList();

    // 2. 필터링된 결과가 없으면 요청 거부 또는 빈 응답
    if (filteredRequests.isEmpty()) {
      return ResponseEntity.badRequest().build();
    }

    // 3. 위치 계산 서비스 호출 (필터링된 리스트 전달)
    double[] coords = locationService.calculateUserLocation(filteredRequests);

    // 4. 메타데이터 추출 (첫 번째 항목 기준)
    Long placeId = filteredRequests.get(0).getPlaceId();
    Long moduleNum = filteredRequests.get(0).getModuleNum();

    // 5. 웹소켓 전송
    String destination = "/topic/location/" + placeId + "/" + moduleNum;
    messagingTemplate.convertAndSend(destination, coords);

    return ResponseEntity.ok(coords);
  }
}
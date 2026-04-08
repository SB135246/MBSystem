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
    if (requests.isEmpty()) {
      return ResponseEntity.badRequest().build();
    }

    requests.sort((a, b) -> Double.compare(b.getRssi(), a.getRssi()));

    double[] coords = locationService.calculateUserLocation(requests);

    Long placeId = requests.get(0).getPlaceId();
    Long moduleNum = requests.get(0).getModuleNum();

    // 4. 웹소켓 전송: 경로에 placeId와 moduleNum을 포함
    // 구독 주소 예시: /topic/location/1/101
    String destination = "/topic/location/" + placeId + "/" + moduleNum;
    messagingTemplate.convertAndSend(destination, coords);

    return ResponseEntity.ok(coords);
  }
}
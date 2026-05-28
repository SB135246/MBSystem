package com.mbsystem.MBSystem.service.ap;

import com.mbsystem.MBSystem.domain.Ap;
import com.mbsystem.MBSystem.dto.LocationResponse;
import com.mbsystem.MBSystem.dto.RssiScanRequest;
import com.mbsystem.MBSystem.repository.ap.ApRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationService {

  private final ApRepository apRepository;
  private final SimpMessagingTemplate messagingTemplate;

  // 환경 변수 (현장 테스트 후 조정 필요)
  private static final double TX_POWER_1M = -45.0; // 1m 거리에서의 평균 RSSI
  private static final double N_CONSTANT = 3.2;    // 경로 손실 지수 (실내 보통 2.5 ~ 3.5)

  /**
   * ESP32로부터 받은 TOP 3 RSSI 데이터를 통해 사용자 위치 계산
   */
  public double[] calculateUserLocation(
      List<RssiScanRequest> scanRequests
  ) {

    if (scanRequests.isEmpty()) {
      throw new IllegalArgumentException(
          "AP 데이터가 없습니다."
      );
    }

    Long moduleNum =
        scanRequests.get(0).getModuleNum();

    Long placeId =
        scanRequests.get(0).getPlaceId();

    // =========================
    // strongest RSSI AP 선택
    // =========================

    RssiScanRequest strongestRequest =
        scanRequests.stream()
            .max((a, b) ->
                Double.compare(
                    a.getRssi(),
                    b.getRssi()
                )
            )
            .orElseThrow();

    // =========================
    // AP 조회
    // =========================

    Ap strongestAp =
        apRepository.findBySsidAndPlaceId(
            strongestRequest.getSsid(),
            strongestRequest.getPlaceId()
        ).orElseThrow(() ->
            new RuntimeException(
                "등록되지 않은 AP"
            )
        );

    // =========================
    // 위치 = strongest AP 좌표
    // =========================

    double userX =
        strongestAp.getXCoordinate();

    double userY =
        strongestAp.getYCoordinate();

    // =========================
    // radius 계산
    // =========================

    double radius =
        rssiToRadius(
            strongestRequest.getRssi()
        );

    // =========================
    // 응답
    // =========================

    LocationResponse response =
        new LocationResponse(
            moduleNum,
            placeId,
            userX,
            userY,
            strongestAp.getFloor(),
            radius
        );

    messagingTemplate.convertAndSend(
        "/topic/location/"
            + placeId
            + "/"
            + moduleNum,
        response
    );

    return new double[]{
        userX,
        userY
    };
  }

  private double rssiToRadius(double rssi) {

    if (rssi >= -40) return 1.0;
    if (rssi >= -60) return 2.0;
    if (rssi >= -70) return 3.0;

    return 4.0;
  }

}

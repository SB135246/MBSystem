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

    if (rssi >= -45) return 1.0;
    if (rssi >= -55) return 2.0;
    if (rssi >= -65) return 4.0;
    if (rssi >= -75) return 6.0;

    return 8.0;
  }
  
  /**
   * RSSI를 거리(m)로 변환하는 공식 (Log-Distance Path Loss Model)
   */
  private double rssiToDistance(double rssi) {
    double distance =
        Math.pow(
            10,
            (TX_POWER_1M - rssi)
                / (10 * N_CONSTANT)
        );

    // 최대 거리 제한
    return Math.min(distance, 12.0);
  }

  /**
   * 삼변측량 수식 (Trilateration)
   * p1, p2, p3는 각각 {x, y, d} 형태의 배열
   */
  private double[] trilateration(double[] p1, double[] p2, double[] p3) {
    double x1 = p1[0], y1 = p1[1], d1 = p1[2];
    double x2 = p2[0], y2 = p2[1], d2 = p2[2];
    double x3 = p3[0], y3 = p3[1], d3 = p3[2];

    // 수식 단순화를 위한 선형 방정식 풀이
    double A = 2 * (x2 - x1);
    double B = 2 * (y2 - y1);
    double C = Math.pow(d1, 2) - Math.pow(d2, 2) - Math.pow(x1, 2) + Math.pow(x2, 2) - Math.pow(y1, 2) + Math.pow(y2, 2);

    double D = 2 * (x3 - x2);
    double E = 2 * (y3 - y2);
    double F = Math.pow(d2, 2) - Math.pow(d3, 2) - Math.pow(x2, 2) + Math.pow(x3, 2) - Math.pow(y2, 2) + Math.pow(y3, 2);

    // Cramer's rule 또는 가감법을 이용한 x, y 산출
    double userX = (C * E - F * B) / (A * E - D * B);
    double userY = (A * F - D * C) / (A * E - D * B);

    return new double[]{userX, userY};
  }
}

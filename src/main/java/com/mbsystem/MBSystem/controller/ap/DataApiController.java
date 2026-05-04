package com.mbsystem.MBSystem.controller.ap;
import com.mbsystem.MBSystem.dto.SensorDataRequest;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;

@Slf4j
@RestController
@RequestMapping("/api")
public class DataApiController {

  @PostMapping("/data")
  public ResponseEntity<String> receiveSensorData(@RequestBody SensorDataRequest request) {
    // 1. 전체 데이터 로그 출력 (IntelliJ 콘솔 확인용)
    log.info("===== 데이터 수신 시작 =====");
    log.info("모듈 번호: {}", request.getModule_num());
    log.info("장소 ID: {}", request.getPlace_id());
    log.info("버튼 상태: {}, SOS: {}", request.getBtn(), request.getBtn_press_3s());
    log.info("센서 값 - 조도: {}, 터치: {}", request.getLight(), request.getTouch());

    // 2. 수신된 WiFi 개수 확인
    if (request.getWifi() != null) {
      log.info("스캔된 WiFi 개수: {}개", request.getWifi().size());
      // 상위 3개만 로그로 확인해보기
      request.getWifi().stream().limit(3).forEach(w ->
          log.info(" -> SSID: {}, RSSI: {}", w.getSsid(), w.getRssi())
      );
    }

    log.info("===== 데이터 처리 완료 =====\n");

    return ResponseEntity.ok("Success: Data received at Sydney/Local Server");
  }
}

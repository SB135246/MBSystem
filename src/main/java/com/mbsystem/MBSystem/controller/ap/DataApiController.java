package com.mbsystem.MBSystem.controller.ap;

import com.mbsystem.MBSystem.dto.RssiScanRequest;
import com.mbsystem.MBSystem.dto.SensorDataRequest;
import com.mbsystem.MBSystem.dto.SosRequest;
import com.mbsystem.MBSystem.service.ap.LocationService;
import com.mbsystem.MBSystem.service.leave.LeaveService;
import com.mbsystem.MBSystem.service.sos.SosService;
import com.mbsystem.MBSystem.service.wearing.WearingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DataApiController {

    private final LocationService locationService;
    private final SosService sosService;
    private final LeaveService leaveService;
    private final WearingService wearingService;

    @PostMapping("/data")
    public ResponseEntity<String> receiveSensorData(@RequestBody SensorDataRequest request) {

        // 이택민 - 모든 센서 데이터 수신 및 로그 기록, 센서 데이터를 이용한 삼변측량 실행
        log.info("===== 데이터 수신 시작 =====");
        log.info("모듈 번호: {}", request.getModule_num());
        log.info("장소 ID: {}", request.getPlace_id());
        log.info("버튼 상태: {}, SOS: {}", request.getBtn(), request.getBtn_press_3s());
        log.info("센서 값 - 조도: {}, 터치: {}", request.getLight(), request.getTouch());

        if (request.getWifi() != null) {
            log.info("스캔된 WiFi 개수: {}개", request.getWifi().size());

            List<RssiScanRequest> rssiList = request.getWifi().stream()
                    .filter(w -> w.getSsid() != null && w.getSsid().startsWith("AP"))
                    .sorted(Comparator.comparingInt(SensorDataRequest.WifiInfo::getRssi).reversed())
                    .limit(3)
                    .map(w -> {
                        RssiScanRequest dto = new RssiScanRequest();
                        dto.setModuleNum((long) request.getModule_num());
                        dto.setPlaceId((long) request.getPlace_id());
                        dto.setSsid(w.getSsid());
                        dto.setRssi((double) w.getRssi());
                        return dto;
                    })
                    .collect(Collectors.toList());

            log.info("추출된 AP 개수: {}개", rssiList.size());
            rssiList.forEach(r ->
                    log.info(" -> [{}] RSSI: {}", r.getSsid(), r.getRssi())
            );

            locationService.calculateUserLocation(rssiList);
        }


        // 5. 착용 상태 확인 및 웹소켓 전송 → WearingService 호출
        log.info("[착용감지] 착용 상태 확인 - 모듈: {}", request.getModule_num());
        wearingService.processWearingData(request);

        log.info("===== 데이터 처리 완료 =====\n");

        return ResponseEntity.ok("Success: Data received and processed");
    }
}
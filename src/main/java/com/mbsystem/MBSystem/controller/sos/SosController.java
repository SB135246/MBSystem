package com.mbsystem.MBSystem.controller.sos;

import com.mbsystem.MBSystem.dto.SosRequest;
import com.mbsystem.MBSystem.service.sos.SosService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sos")
@RequiredArgsConstructor
public class SosController {

    private final SosService sosService;

    // ESP32에서 SOS 버튼 2초 이상 누를 시 호출
    @PostMapping("/trigger")
    public ResponseEntity<Map<String, Long>> triggerSos(@RequestBody SosRequest request) {
        Long sosId = sosService.triggerSos(request);
        return ResponseEntity.ok(Map.of("sosId", sosId));
    }

    // 보호자가 알림 확인 시 호출 → 반복 알림 중단
    @PostMapping("/confirm/{sosId}")
    public ResponseEntity<Void> confirmSos(@PathVariable Long sosId) {
        sosService.confirmSos(sosId);
        return ResponseEntity.ok().build();
    }
}
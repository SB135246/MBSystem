package com.mbsystem.MBSystem.controller.sos;

import com.mbsystem.MBSystem.service.sos.SosService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sos")
@RequiredArgsConstructor
public class SosController {

    private final SosService sosService;

    // 보호자가 알림 확인 시 호출 → 반복 알림 중단
    @PostMapping("/confirm/{sosId}")
    public ResponseEntity<Void> confirmSos(@PathVariable Long sosId) {
        sosService.confirmSos(sosId);
        return ResponseEntity.ok().build();
    }
}
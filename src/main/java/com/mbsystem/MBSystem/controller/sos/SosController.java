package com.mbsystem.MBSystem.controller.sos;

import com.mbsystem.MBSystem.service.sos.SosService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/sos")
@RequiredArgsConstructor
public class SosController {

    private final SosService sosService;

    // 보호자/관리자 페이지에서 SOS 확인 → 30초 반복 알림 중지
    @PostMapping("/confirm/{sosId}")
    public ResponseEntity<Void> confirmSos(@PathVariable Long sosId) {
        log.info("[SOS] confirm 요청 수신 - sosId: {}", sosId);
        sosService.confirmSos(sosId);
        return ResponseEntity.ok().build();
    }
}

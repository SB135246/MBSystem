package com.mbsystem.MBSystem.controller.admin;

import com.mbsystem.MBSystem.domain.Module;
import com.mbsystem.MBSystem.dto.AlertHistoryResponse;
import com.mbsystem.MBSystem.service.admin.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ===================== 모듈 목록 =====================

    @GetMapping("/modules/{placeId}")
    public ResponseEntity<List<Module>> getModules(@PathVariable Long placeId) {
        return ResponseEntity.ok(adminService.getModules(placeId));
    }

    // ===================== 알림 이력 =====================

    @GetMapping("/alerts/{placeId}")
    public ResponseEntity<List<AlertHistoryResponse>> getAlertHistory(@PathVariable Long placeId) {
        return ResponseEntity.ok(adminService.getAlertHistory(placeId));
    }

    // ===================== 연결 종료 (ESP32 버튼 5초) =====================

    @PostMapping("/disconnect/{moduleNum}/{placeId}")
    public ResponseEntity<Void> disconnectModule(@PathVariable Long moduleNum,
                                                  @PathVariable Long placeId) {
        adminService.disconnectModule(moduleNum, placeId);
        return ResponseEntity.ok().build();
    }

    // ===================== 모듈별 로그 삭제 =====================

    @DeleteMapping("/logs/module/{moduleNum}/{placeId}")
    public ResponseEntity<Void> deleteModuleLogs(@PathVariable Long moduleNum,
                                                  @PathVariable Long placeId) {
        adminService.deleteModuleLogs(moduleNum, placeId);
        return ResponseEntity.noContent().build();
    }
}

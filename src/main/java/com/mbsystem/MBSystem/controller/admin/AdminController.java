package com.mbsystem.MBSystem.controller.admin;

import com.mbsystem.MBSystem.domain.Ap;
import com.mbsystem.MBSystem.domain.Module;
import com.mbsystem.MBSystem.dto.AlertHistoryResponse;
import com.mbsystem.MBSystem.dto.ApRequest;
import com.mbsystem.MBSystem.service.admin.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

    // ESP32가 호출: POST /api/admin/disconnect/{moduleNum}/{placeId}
    @PostMapping("/disconnect/{moduleNum}/{placeId}")
    public ResponseEntity<Void> disconnectModule(@PathVariable Long moduleNum,
                                                  @PathVariable Long placeId) {
        adminService.disconnectModule(moduleNum, placeId);
        return ResponseEntity.ok().build();
    }

    // ===================== 모듈별 로그 삭제 (관리자 버튼) =====================

    // 관리자가 호출: DELETE /api/admin/logs/module/{moduleNum}/{placeId}
    @DeleteMapping("/logs/module/{moduleNum}/{placeId}")
    public ResponseEntity<Void> deleteModuleLogs(@PathVariable Long moduleNum,
                                                  @PathVariable Long placeId) {
        adminService.deleteModuleLogs(moduleNum, placeId);
        return ResponseEntity.noContent().build();
    }

    // ===================== AP CRUD =====================

    @GetMapping("/ap/{placeId}")
    public ResponseEntity<List<Ap>> getApList(@PathVariable Long placeId) {
        return ResponseEntity.ok(adminService.getApList(placeId));
    }

    @PostMapping("/ap")
    public ResponseEntity<Ap> createAp(@RequestBody ApRequest request) {
        return ResponseEntity.ok(adminService.createAp(request));
    }

    @PutMapping("/ap/{apId}")
    public ResponseEntity<Ap> updateAp(@PathVariable Long apId, @RequestBody ApRequest request) {
        return ResponseEntity.ok(adminService.updateAp(apId, request));
    }

    @DeleteMapping("/ap/{apId}")
    public ResponseEntity<Void> deleteAp(@PathVariable Long apId) {
        adminService.deleteAp(apId);
        return ResponseEntity.noContent().build();
    }

    // ===================== 지도 이미지 =====================

    @PostMapping("/map/{placeId}")
    public ResponseEntity<String> uploadMap(@PathVariable Long placeId,
                                            @RequestParam("file") MultipartFile file) {
        try {
            adminService.uploadMap(placeId, file);
            return ResponseEntity.ok("지도 이미지 업로드 완료");
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("파일 저장 실패: " + e.getMessage());
        }
    }

    @GetMapping("/map/{placeId}")
    public ResponseEntity<byte[]> getMap(@PathVariable Long placeId) {
        try {
            byte[] imageData = adminService.getMapImage(placeId);
            if (imageData == null) return ResponseEntity.notFound().build();

            MediaType mediaType = adminService.getMapMediaType(placeId);
            return ResponseEntity.ok().contentType(mediaType).body(imageData);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}

package com.mbsystem.MBSystem.controller.leave;

import com.mbsystem.MBSystem.dto.LeaveAlertMessage;
import com.mbsystem.MBSystem.service.leave.LeaveService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Leave Alert", description = "지정 장소 이탈 알림 API")
@RestController
@RequestMapping("/api/leave")
@RequiredArgsConstructor
public class LeaveApiController {

    private final LeaveService leaveService;

    @Operation(summary = "최신 이탈 알림 조회", description = "특정 장소와 모듈에서 발생한 가장 최근의 이탈 알림을 조회합니다. 알림이 없으면 빈 응답을 반환합니다.")
    @GetMapping("/latest/{placeId}/{moduleNum}")
    public ResponseEntity<LeaveAlertMessage> getLatestAlert(
            @PathVariable Long placeId,
            @PathVariable Long moduleNum) {
        LeaveAlertMessage alert = leaveService.getLastAlert(placeId, moduleNum);
        if (alert == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(alert);
    }
}

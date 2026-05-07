package com.mbsystem.MBSystem.controller.wearing;

import com.mbsystem.MBSystem.domain.Wearing;
import com.mbsystem.MBSystem.service.wearing.WearingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wearing")
@RequiredArgsConstructor
public class WearingController {

    private final WearingService wearingService;

    // 특정 모듈의 현재 착용 상태 조회 (메모리 데이터)
    @GetMapping("/status/{placeId}/{moduleNum}")
    public ResponseEntity<Map<String, Object>> getWearingStatus(
            @PathVariable int placeId,
            @PathVariable int moduleNum) {
        boolean isWearing = wearingService.getRecentStatus(placeId, moduleNum);
        return ResponseEntity.ok(Map.of(
                "placeId", placeId,
                "moduleNum", moduleNum,
                "isWearing", isWearing
        ));
    }

    // 특정 모듈의 미착용 이력 조회 (DB 데이터)
    @GetMapping("/history/{placeId}/{moduleNum}")
    public ResponseEntity<List<Wearing>> getWearingHistory(
            @PathVariable int placeId,
            @PathVariable int moduleNum) {
        List<Wearing> history = wearingService.getWearingHistory(moduleNum, placeId);
        return ResponseEntity.ok(history);
    }
}

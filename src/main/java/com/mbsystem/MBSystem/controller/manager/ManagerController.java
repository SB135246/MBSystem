package com.mbsystem.MBSystem.controller.manager;

import com.mbsystem.MBSystem.dto.LoginRequest;
import com.mbsystem.MBSystem.dto.LoginResponse;
import com.mbsystem.MBSystem.service.manager.ManagerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
public class ManagerController {

    private final ManagerService managerService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        try {
            LoginResponse response = managerService.login(loginRequest);
            // 성공 시 200 OK와 함께 데이터 반환
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            // 실패 시 401 Unauthorized 혹은 400 Bad Request
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}

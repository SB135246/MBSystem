package com.mbsystem.MBSystem.service.manager;

import com.mbsystem.MBSystem.domain.Manager;
import com.mbsystem.MBSystem.dto.LoginRequest;
import com.mbsystem.MBSystem.dto.LoginResponse;
import com.mbsystem.MBSystem.repository.manager.ManagerRepository;
import com.mbsystem.MBSystem.repository.managerplace.ManagerPlaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerService {

    private final ManagerRepository managerRepository;
    private final ManagerPlaceRepository managerPlaceRepository;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        // 1. 아이디 존재 여부 확인
        Manager manager = managerRepository.findByLoginId(request.getLoginId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));

        // 2. 비밀번호 일치 확인 (실제 서비스에서는 PasswordEncoder를 사용한 암호화 비교 권장)
        if (!manager.getLoginPw().equals(request.getLoginPw())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 3. 관리자에게 할당된 장소 ID 목록 조회
        List<Long> placeIds = managerPlaceRepository.findByAllManagerId(manager.getId())
                .stream()
                .map(mp -> mp.getPlace().getId())
                .collect(Collectors.toList());

        return LoginResponse.builder()
                .managerId(manager.getId())
                .name(manager.getName())
                .managedPlaceIds(placeIds)
                .build();
    }
}

package com.mbsystem.MBSystem.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class LoginResponse {
    private Long managerId;
    private String name;
    private List<Long> managedPlaceIds; // 관리자가 접근 가능한 장소 ID 목록
}

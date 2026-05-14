package com.mbsystem.MBSystem.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LeaveStatusMessage {
    private Long moduleNum;
    private Long placeId;
    private boolean isInPlace; // 구역 내에 있는지 여부 (true: 정상, false: 이탈 중)
}

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
    private boolean inPlace;  // true = 구역 내, false = 이탈
}

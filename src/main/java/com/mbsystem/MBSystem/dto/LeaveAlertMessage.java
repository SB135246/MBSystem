package com.mbsystem.MBSystem.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class LeaveAlertMessage {
    private Long leaveId;
    private Long moduleNum;
    private Long placeId;
    private Instant leavedAt;
}
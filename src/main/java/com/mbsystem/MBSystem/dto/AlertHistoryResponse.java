package com.mbsystem.MBSystem.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class AlertHistoryResponse {
    private String type;           // "SOS", "LEAVE", "WEARING"
    private Long alertId;
    private Long moduleNum;
    private Long placeId;
    private Instant occurredAt;
    private Boolean isConfirmed;   // SOS 전용, 나머지는 null
    private Instant confirmedAt;   // SOS 전용, 나머지는 null
}

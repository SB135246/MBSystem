package com.mbsystem.MBSystem.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class AdminAlertMessage {
    private String type;          // "SOS", "LEAVE", "WEARING", "DISCONNECT"
    private Long alertId;         // DB 저장 ID (없으면 null)
    private Long moduleNum;
    private Long placeId;
    private Instant occurredAt;
    private Double xCoordinate;   // SOS 위치 (없으면 null)
    private Double yCoordinate;
}

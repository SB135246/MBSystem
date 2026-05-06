package com.mbsystem.MBSystem.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class SosAlertMessage {
    private Long sosId;
    private Long moduleNum;
    private Long placeId;
    private Double xCordinate;
    private Double yCordinate;
    private Instant sosAt;
}
package com.mbsystem.MBSystem.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class SosAlertMessage {
    private Long sosId;
    private Long moduleNum;
    private Long placeId;
    @JsonProperty("xCordinate")
    private Double xCordinate;
    @JsonProperty("yCordinate")
    private Double yCordinate;
    private Instant sosAt;
}
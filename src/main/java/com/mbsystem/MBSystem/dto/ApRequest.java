package com.mbsystem.MBSystem.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApRequest {
    private String ssid;
    private Double xCoordinate;
    private Double yCoordinate;
    private Long floor;
    private Long placeId;
}

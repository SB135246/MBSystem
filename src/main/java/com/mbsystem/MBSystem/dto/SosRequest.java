package com.mbsystem.MBSystem.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SosRequest {
    private Long moduleNum;
    private Long placeId;
    private List<WifiInfo> wifi;

    @Getter
    @Setter
    public static class WifiInfo {
        private String ssid;
        private Double rssi;
    }
}
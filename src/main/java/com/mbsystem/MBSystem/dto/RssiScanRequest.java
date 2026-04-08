package com.mbsystem.MBSystem.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RssiScanRequest {
  private Long moduleNum;
  private Long placeId;      // 현재 측정이 이루어지는 장소 ID
  private String ssid;       // AP의 이름
  private Double rssi;       // 측정된 RSSI 값
}

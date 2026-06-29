package com.mbsystem.MBSystem.dto;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import java.util.List;

@Getter @Setter @ToString
public class SensorDataRequest {
  private int module_num;      // 아두이노의 MODULE_NUM
  private int place_id;        // 아두이노의 PLACE_ID
  private int btn;             // 버튼 상태 (0 or 1)
  private int btn_press_3s;    // SOS 트리거 상태
  private float light;         // 조도 값
  private int touch;           // 아날로그 터치 값
  private int reset;           // reset 상태
  private int leave;           // leave 상태
  private List<WifiInfo> wifi; // WiFi 목록

  @Getter @Setter @ToString
  public static class WifiInfo {
    private String ssid;
    private int rssi;
  }
}

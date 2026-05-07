package com.mbsystem.MBSystem.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class LocationResponse {

  private Long moduleNum;
  private Long placeId;

  private double x;
  private double y;
}

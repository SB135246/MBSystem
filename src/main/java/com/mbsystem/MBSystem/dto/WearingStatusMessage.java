package com.mbsystem.MBSystem.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WearingStatusMessage {
    private int moduleNum;
    private int placeId;
    private boolean isWearing;
    private float light;
    private int touch;
}

package com.mbsystem.MBSystem.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "ap")
public class Ap {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "ap_id", nullable = false)
  private Long id;

  @Size(max = 255)
  @NotNull
  @Column(name = "ssid", nullable = false)
  private String ssid;

  @NotNull
  @Column(name = "x_coordinate", nullable = false)
  private Double xCoordinate;

  @NotNull
  @Column(name = "y_coordinate", nullable = false)
  private Double yCoordinate;

  @NotNull
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "place_id", nullable = false)
  private Place place;

}
package com.mbsystem.MBSystem.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "place")
public class Place {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "place_id", nullable = false)
  private Long id;

  @Size(max = 255)
  @NotNull
  @Column(name = "place_name", nullable = false)
  private String placeName;

  @Column(name = "map_image_path")
  private String mapImagePath;

}
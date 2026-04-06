package com.mbsystem.MBSystem.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "wearing")
public class Wearing {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "wearing_id", nullable = false)
  private Long id;

  @NotNull
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "module_id", nullable = false)
  private Module module;

  @NotNull
  @Column(name = "removed_at", nullable = false)
  private Instant removedAt;

}
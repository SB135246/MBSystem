package com.mbsystem.MBSystem.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "sos")
public class Sos {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sos_id", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    @NotNull
    @Column(name = "sos_at", nullable = false)
    private Instant sosAt;

    @Column(name = "x_cordinate")
    private Double xCordinate;

    @Column(name = "y_cordinate")
    private Double yCordinate;

    @NotNull
    @Column(name = "is_confirmed", nullable = false)
    private Boolean isConfirmed = false;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

}
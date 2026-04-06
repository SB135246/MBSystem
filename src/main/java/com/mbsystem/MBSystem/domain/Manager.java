package com.mbsystem.MBSystem.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "manager")
public class Manager {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "manager_id", nullable = false)
  private Long id;

  @Size(max = 255)
  @NotNull
  @Column(name = "login_id", nullable = false)
  private String loginId;

  @Size(max = 255)
  @NotNull
  @Column(name = "login_pw", nullable = false)
  private String loginPw;

  @Size(max = 255)
  @NotNull
  @Column(name = "name", nullable = false)
  private String name;

}
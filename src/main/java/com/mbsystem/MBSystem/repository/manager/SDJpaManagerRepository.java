package com.mbsystem.MBSystem.repository.manager;

import com.mbsystem.MBSystem.domain.Manager;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SDJpaManagerRepository extends JpaRepository<Manager, Long> {
}
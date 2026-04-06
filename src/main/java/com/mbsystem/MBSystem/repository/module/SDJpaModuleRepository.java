package com.mbsystem.MBSystem.repository.module;

import com.mbsystem.MBSystem.domain.Module;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SDJpaModuleRepository extends JpaRepository<Module, Long> {
}
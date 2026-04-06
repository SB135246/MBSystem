package com.mbsystem.MBSystem.repository.leave;

import com.mbsystem.MBSystem.domain.Leave;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SDJpaLeaveRepository extends JpaRepository<Leave, Long> {
}
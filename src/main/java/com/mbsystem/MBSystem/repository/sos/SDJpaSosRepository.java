package com.mbsystem.MBSystem.repository.sos;

import com.mbsystem.MBSystem.domain.Sos;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SDJpaSosRepository extends JpaRepository<Sos, Long> {
    Optional<Sos> findById(Long id);
}
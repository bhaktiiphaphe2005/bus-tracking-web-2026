package com.project.Backend.busTracker.repository;

import com.project.Backend.busTracker.model.DriverUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DriverUserRepository extends JpaRepository<DriverUser, Long> {
    Optional<DriverUser> findByUsername(String username);
}
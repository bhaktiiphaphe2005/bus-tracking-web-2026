package com.project.Backend.busTracker.repository;

import com.project.Backend.busTracker.model.StudentUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentUserRepository extends JpaRepository<StudentUser, Long> {
    Optional<StudentUser> findByEmail(String email);
    Optional<StudentUser> findByUsn(String usn);
}
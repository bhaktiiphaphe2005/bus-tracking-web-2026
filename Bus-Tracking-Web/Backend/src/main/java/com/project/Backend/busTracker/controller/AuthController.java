package com.project.Backend.busTracker.controller;

import com.project.Backend.busTracker.dto.LoginRequest;
import com.project.Backend.busTracker.dto.StudentSignupRequest;
import com.project.Backend.busTracker.model.StudentUser;
import com.project.Backend.busTracker.repository.DriverUserRepository;
import com.project.Backend.busTracker.repository.StudentUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final StudentUserRepository studentRepo;
    private final DriverUserRepository driverRepo;

    @PostMapping("/student/signup")
    public ResponseEntity<?> studentSignup(@RequestBody StudentSignupRequest request) {

        if (studentRepo.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        if (studentRepo.findByUsn(request.getUsn()).isPresent()) {
            return ResponseEntity.badRequest().body("USN already exists");
        }

        StudentUser student = new StudentUser();
        student.setName(request.getName());
        student.setEmail(request.getEmail());
        student.setUsn(request.getUsn());
        student.setPassword(request.getPassword());

        studentRepo.save(student);

        return ResponseEntity.ok("Student registered successfully");
    }

    @PostMapping("/student/login")
    public ResponseEntity<?> studentLogin(@RequestBody LoginRequest request) {

        return studentRepo.findByEmail(request.getUsername())
                .filter(student -> student.getPassword().equals(request.getPassword()))
                .<ResponseEntity<?>>map(student -> ResponseEntity.ok(student))
                .orElse(ResponseEntity.status(401).body("Invalid credentials"));
    }

    @PostMapping("/driver/login")
    public ResponseEntity<?> driverLogin(@RequestBody LoginRequest request) {

        return driverRepo.findByUsername(request.getUsername())
                .filter(driver -> driver.getPassword().equals(request.getPassword()))
                .<ResponseEntity<?>>map(driver -> ResponseEntity.ok(driver))
                .orElse(ResponseEntity.status(401).body("Invalid credentials"));
    }

    @GetMapping("/students")
    public ResponseEntity<?> getAllStudents() {
        return ResponseEntity.ok(studentRepo.findAll());
    }

    @GetMapping("/drivers")
    public ResponseEntity<?> getAllDrivers() {
        return ResponseEntity.ok(driverRepo.findAll());
    }
}
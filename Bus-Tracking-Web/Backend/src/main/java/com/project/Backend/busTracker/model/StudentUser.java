package com.project.Backend.busTracker.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "student_user")
@Data
public class StudentUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String usn;

    @Column(nullable = false)
    private String password;
}
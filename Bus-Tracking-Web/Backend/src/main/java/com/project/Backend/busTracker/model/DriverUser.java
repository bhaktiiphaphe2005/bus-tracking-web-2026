package com.project.Backend.busTracker.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "driver_user")
@Data
public class DriverUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String driverId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    private String assignedBusId;
}
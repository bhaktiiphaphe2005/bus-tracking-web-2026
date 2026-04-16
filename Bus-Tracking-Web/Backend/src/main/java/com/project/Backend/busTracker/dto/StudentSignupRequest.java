package com.project.Backend.busTracker.dto;

import lombok.Data;

@Data
public class StudentSignupRequest {
    private String name;
    private String email;
    private String usn;
    private String password;
}
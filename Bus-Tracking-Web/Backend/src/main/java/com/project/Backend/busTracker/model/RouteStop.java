package com.project.Backend.busTracker.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class RouteStop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String routeId;
    private int stopOrder;
    private String stopName;
    private double lat;
    private double lng;
}
package com.project.Backend.busTracker.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;

import java.time.Instant;

@Entity
@Data
public class BusLocation {

    @Id
    private String busId;

    private String routeId;

    private String routeName;
    private double lat;
    private double lng;
    private double speedKmh;
    private Instant timestamp;
}
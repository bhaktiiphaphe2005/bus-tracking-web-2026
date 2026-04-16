package com.project.Backend.busTracker.model;

import lombok.Data;

@Data
public class StopEta {
    private String stop;
    private int etaMin;
    private double km;
    private String arrivalTime;
}
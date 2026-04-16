package com.project.Backend.busTracker.model;

import lombok.Data;
import java.util.List;

@Data
public class BusRoute {
    private String routeId;
    private String routeName;
    private String color;
    private List<RouteStop> stops;

    @Data
    public static class RouteStop {
        private String name;
        private double lat;
        private double lng;
        private boolean departed;
    }
}
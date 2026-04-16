package com.project.Backend.busTracker.controller;

import com.project.Backend.busTracker.model.BusLocation;
import com.project.Backend.busTracker.model.RouteStop;
import com.project.Backend.busTracker.model.StopEta;
import com.project.Backend.busTracker.repository.RouteStopRepository;
import com.project.Backend.busTracker.service.BusTrackingService;
import com.project.Backend.busTracker.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.List;

@RestController
@RequestMapping("/api/bus")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") 
public class BusLocationController {

    private final BusTrackingService trackingService;
    private final GeminiService geminiService;
    private final RouteStopRepository routeStopRepository;

    @PostMapping("/location")
    public ResponseEntity<Void> updateLocation(@RequestBody BusLocation location) {
        trackingService.updateLocation(location);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/all")
    public ResponseEntity<Collection<BusLocation>> getAllBuses() {
        return ResponseEntity.ok(trackingService.getAllBuses());
    }

    @GetMapping("/{busId}/route")
    public ResponseEntity<List<RouteStop>> getRoute(@PathVariable String busId) {
        BusLocation bus = trackingService.getBusById(busId);

        // If the live tracker doesn't have the bus, or it's missing the RouteId link
        if (bus == null || bus.getRouteId() == null) {
            System.out.println(">>> [DEBUG] Bus " + busId + " has no assigned RouteId in memory.");
            return ResponseEntity.ok(List.of());
        }

        String targetRoute = bus.getRouteId().trim();
        System.out.println(">>> [DEBUG] Fetching stops for Route ID: [" + targetRoute + "]");

        List<RouteStop> stops = routeStopRepository.findByRouteIdOrderByStopOrder(targetRoute);
        
        System.out.println(">>> [DEBUG] Database returned " + stops.size() + " stops.");
        return ResponseEntity.ok(stops);
    }

    @GetMapping("/{busId}/eta")
    public ResponseEntity<List<StopEta>> getEta(@PathVariable String busId) {
        BusLocation bus = trackingService.getBusById(busId);
        if (bus == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(geminiService.estimateETAs(bus));
    }

    @GetMapping("/{busId}/distances")
    public ResponseEntity<List<StopEta>> getDistances(@PathVariable String busId) {
        BusLocation bus = trackingService.getBusById(busId);
        if (bus == null) return ResponseEntity.notFound().build();

        List<RouteStop> routeStops = routeStopRepository
                .findByRouteIdOrderByStopOrder(bus.getRouteId());

        List<StopEta> distances = routeStops.stream().map(stop -> {
            double km = haversine(bus.getLat(), bus.getLng(), stop.getLat(), stop.getLng());
            int etaMinutes = (int) Math.ceil((km / Math.max(bus.getSpeedKmh(), 10)) * 60);
            LocalDateTime arrival = LocalDateTime.now().plusMinutes(etaMinutes);

            StopEta eta = new StopEta();
            eta.setStop(stop.getStopName());
            eta.setKm(Math.round(km * 100.0) / 100.0);
            eta.setEtaMin(etaMinutes);
            eta.setArrivalTime(arrival.format(DateTimeFormatter.ofPattern("hh:mm a")));
            return eta;
        }).toList();

        return ResponseEntity.ok(distances);
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371; 
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
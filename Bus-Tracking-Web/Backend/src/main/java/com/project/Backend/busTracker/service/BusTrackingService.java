package com.project.Backend.busTracker.service;

import com.project.Backend.busTracker.model.BusLocation;
import com.project.Backend.busTracker.repository.BusLocationRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class BusTrackingService {

    private final SimpMessagingTemplate messaging;
    private final BusLocationRepository repository;
    
    // In-memory cache for high-speed 1-second updates
    private final Map<String, BusLocation> liveCache = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        repository.findAll().forEach(bus -> liveCache.put(bus.getBusId(), bus));
    }

    public void updateLocation(BusLocation location) {
        location.setTimestamp(Instant.now());
        
        // 1. Update Cache (Fast)
        liveCache.put(location.getBusId(), location);
        
        // 2. Async save to DB (to prevent blocking the 1-second flow)
        repository.save(location); 
        
        // 3. Push to all students via WebSocket
        // They will receive this almost instantly
        messaging.convertAndSend("/topic/buses", liveCache.values());
    }

    public Collection<BusLocation> getAllBuses() {
        return liveCache.values();
    }

    public BusLocation getBusById(String busId) {
        return liveCache.get(busId);
    }
}
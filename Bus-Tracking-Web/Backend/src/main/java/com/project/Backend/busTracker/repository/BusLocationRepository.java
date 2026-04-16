package com.project.Backend.busTracker.repository;

import com.project.Backend.busTracker.model.BusLocation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusLocationRepository extends JpaRepository<BusLocation, String> {
}
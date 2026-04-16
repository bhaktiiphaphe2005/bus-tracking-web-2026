package com.project.Backend.busTracker.repository;

import com.project.Backend.busTracker.model.RouteStop;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RouteStopRepository extends JpaRepository<RouteStop, Long> {

    List<RouteStop> findByRouteIdOrderByStopOrder(String routeId);
}
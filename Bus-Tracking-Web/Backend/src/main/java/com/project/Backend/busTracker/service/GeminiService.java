package com.project.Backend.busTracker.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.Backend.busTracker.model.BusLocation;
import com.project.Backend.busTracker.model.RouteStop;
import com.project.Backend.busTracker.model.StopEta;
import com.project.Backend.busTracker.repository.RouteStopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@RequiredArgsConstructor
@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RouteStopRepository routeStopRepository;

    public List<StopEta> estimateETAs(BusLocation bus) {

        List<RouteStop> routeStops = routeStopRepository
                .findByRouteIdOrderByStopOrder(bus.getRouteId());

        List<StopEta> baseEtas = routeStops.stream()
                .map(stop -> {
                    double km = haversine(
                            bus.getLat(),
                            bus.getLng(),
                            stop.getLat(),
                            stop.getLng()
                    );

                    int etaMin = (int) Math.ceil(
                            (km / Math.max(bus.getSpeedKmh(), 10)) * 60
                    );

                    LocalDateTime arrival = LocalDateTime.now().plusMinutes(etaMin);

                    StopEta eta = new StopEta();
                    eta.setStop(stop.getStopName());
                    eta.setKm(Math.round(km * 100.0) / 100.0);
                    eta.setEtaMin(etaMin);
                    eta.setArrivalTime(
                            arrival.format(DateTimeFormatter.ofPattern("hh:mm a"))
                    );

                    return eta;
                })
                .sorted(Comparator.comparingInt(StopEta::getEtaMin))
                .toList();

        String prompt = buildPrompt(bus, baseEtas);

        try {
            String aiResponse = callGemini(prompt);
            return parseResponse(aiResponse);
        } catch (Exception e) {
            return baseEtas;
        }
    }

    // 🔢 Base ETA using math
    private List<StopEta> calculateBaseEta(BusLocation bus, List<String> stops, List<Double> distances) {

        double speed = Math.max(bus.getSpeedKmh(), 10); // avoid zero speed

        return IntStream.range(0, stops.size())
                .mapToObj(i -> {
                    double distance = distances.get(i);
                    int eta = (int) Math.ceil((distance / speed) * 60); // minutes

                    StopEta stopEta = new StopEta();
                    stopEta.setStop(stops.get(i));
                    stopEta.setEtaMin(eta);
                    stopEta.setKm(distance);
                    return stopEta;
                })
                .collect(Collectors.toList());
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    // 🧠 Build smarter prompt
    private String buildPrompt(BusLocation bus, List<StopEta> baseEtas) {

        String stopList = baseEtas.stream()
                .map(s -> String.format("%s - %d min - %.2f km",
                        s.getStop(), s.getEtaMin(), s.getKm()))
                .collect(Collectors.joining("\n"));

        LocalTime now = LocalTime.now();

        return String.format("""
            You are an intelligent ETA prediction system for BMTC buses in Bengaluru.

            Context:
            - Current speed: %.1f km/h
            - Time: %s
            - Traffic: Heavy urban traffic (Bengaluru conditions)
            - Typical delay factors:
              * Signals
              * Passenger boarding (30-60 sec per stop)
              * Congestion

            Base ETA estimates:
            %s

            Task:
            Adjust these ETAs realistically.

            Rules:
            - Increase ETA during peak hours (8-11 AM, 5-9 PM)
            - Add delays for each stop
            - Do NOT reduce ETA unrealistically
            - Keep output clean

            Return ONLY JSON:
            [{"stop":"Stop Name","etaMin":5,"km":1.2}]
            """,
                bus.getSpeedKmh(),
                now,
                stopList
        );
    }

    // 🌐 Gemini API call
    private String callGemini(String prompt) {

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

        Map<?, ?> response = restTemplate.postForObject(url, requestBody, Map.class);

        return extractText(response);
    }

    // 📥 Extract response safely
    @SuppressWarnings("unchecked")
    private String extractText(Map<?, ?> response) {
        var candidates = (List<?>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) return "[]";

        var content = (Map<?, ?>) ((Map<?, ?>) candidates.get(0)).get("content");
        var parts = (List<?>) content.get("parts");

        return ((String) ((Map<?, ?>) parts.get(0)).get("text"))
                .replaceAll("```json|```", "")
                .trim();
    }

    // 🧾 Parse JSON safely
    private List<StopEta> parseResponse(String json) throws Exception {
        return objectMapper.readValue(json, new TypeReference<List<StopEta>>() {});
    }
}
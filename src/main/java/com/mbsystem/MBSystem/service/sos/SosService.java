package com.mbsystem.MBSystem.service.sos;

import com.mbsystem.MBSystem.domain.Module;
import com.mbsystem.MBSystem.domain.Sos;
import com.mbsystem.MBSystem.dto.AdminAlertMessage;
import com.mbsystem.MBSystem.dto.RssiScanRequest;
import com.mbsystem.MBSystem.dto.SensorDataRequest;
import com.mbsystem.MBSystem.dto.SosAlertMessage;
import com.mbsystem.MBSystem.repository.module.ModuleRepository;
import com.mbsystem.MBSystem.repository.sos.SosRepository;
import com.mbsystem.MBSystem.service.admin.AdminService;
import com.mbsystem.MBSystem.service.ap.LocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SosService {

    private final SosRepository sosRepository;
    private final ModuleRepository moduleRepository;
    private final LocationService locationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final AdminService adminService;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);
    private final Map<Long, ScheduledFuture<?>> activeAlerts = new ConcurrentHashMap<>();

    private static final long REPEAT_INTERVAL_SECONDS = 30;

    @Transactional
    public void processSosData(SensorDataRequest request) {
        if (request.getBtn_press_3s() != 1) return;

        log.info("[SOS] 긴급 호출 감지 - 모듈: {}", request.getModule_num());

        Module module = moduleRepository.findByModuleNumAndPlaceId(
                        (long) request.getModule_num(), (long) request.getPlace_id())
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 모듈: " + request.getModule_num()));

        double[] coords = calculatePosition(request);

        Sos sos = new Sos();
        sos.setModule(module);
        sos.setSosAt(Instant.now());
        sos.setXCoordinate(coords.length >= 2 ? coords[0] : null);
        sos.setYCoordinate(coords.length >= 2 ? coords[1] : null);
        sos.setIsConfirmed(false);
        Sos saved = sosRepository.save(sos);

        SosAlertMessage alert = new SosAlertMessage(
                saved.getId(),
                module.getModuleNum(),
                module.getPlace().getId(),
                saved.getXCoordinate(),
                saved.getYCoordinate(),
                saved.getSosAt()
        );

        sendAlert(alert);
        scheduleRepeat(saved.getId(), alert);

        adminService.broadcastToAdmin(new AdminAlertMessage(
                "SOS",
                saved.getId(),
                module.getModuleNum(),
                module.getPlace().getId(),
                saved.getSosAt(),
                saved.getXCoordinate(),
                saved.getYCordinate()
        ));
    }

    @Transactional
    public void confirmSos(Long sosId) {
        Sos sos = sosRepository.findBySosId(sosId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 SOS: " + sosId));
        sos.setIsConfirmed(true);
        sos.setConfirmedAt(Instant.now());
        sosRepository.save(sos);

        cancelRepeat(sosId);
    }

    private double[] calculatePosition(SensorDataRequest request) {
        if (request.getWifi() == null) return new double[0];

        try {
            List<RssiScanRequest> rssiList = request.getWifi().stream()
                    .filter(w -> w.getSsid() != null && w.getSsid().startsWith("AP"))
                    .map(w -> {
                        RssiScanRequest r = new RssiScanRequest();
                        r.setSsid(w.getSsid());
                        r.setRssi((double) w.getRssi());
                        r.setModuleNum((long) request.getModule_num());
                        r.setPlaceId((long) request.getPlace_id());
                        return r;
                    })
                    .sorted((a, b) -> Double.compare(b.getRssi(), a.getRssi()))
                    .toList();

            if (rssiList.size() < 3) return new double[0];
            return locationService.calculateUserLocation(rssiList);
        } catch (Exception e) {
            log.warn("[SOS] 위치 계산 실패: {}", e.getMessage());
            return new double[0];
        }
    }

    private void sendAlert(SosAlertMessage alert) {
        String destination = "/topic/sos/" + alert.getPlaceId() + "/" + alert.getModuleNum();
        messagingTemplate.convertAndSend(destination, alert);
    }

    private void scheduleRepeat(Long sosId, SosAlertMessage alert) {
        ScheduledFuture<?> future = scheduler.scheduleAtFixedRate(
                () -> sendAlert(alert),
                REPEAT_INTERVAL_SECONDS,
                REPEAT_INTERVAL_SECONDS,
                TimeUnit.SECONDS
        );
        activeAlerts.put(sosId, future);
    }

    private void cancelRepeat(Long sosId) {
        ScheduledFuture<?> future = activeAlerts.remove(sosId);
        if (future != null) {
            future.cancel(false);
        }
    }
}
package com.mbsystem.MBSystem.service.admin;

import com.mbsystem.MBSystem.domain.Ap;
import com.mbsystem.MBSystem.domain.Place;
import com.mbsystem.MBSystem.dto.AdminAlertMessage;
import com.mbsystem.MBSystem.dto.AlertHistoryResponse;
import com.mbsystem.MBSystem.dto.ApRequest;
import com.mbsystem.MBSystem.domain.Module;
import com.mbsystem.MBSystem.repository.ap.ApRepository;
import com.mbsystem.MBSystem.repository.leave.LeaveRepository;
import com.mbsystem.MBSystem.repository.module.ModuleRepository;
import com.mbsystem.MBSystem.repository.place.PlaceRepository;
import com.mbsystem.MBSystem.repository.sos.SosRepository;
import com.mbsystem.MBSystem.repository.wearing.WearingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final SimpMessagingTemplate messagingTemplate;
    private final SosRepository sosRepository;
    private final LeaveRepository leaveRepository;
    private final WearingRepository wearingRepository;
    private final ApRepository apRepository;
    private final PlaceRepository placeRepository;
    private final ModuleRepository moduleRepository;

    @Value("${upload.map.dir:uploads/maps}")
    private String mapUploadDir;

    // ===================== WebSocket =====================

    public void broadcastToAdmin(AdminAlertMessage message) {
        messagingTemplate.convertAndSend("/topic/admin/" + message.getPlaceId(), message);
        log.info("[Admin] 알림 브로드캐스트 - 타입: {}, 모듈: {}, 장소: {}",
                message.getType(), message.getModuleNum(), message.getPlaceId());
    }

    // ===================== 모듈 목록 =====================

    public List<Module> getModules(Long placeId) {
        return moduleRepository.findByPlaceId(placeId);
    }

    // ===================== 연결 종료 알림 =====================

    public void disconnectModule(Long moduleNum, Long placeId) {
        AdminAlertMessage message = new AdminAlertMessage(
                "DISCONNECT", null, moduleNum, placeId, Instant.now(), null, null
        );
        broadcastToAdmin(message);
        log.info("[Admin] 모듈 {} 연결 종료 알림 - 장소: {}", moduleNum, placeId);
    }

    // ===================== 모듈별 로그 삭제 =====================

    @Transactional
    public void deleteModuleLogs(Long moduleNum, Long placeId) {
        Module module = moduleRepository.findByModuleNumAndPlaceId(moduleNum, placeId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "등록되지 않은 모듈: " + moduleNum + ", 장소: " + placeId));

        Long moduleId = module.getId();
        sosRepository.delete(moduleId);
        leaveRepository.delete(moduleId);
        wearingRepository.delete(moduleId);
        log.info("[Admin] 모듈 {} 로그 삭제 완료 - 장소: {}", moduleNum, placeId);
    }

    // ===================== 알림 이력 =====================
    public List<AlertHistoryResponse> getAlertHistory(Long placeId) {
        List<AlertHistoryResponse> result = new ArrayList<>();

        sosRepository.findByPlaceId(placeId).forEach(sos ->
                result.add(new AlertHistoryResponse(
                        "SOS",
                        sos.getId(),
                        sos.getModule().getModuleNum(),
                        placeId,
                        sos.getSosAt(),
                        sos.getIsConfirmed(),
                        sos.getConfirmedAt()
                ))
        );

        leaveRepository.findByPlaceId(placeId).forEach(leave ->
                result.add(new AlertHistoryResponse(
                        "LEAVE",
                        leave.getId(),
                        leave.getModule().getModuleNum(),
                        placeId,
                        leave.getLeavedAt(),
                        null,
                        null
                ))
        );

        wearingRepository.findByPlaceId(placeId).forEach(wearing ->
                result.add(new AlertHistoryResponse(
                        "WEARING",
                        wearing.getId(),
                        wearing.getModule().getModuleNum(),
                        placeId,
                        wearing.getRemovedAt(),
                        null,
                        null
                ))
        );

        result.sort((a, b) -> b.getOccurredAt().compareTo(a.getOccurredAt()));
        return result;
    }

    // ===================== AP CRUD =====================

    public List<Ap> getApList(Long placeId) {
        return apRepository.findByPlaceId(placeId);
    }

    @Transactional
    public Ap createAp(ApRequest request) {
        Place place = placeRepository.findById(request.getPlaceId())
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 장소: " + request.getPlaceId()));

        Ap ap = new Ap();
        ap.setSsid(request.getSsid());
        ap.setXCoordinate(request.getXCoordinate());
        ap.setYCoordinate(request.getYCoordinate());
        ap.setFloor(request.getFloor());
        ap.setPlace(place);
        return apRepository.save(ap);
    }

    @Transactional
    public Ap updateAp(Long apId, ApRequest request) {
        Ap ap = apRepository.findById(apId)
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 AP: " + apId));

        ap.setSsid(request.getSsid());
        ap.setXCoordinate(request.getXCoordinate());
        ap.setYCoordinate(request.getYCoordinate());
        ap.setFloor(request.getFloor());
        return apRepository.save(ap);
    }

    @Transactional
    public void deleteAp(Long apId) {
        apRepository.deleteById(apId);
    }

    // ===================== 지도 이미지 =====================

    public void uploadMap(Long placeId, MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String ext = (originalFilename != null && originalFilename.contains("."))
                ? originalFilename.substring(originalFilename.lastIndexOf('.'))
                : ".png";

        Path dir = Paths.get(mapUploadDir);
        if (!Files.exists(dir)) Files.createDirectories(dir);

        // 기존 파일 삭제 (확장자가 달라질 수 있으므로)
        Files.list(dir)
                .filter(p -> p.getFileName().toString().startsWith("map_" + placeId + "."))
                .forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException ignored) {} });

        String filename = "map_" + placeId + ext;
        Files.copy(file.getInputStream(), dir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
        log.info("[Admin] 지도 이미지 저장 완료 - 장소: {}, 파일: {}", placeId, filename);
    }

    private Path findMapFile(Long placeId) throws IOException {
        Path dir = Paths.get(mapUploadDir);
        if (!Files.exists(dir)) return null;
        return Files.list(dir)
                .filter(p -> p.getFileName().toString().startsWith("map_" + placeId + "."))
                .findFirst()
                .orElse(null);
    }

    public byte[] getMapImage(Long placeId) throws IOException {
        Path path = findMapFile(placeId);
        if (path == null) return null;

        if (!Files.exists(path)) return null;
        return Files.readAllBytes(path);
    }

    public MediaType getMapMediaType(Long placeId) {
        try {
            Path path = findMapFile(placeId);
            if (path == null) return MediaType.APPLICATION_OCTET_STREAM;
            String name = path.getFileName().toString().toLowerCase();
            if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return MediaType.IMAGE_JPEG;
            if (name.endsWith(".gif")) return MediaType.IMAGE_GIF;
            return MediaType.IMAGE_PNG;
        } catch (IOException e) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}

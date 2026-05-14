-- 로컬 테스트용 초기 데이터

-- 장소
INSERT INTO place (place_id, place_name) VALUES (1, '테스트 장소');

-- AP (위치 계산용) — 10×10m 직사각형 배치
INSERT INTO ap (ap_id, ssid, x_coordinate, y_coordinate, place_id) VALUES (1, 'AP1',  0.0,  0.0, 1);
INSERT INTO ap (ap_id, ssid, x_coordinate, y_coordinate, place_id) VALUES (2, 'AP2',  5.0,  0.0, 1);
INSERT INTO ap (ap_id, ssid, x_coordinate, y_coordinate, place_id) VALUES (3, 'AP3', 10.0,  0.0, 1);
INSERT INTO ap (ap_id, ssid, x_coordinate, y_coordinate, place_id) VALUES (4, 'AP4',  0.0, 10.0, 1);
INSERT INTO ap (ap_id, ssid, x_coordinate, y_coordinate, place_id) VALUES (5, 'AP5',  5.0, 10.0, 1);
INSERT INTO ap (ap_id, ssid, x_coordinate, y_coordinate, place_id) VALUES (6, 'AP6', 10.0, 10.0, 1);

-- 모듈 (module_num=1, place_id=1)
INSERT INTO module (module_id, module_num, place_id) VALUES (1, 1, 1);

-- 관리자
INSERT INTO manager (manager_id, login_id, login_pw, name) VALUES (1, 'admin', 'admin123', '관리자');

-- 관리자-장소 매핑
INSERT INTO manager_place (manager_place_id, manager_id, place_id) VALUES (1, 1, 1);

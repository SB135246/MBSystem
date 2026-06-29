# MBSystem (미아 방지 시스템)

## 프로젝트 소개

대형 쇼핑몰과 같은 실내 공간에서 발생하는 미아 상황을 예방하고 신속하게 대응하기 위한 실시간 미아 방지 시스템입니다.

ESP32 센서에서 수집한 Wi-Fi RSSI 데이터를 기반으로 보호 대상의 위치를 추정하고, 위험 상황(이탈 감지)이 발생하면 관리자에게 실시간 알림을 전송할 수 있도록 구현하였습니다.

* **개발 기간** : 2026.04 ~ 2026.06
* **프로젝트 유형** : 졸업작품
* **개발 인원** : 6명
* **담당 역할** : Backend / Deployment

---

## 🛠 Tech Stack

### Backend

* Java
* Spring Boot
* Spring Security
* WebSocket

### Database

* AWS RDS

### DevOps

* Docker
* AWS EC2
* Git / GitHub

---

## 담당 역할

### 1. AWS 기반 백엔드 서버 배포

* AWS EC2 환경 구축
* Docker를 이용한 Spring Boot 애플리케이션 배포
* Docker Image 교체 방식의 CI/CD 환경 구성
* AWS RDS와 백엔드 서버 연동

---

### 2. Spring Security 및 CORS 설정

* Spring Security 설정
* API 접근 정책 구성
* WebSocket 엔드포인트 허용
* CORS 정책 설정을 통한 프론트엔드 연동 지원

---

### 3. 실시간 이탈 감지 서비스 개발

ESP32에서 전달되는 센서 데이터를 분석하여 보호 대상의 이탈 여부를 판단하는 서비스를 구현하였습니다.

주요 기능

* 이탈 여부 판단 로직 구현
* 중복 알림 방지 로직 구현
* 이탈 기록 DB 저장
* WebSocket을 이용한 관리자 실시간 알림 전송
* 관리자 화면 실시간 이벤트 브로드캐스팅

---

## 주요 기능

* Wi-Fi RSSI 기반 위치 추정
* 보호 대상 위치 모니터링
* 실시간 이탈 감지
* 관리자 실시간 알림
* WebSocket 기반 실시간 통신

---

## Trouble Shooting

### AWS 배포 및 DB 연결

Docker 환경에서 Spring Boot 서버와 AWS RDS를 연동하는 과정에서 네트워크 및 환경설정 문제를 해결하며 실제 서버 배포 경험을 쌓았습니다.

### ESP32 실시간 데이터 처리

ESP32에서 약 8초 주기로 센서 데이터가 전송되는 구조였기 때문에 데이터 수신 시점에 따라 알림이 중복되거나 누락될 수 있는 문제가 발생했습니다.

이를 해결하기 위해 상태 관리 로직을 구현하여 중복 알림을 방지하고 안정적인 실시간 알림 시스템을 구축하였습니다.

---

## 프로젝트를 통해 배운 점

* Spring Boot 기반 REST API 설계
* Spring Security 설정 및 CORS 처리
* Docker 기반 애플리케이션 배포
* AWS EC2 / RDS 운영 경험
* WebSocket을 이용한 실시간 데이터 처리
* 팀 프로젝트 협업 및 Git 활용 경험

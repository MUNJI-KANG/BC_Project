# BC_Contest (Django) — 공공 체육시설 조회/관리 + 예약 운영 + 안전점검 데이터 동기화

## 1) 프로젝트 개요

공공 데이터(체육시설 안전점검 결과)를 기반으로 **사용자는 시설을 검색/상세조회**하고, **관리자는 커스텀 관리자 페이지에서 시설을 등록/수정/첨부파일 관리/예약 현황 관리**를 수행하는 웹 서비스입니다.

정기 스케줄러(crontab)로 공공 API 데이터를 주기적으로 동기화하여 최신 시설 정보를 유지합니다.

---

## 2) 내가 담당한 역할 (핵심 기여)

### 시설관리(관리자/사용자) 기능 구현

- **사용자 시설 화면**
    - 시설 목록 조회/검색/지역 필터 및 페이지네이션
    - 시설 상세 조회(공공시설 DB + 등록된 커스텀 정보(FacilityInfo) 우선 병합)
    - 시설 댓글 작성(공통 Comment 모델 사용)
    - 지도(카카오) 연동을 위한 좌표 처리 및 지오코딩 캐싱
- **관리자 커스텀 페이지**
    - 시설 추가/등록/목록/상세/수정/삭제
    - 시설 첨부파일 업로드/다운로드
    - 예약 현황 관리 및 타임슬롯 취소 API 제공
    - 종목(Sports) 관리(추가/삭제/선택 저장)

### 스케줄러 기반 공공 데이터 동기화(update_facility)

- Django management command로 공공 API를 페이지 단위로 수집
- MySQL `INSERT ... ON DUPLICATE KEY UPDATE` 기반 UPSERT로 대용량 갱신 안정화
- 네트워크 오류 대비 retry/timeout 적용 및 트랜잭션 처리

### AWS 인프라 구성/배포

- **AWS EC2 + RDS(MySQL)** 구성
- **Nginx 리버스 프록시 + Gunicorn(Wsgi)** 기반 배포
- DB 연결/보안 설정/환경변수 기반 운영 설정 적용

---

## 3) 기술 스택

- Backend: **Django (settings 기준: Django 5.2.8)**
- DB: **MySQL (RDS)**
- Infra/Deploy: **AWS EC2, AWS RDS, Nginx, Gunicorn, crontab**
- External API:
    - 공공데이터포털(체육시설 안전점검 결과 API) 동기화
    - Kakao Map Script Key 사용(지도/좌표)

---

## 4) 시스템 아키텍처 (요약)

- Client(브라우저)
    - 사용자: 시설 목록/상세/댓글
    - 관리자: 커스텀 관리자 페이지(시설 등록/관리/예약 현황)
- Web(Server on EC2)
    - Django 앱: `facility`, `manager`, `reservation`, `board`, `member`, `common` 등
    - Gunicorn(WSGI) + Nginx Reverse Proxy
- DB(RDS MySQL)
    - 공공시설 원천 테이블 성격: `Facility`
    - 관리자 등록/보강 정보: `FacilityInfo`, `AddInfo`(첨부파일), `Comment`(댓글) 등
- Batch(crontab on EC2)
    - `python manage.py update_facility`로 공공데이터 주기 동기화

---

## 5) 주요 기능

### 사용자 기능 (facility 앱)

- 시설 목록 조회/검색/필터
- 시설 상세 정보 조회(등록 정보 우선 적용)
- 댓글 작성
- 지도 표시(카카오 키 기반)

### 관리자 기능 (manager 앱 커스텀 페이지)

- 시설 등록/조회/수정/삭제
- 종목 관리(Sports)
- 첨부파일 업로드/다운로드
- 예약 현황 조회 및 타임슬롯 취소 처리

### 배치 동기화 (update_facility)

- 공공 API 데이터를 페이지 단위로 수집하여 DB에 UPSERT
- 장애 대비 retry/timeout/트랜잭션 처리로 안정성 강화

---

## 6) 실행 방법 (로컬)

### 필수 환경변수(.env)

- DB: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- 공공 API: `DATA_API_KEY`
- 지도: `KAKAO_SCRIPT_KEY`

### 실행

```
# 의존성 설치 후
python manage.py migrate
python manage.py runserver
```

---

## 7) 트러블슈팅 (실제 코드/운영 포인트 기반)

1. **환경변수 누락으로 기능 실패**
- `DATA_API_KEY` 없으면 `update_facility`가 즉시 종료하도록 방어 로직이 있음(운영 배치에서 가장 흔한 장애 포인트)
- `DB_*`, `KAKAO_SCRIPT_KEY` 누락 시 페이지 렌더/DB 연결에서 문제 발생 가능
    
    → 배포 시 `.env` 또는 시스템 환경변수 주입을 표준화
    
1. **대량 데이터 동기화 시 성능/정합성**
- ORM 반복 저장 대신, MySQL UPSERT(`INSERT ... ON DUPLICATE KEY UPDATE`) + `executemany` + 트랜잭션으로 처리
- 페이지 단위 처리로 누적 로그를 남겨 운영 중 관측 가능
1. **외부 API 불안정(Timeout/5xx)**
- `timeout=20`, `max_retry=3`, `sleep=2s`로 재시도 로직을 넣어 일시적 장애에 강하게 설계
1. **사용자 목록 페이지 응답 지연**
- `facility_list`는 조회 결과를 캐싱(`cache.set`, TTL 적용)하고 페이지네이션으로 부하를 분산

---

## 8) 디렉터리 가이드(내 담당 중심)

- `BC/facility/`
    - `views.py`: 사용자 목록/상세/댓글, 지도 좌표 처리/캐싱
    - `templates/facility/`: `facility_list.html`, `facility_view.html`
    - `management/commands/update_facility.py`: 공공 API 동기화 배치
- `BC/manager/`
    - `urls.py`: 관리자 커스텀 페이지 라우팅
    - `facility_manager.py`: 시설 등록/수정/삭제/첨부파일/예약현황/종목관리
    - `templates/manager/`: 시설 관리 커스텀 UI

---

# 시설관리 기능 정리 (화면 흐름 + 주요 로직)

## 1) 사용자 화면 (facility)

### A. 시설 목록: `/facility/`

**흐름**

1. 지역 파라미터(`cpNm`, `cpbNm`) 또는 `keyword`로 검색
2. 로그인 사용자면 세션의 `user_id`를 기준으로 Member 주소를 참조해 기본 지역값 자동 세팅(없으면 서울/강남 기본)
3. `build_facility_queryset(...)`로 시설 queryset 구성(사용자 화면은 정상운영/공개 대상 위주)
4. `cache_key = facility_list:{cp_nm}:{cpb_nm}:{keyword}`로 결과 캐싱(TTL 적용)
5. `pager(...)`로 페이지네이션 후 템플릿 렌더

**포인트**

- 캐싱 + 페이지네이션으로 목록 성능을 확보
- 지도 표시를 위해 lat/lng 포함한 리스트 형태로 가공

### B. 시설 상세: `/facility/detail/<fk>/`

**흐름**

1. `FacilityInfo`(관리자 등록/보강) 먼저 조회, 없으면 `Facility`(공공 데이터) 기반으로 fallback
2. `FacilityInfo`가 있으면:
    - 대표 이미지(photo) 적용
    - 추가 첨부파일(`AddInfo`) 조회 후 이미지/비이미지 분리
    - 예약 가능 여부(reservation_time 등)로 플래그 생성
3. 시설 좌표/주소는 지도 표시를 위해 `kakao_for_map` 보정 처리
4. 템플릿(`facility_view.html`)에 데이터 전달

### C. 댓글 작성: `/facility/comment/<fk>/`

- 공통 `Comment` 모델로 저장(시설 상세 화면에서 사용자 의견 남김)

---

## 2) 관리자 커스텀 페이지 (manager)

관리자 URL들은 `BC/manager/urls.py` 기준으로 구성되며, 주요 기능은 `manager/facility_manager.py`에서 처리.

### A. 시설 추가(공공시설 검색 기반): `/manager/facility_add/`

- 관리자 권한 체크(`is_manager`)
- 지역/키워드로 공공시설 후보를 조회하여 “등록 대상”을 선택하는 흐름

### B. 시설 등록: `/manager/facility_register/`

- 선택한 공공시설을 기반으로 `FacilityInfo` 등 운영에 필요한 확장정보를 등록

### C. 시설 목록/상세/수정/삭제

- 목록: `/manager/facility_list/`
- 상세: `/manager/facility/<id>/`
- 수정: `/manager/facility/<id>/modify/`
- 삭제: `/manager/delete/`

### D. 첨부파일 다운로드

- `/manager/download/file/<file_id>/`
- `FileResponse`로 스트리밍 다운로드 제공

### E. 예약현황/취소

- 예약현황: `/manager/reservations/`
- 타임슬롯 취소 API: `/manager/api/reservations/cancel-timeslot/<reservation_num>/`

---

# update_facility 스케줄러 문서 (동작 방식 / 데이터 플로우)

## 1) 목적

공공데이터포털 “전국 체육시설 안전점검 결과” API를 주기적으로 수집하여 `Facility` 테이블을 최신 상태로 유지.

## 2) 실행 단위

- Django Management Command: `update_facility`
- 실행 예:

```
python manage.py update_facility
```

## 3) 데이터 플로우

1. 환경변수 `DATA_API_KEY` 로딩(없으면 종료)
2. API 호출 파라미터:
    - `pageNo`, `numOfRows=1000`, `resultType=json`
3. 응답 JSON에서 `items.item` 배열 추출
4. 각 item을 `Facility` 모델 컬럼 구조에 맞게 row로 매핑
5. MySQL UPSERT 수행
    - `INSERT INTO ... ON DUPLICATE KEY UPDATE ...`
    - `cursor.executemany()`로 배치 처리
    - `transaction.atomic()`으로 정합성 보장
6. 다음 페이지로 진행, items가 없으면 종료

## 4) 안정성 설계

- timeout: 20초
- 재시도: 최대 3회, 2초 sleep
- 5xx 서버 오류 시 예외 처리 후 재시도
- 페이지별 누적 처리 건수를 stdout 로그로 남김

## 5) crontab 운영 예시(개념)

- 운영 서버(EC2)에서 crontab으로 주기 실행
- 표준 출력/에러를 로그 파일로 리다이렉트하여 장애 추적 가능하게 구성

---

# AWS + RDS 연동 파트 문서화 (보안그룹/환경변수/마이그레이션/배포 포인트)

## 1) 구성

- EC2: Django 애플리케이션 서버
- RDS(MySQL): 서비스 DB
- Nginx: Reverse Proxy
- Gunicorn: WSGI App Server
- crontab: 배치 스케줄러(update_facility)

## 2) 보안그룹(핵심 포인트)

- RDS 보안그룹 인바운드:
    - MySQL 포트(일반적으로 3306)를 **EC2 보안그룹에서만 허용**
- EC2 보안그룹 인바운드:
    - 80/443(웹), 22(SSH, 제한된 IP 권장)

## 3) 환경변수 주입(운영 필수)

`settings.py`에서 DB 설정을 `os.getenv()`로 받도록 구성되어 있어, 배포 환경에서 다음 값이 반드시 제공되어야 함:

- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
    
    또한 기능별로:
    
- 배치: `DATA_API_KEY`
- 지도: `KAKAO_SCRIPT_KEY`

## 4) 마이그레이션/초기화(배포 시퀀스)

1. EC2에 소스 배포
2. `.env` 또는 시스템 환경변수 세팅
3. `python manage.py migrate` 실행
4. 정적파일/미디어 경로(Nginx 연동) 확인
5. Gunicorn 서비스 기동 + Nginx 리버스프록시 연결
6. crontab에 `update_facility` 등록 및 로그 경로 확정

## 5) 배포 포인트(실무 관점)

- DB 연결정보는 코드 하드코딩 금지(환경변수로 분리)
- 외부 API 장애 대비: retry/timeout 필수
- 대량 동기화는 ORM 루프 대신 UPSERT/배치로 처리
- 목록 페이지는 캐싱/페이지네이션으로 응답 시간 안정화

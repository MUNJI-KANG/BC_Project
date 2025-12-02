import os
import time
import json
import requests
import urllib.request
import urllib.parse
from django.core.cache import cache
from django.shortcuts import render
from django.core.paginator import Paginator


from facility.models import Facility
from facility.models import FacilityInfo
from member.models import Member

# 시설 api 가져오기
FACILITY_CACHE_TIMEOUT = 60 * 10  # 10분
GEO_CACHE_TTL = 60 * 30  # 30분
_geo_cache = {}


# 공공 api 안쓸거여
def facility(data, rows=200):

    DATA_API_KEY = os.getenv("DATA_API_KEY")  
    cp_nm = (data.get('cp_nm') or "").strip()
    cpb_nm = (data.get('cpb_nm') or "").strip()
    keyword = (data.get('keyword') or "").strip()

    cache_key = f"facility:{cp_nm}:{cpb_nm}:{keyword}:{rows}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    API_URL = "https://apis.data.go.kr/B551014/SRVC_API_FACI_SCHK_RESULT/TODZ_API_FACI_SAFETY"
    params = {
        "serviceKey": DATA_API_KEY,
        "numOfRows": rows,
        "pageNo": 1,
        "faci_gb_nm": "공공",
        "cp_nm": cp_nm or None,
        "cpb_nm": cpb_nm or None,
        "resultType": "json"
    }
    if keyword:
        params["faci_nm"] = keyword

    # None 값은 API 호출 시 제외
    params = {k: v for k, v in params.items() if v not in (None, "")}

    facilities = []

    try:
        res = requests.get(API_URL, params=params, timeout=5)
        res.raise_for_status()
        data = res.json()
        items = data["response"]["body"]["items"].get("item", [])

        if isinstance(items, dict):
            items = [items]

        for item in items:
            facilities.append({
                "id": item.get("faci_cd", ""),
                "name": item.get("faci_nm", ""),
                "address": item.get("faci_road_addr", ""), 
                "sido": item.get("cp_nm", ""),
                "sigungu": item.get("cpb_nm", ""), 
                "phone": item.get("faci_tel_no", ""),# 전화번호
                "fcob_nm" : item.get("fcob_nm",""), # 종목
                "homepage" : item.get("faci_homepage",""), # 홈페이지
                "faci_stat_nm" : item.get("faci_stat_nm",""), # 정상운영인지 아닌지
                "schk_tot_grd_nm" : item.get("schk_tot_grd_nm",""), # 주의인지 정상인지
                "schk_open_ymd": item.get("schk_open_ymd",""), # 안전점검공개일자
                "faci_gfa" : item.get("faci_gfa",""),
                "lat": None,
                "lng": None,
            })

        cache.set(cache_key, facilities, FACILITY_CACHE_TIMEOUT)

    except Exception as e:
        print("공공데이터 API 오류:", e)

    return facilities



# 시설목록
def facility_list(request):

    KAKAO_SCRIPT_KEY = os.getenv("KAKAO_SCRIPT_KEY")

    cp_nm = request.GET.get('cpNm')
    cpb_nm = request.GET.get('cpbNm')
    keyword = request.GET.get('keyword')    
    if keyword is None:
        keyword = ''

    # ----------------------------
    # 🔥 1) 시/도 파싱 데이터
    # ----------------------------
    SIDO_LIST = [
        ("서울특별시", ["서울", "서울시"]),
        ("부산광역시", ["부산", "부산시"]),
        ("대구광역시", ["대구"]),
        ("인천광역시", ["인천"]),
        ("광주광역시", ["광주"]),
        ("대전광역시", ["대전"]),
        ("울산광역시", ["울산"]),
        ("세종특별자치시", ["세종"]),
        ("경기도", ["경기"]),
        ("강원도", ["강원"]),
        ("충청북도", ["충북"]),
        ("충청남도", ["충남"]),
        ("전라북도", ["전북"]),
        ("전라남도", ["전남"]),
        ("경상북도", ["경북"]),
        ("경상남도", ["경남"]),
        ("제주특별자치도", ["제주"]),
    ]

    def parse_addr(addr_text: str):
        """
        addr1 에 "경기 과천시" 같이 들어온 경우
        시/도 + 시군구 자동 분리 후 정식명칭 반환
        """
        if not addr_text:
            return None, None

        addr_text = addr_text.strip()

        for sido_full, patterns in SIDO_LIST:
            for p in patterns:
                if addr_text.startswith(p):
                    sigungu = addr_text[len(p):].strip()
                    return sido_full, sigungu

        # 못 찾으면 fallback (거의 없음)
        return addr_text, ""

    # ----------------------------
    # 🔥 2) 로그인 사용자 주소 파싱
    # ----------------------------
    user = request.session.get("user_id")

    if not cp_nm or not cpb_nm:
        if user:
            try:
                member = Member.objects.get(user_id=user)

                parsed_sido, parsed_sigungu = parse_addr(member.addr1)

                # 시/도
                if not cp_nm:
                    cp_nm = parsed_sido

                # 구/군 (addr2 우선 → 없으면 addr1에서 파싱)
                if not cpb_nm:
                    cpb_nm = member.addr2.strip() if member.addr2 else parsed_sigungu

            except Member.DoesNotExist:
                pass

    # ----------------------------
    # 🔥 3) 비로그인 기본값
    # ----------------------------
    if not keyword: 
        if not cp_nm:
            cp_nm = "서울특별시"
        if not cpb_nm:
            cpb_nm = "강남구"

    # ----------------------------
    # 🔥 4) DB 필터링
    # ----------------------------
    qs = Facility.objects.all()

    if cp_nm:
        qs = qs.filter(cp_nm=cp_nm)

    if cpb_nm:
        qs = qs.filter(cpb_nm=cpb_nm)

    if keyword:
        qs = qs.filter(faci_nm__icontains=keyword)

    qs = qs.filter(faci_stat_nm__icontains='정상운영')

    # ----------------------------
    # 🔥 5) 가공 데이터 생성
    # ----------------------------
    facilities = []

    for f in qs:
        facilities.append({
            "id": f.faci_cd,
            "name": f.faci_nm or "",
            "address": f.faci_road_addr or f.faci_addr or "",
            "sido": f.cp_nm or "",
            "sigungu": f.cpb_nm or "",
            "phone": f.faci_tel_no or "",

            "fcob_nm": f.fcob_nm or "",
            "homepage": getattr(f, "faci_homepage", "") or "",
            "faci_stat_nm": getattr(f, "faci_stat_nm", "") or "",
            "schk_tot_grd_nm": getattr(f, "schk_tot_grd_nm", "") or "",
            "schk_open_ymd": getattr(f, "schk_open_ymd", "") or "",
            "faci_gfa": getattr(f, "faci_gfa", "") or "",

            "lat": f.faci_lat,
            "lng": f.faci_lot,
        })

    no_result = (len(facilities) == 0)
    per_page = int(request.GET.get("per_page", 10))
    page = int(request.GET.get("page", 1))

    paginator = Paginator(facilities, per_page)
    page_obj = paginator.get_page(page)

    page_facilities = kakao_for_map(page_obj)

    # ----------------------------
    # 🔥 6) 페이징 블록 계산
    # ----------------------------
    block_size = 10
    current_block = (page - 1) // block_size
    block_start = current_block * block_size + 1
    block_end = min(block_start + block_size - 1, paginator.num_pages)
    block_range = range(block_start, block_end + 1)

    # ----------------------------
    # 🔥 7) 최종 렌더
    # ----------------------------
    context = {
        "page_obj": page_obj,
        "page_facilities": page_facilities,
        "paginator": paginator,
        "per_page": per_page,
        "cpNm": cp_nm,
        "cpbNm": cpb_nm,
        "keyword": keyword,
        "page": page,
        "merged_count": len(facilities),
        "block_range": block_range,
        "block_start": block_start,
        "block_end": block_end,
        "no_result": no_result,
        "KAKAO_SCRIPT_KEY": KAKAO_SCRIPT_KEY,
    }
    
    return render(request, "facility_list.html", context)



# 주소를 기반으로 지도에 표시하기 위한 작업
def _get_cached_geo(address):
    entry = _geo_cache.get(address)
    if not entry:
        return None
    if time.time() - entry["ts"] > GEO_CACHE_TTL:
        _geo_cache.pop(address, None)
        return None
    return entry["coords"]


def _set_cached_geo(address, lat, lng):
    _geo_cache[address] = {
        "coords": (lat, lng),
        "ts": time.time()
    }


def kakao_for_map(page_obj):
    KAKAO_REST_KEY = os.getenv("KAKAO_REST_API_KEY")
    headers = {"Authorization": f"KakaoAK {KAKAO_REST_KEY}"} if KAKAO_REST_KEY else None

    for fac in page_obj:

        # 공공데이터 주소는 이미 완전한 도로명주소다!
        full_addr = fac.get("address") or ""
        fac["full_address"] = full_addr

        fac["lat"] = None
        fac["lng"] = None

        if not (headers and full_addr):
            continue

        cached_coords = _get_cached_geo(full_addr)
        if cached_coords:
            fac["lat"], fac["lng"] = cached_coords
            continue

        try:
            resp = requests.get(
                "https://dapi.kakao.com/v2/local/search/address.json",
                params={"query": full_addr},
                headers=headers,
                timeout=3,
            )
            data = resp.json()
            docs = data.get("documents")

            if docs:
                lat = float(docs[0]["y"])
                lng = float(docs[0]["x"])
                fac["lat"] = lat
                fac["lng"] = lng
                _set_cached_geo(full_addr, lat, lng)

        except Exception as e:
            print("카카오 지오코딩 오류:", e)

    return list(page_obj)

def facility_detail(request, fk):
    KAKAO_SCRIPT_KEY = os.getenv("KAKAO_SCRIPT_KEY")

    try:
        # 1) FacilityInfo / Facility 조회
        facility_info = FacilityInfo.objects.filter(facility_id=fk).first()
        facility = Facility.objects.filter(faci_cd=fk).first()

        if not facility_info and not facility:
            return render(request, "facility_view.html", {
                "error": "시설 정보를 찾을 수 없습니다."
            })

        # 2) 기본 데이터 구조
        r_data = {
            "id": fk,
            "name": "",
            "address": "",
            "sido": "",
            "sigungu": "",
            "phone": "",
            "homepage": "",
            "fcob_nm": "",
            "faci_stat_nm": "",
            "schk_tot_grd_nm": "",
            "lat": None,
            "lng": None,
            "image_url": "/media/default.png",
        }

        # ✅ 예약 관련 기본값
        can_reserve = False
        reserve_message = "해당 시설에 문의해주세요"

        # 3) Case 1: FacilityInfo 우선 적용
        if facility_info:
            # 기본 정보
            r_data["name"] = facility_info.faci_nm or r_data["name"]
            r_data["address"] = facility_info.address or r_data["address"]
            r_data["sido"] = facility_info.sido or r_data["sido"]
            r_data["sigungu"] = facility_info.sigugun or r_data["sigungu"]
            r_data["phone"] = facility_info.tel or r_data["phone"]
            r_data["homepage"] = facility_info.homepage or r_data["homepage"]

            # ★ 이미지: FacilityInfo 먼저
            if facility_info.photo:
                r_data["image_url"] = facility_info.photo.url
            else:
                r_data["image_url"] = "/media/default.png"

            # ✅ 예약 가능 여부 (reservation_time 이 있으면 True)
            if facility_info.reservation_time:
                can_reserve = True
                reserve_message = "가능"

            # 부족한 부분 Facility 테이블에서 채우기
            if facility:
                r_data["sido"] = r_data["sido"] or facility.cp_nm
                r_data["sigungu"] = r_data["sigungu"] or facility.cpb_nm
                r_data["phone"] = r_data["phone"] or facility.faci_tel_no
                r_data["homepage"] = r_data["homepage"] or facility.faci_homepage
                r_data["fcob_nm"] = facility.fcob_nm or ""
                r_data["faci_stat_nm"] = facility.faci_stat_nm or ""
                r_data["schk_tot_grd_nm"] = facility.schk_tot_grd_nm or ""
                r_data["lat"] = facility.faci_lat
                r_data["lng"] = facility.faci_lot

        # 4) Case 2: FacilityInfo가 없는 경우 (→ 네이버 이미지)
        else:
            # Facility 데이터로 기본 채우기
            r_data = {
                "id": facility.faci_cd,
                "name": facility.faci_nm or "",
                "address": facility.faci_road_addr or facility.faci_addr or "",
                "sido": facility.cp_nm or "",
                "sigungu": facility.cpb_nm or "",
                "phone": facility.faci_tel_no or "",
                "homepage": facility.faci_homepage or "",
                "fcob_nm": facility.fcob_nm or "",
                "faci_stat_nm": facility.faci_stat_nm or "",
                "schk_tot_grd_nm": facility.schk_tot_grd_nm or "",
                "lat": facility.faci_lat,
                "lng": facility.faci_lot,
                "image_url": "/media/default.png",
            }

            # ★ FacilityInfo 없으면 네이버 이미지 검색 실행
            query = r_data["name"]
            img_url = get_naver_image(query)

            if img_url:
                r_data["image_url"] = img_url
            else:
                r_data["image_url"] = "/media/default.png"

            # 🔹 FacilityInfo가 아예 없으니까 can_reserve=False 유지
            #     => "해당 시설에 문의해주세요" + 예약 버튼 없음

        # 5) 좌표 없으면 카카오 지오코딩
        if not r_data["lat"] or not r_data["lng"]:
            r_data = kakao_for_map([r_data])[0]

        # 6) 템플릿 렌더링
        return render(request, "facility_view.html", {
            "facility": r_data,
            "KAKAO_SCRIPT_KEY": KAKAO_SCRIPT_KEY,
            "can_reserve": can_reserve,          # ✅ 추가
            "reserve_message": reserve_message,  # ✅ 추가
        })

    except Exception as e:
        print("[facility_detail ERROR]", e)
        import traceback
        print(traceback.format_exc())
        return render(request, "facility_view.html", {
            "error": f"상세 정보를 불러오는 중 오류가 발생했습니다: {str(e)}"
        })



# 네이버 이미지로 한번 해보자

def get_naver_image(query):
    """
    네이버 이미지 검색 API - 시설명 기반 사진 1장 반환
    """
    NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID")
    NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET")

    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        print("❌ 네이버 API 키 없음")
        return None

    # 검색어 인코딩
    enc_query = urllib.parse.quote(query)

    url = f"https://openapi.naver.com/v1/search/image?query={enc_query}&display=1&sort=sim"

    # 요청 객체 생성
    req = urllib.request.Request(url)
    req.add_header("X-Naver-Client-Id", NAVER_CLIENT_ID)
    req.add_header("X-Naver-Client-Secret", NAVER_CLIENT_SECRET)

    try:
        response = urllib.request.urlopen(req, timeout=3)
        rescode = response.getcode()

        if rescode == 200:
            response_body = response.read().decode('utf-8')
            data = json.loads(response_body)

            items = data.get("items")
            if not items:
                print("❌ 네이버 이미지 없음:", query)
                return None

            # 가장 첫 번째 이미지 링크 반환
            return items[0].get("link")
        else:
            print("네이버 API 오류코드:", rescode)
            return None

    except Exception as e:
        print("네이버 이미지 검색 오류:", e)
        return None

 
from django.shortcuts import render
import random
import string
from datetime import datetime, timedelta
# TODO: DB 연결 이후 쿼리로 교체하고 삭제 필요
from common.utils import get_notice_pinned_posts, get_recruitment_dummy_list


def index(request):
    # TODO: DB 연결 이후 쿼리로 교체하고 삭제 필요 - 공지사항: 고정 게시글 중 최신순 상위 2개
    # 공통 함수에서 가져온 후 정렬 및 선택
    pinned_posts = get_notice_pinned_posts()
    
    # 날짜를 datetime 객체로 변환하여 정렬
    for post in pinned_posts:
        post["date_obj"] = datetime.strptime(post["date"], "%Y-%m-%d")
    
    # 최신순으로 정렬하고 상위 2개만 선택
    pinned_posts.sort(key=lambda x: x["date_obj"], reverse=True)
    pinned_notices = pinned_posts[:2]
    
    # content 추가 및 날짜 포맷팅
    for idx, notice in enumerate(pinned_notices, 1):
        notice["id"] = idx
        notice["content"] = f"할래말래 서비스 이용 안내 및 주의사항을 확인해주세요. {notice['title']} 관련 내용입니다..."
        notice["date"] = notice["date_obj"]  # datetime 객체로 교체
        notice["date_formatted"] = {
            "day": notice["date"].strftime("%d"),
            "month_year": notice["date"].strftime("%Y.%m")
        }
    
    # TODO: DB 연결 이후 쿼리로 교체하고 삭제 필요 - 모집할래: 최신순 상위 2개
    # 공통 함수에서 가져온 후 정렬 및 선택
    dummy_list = get_recruitment_dummy_list()
    
    # 최신순으로 정렬 (recruitment/views.py와 동일)
    dummy_list.sort(key=lambda x: x["date"], reverse=True)
    
    # 상위 2개만 선택
    recruitment_list = dummy_list[:2]
    
    # 날짜를 datetime 객체로 변환하고 content 추가
    recruitment_contents = [
        "주말 오전 테니스 함께 즐길 분을 모집합니다. 초보자도 환영합니다!",
        "매주 토요일 축구 모임에 참가하실 분을 모집합니다. 건강한 운동 함께 해요!",
        "배드민턴 함께 즐길 분을 찾습니다. 실력 무관, 즐겁게 운동하고 싶으신 분 환영!",
        "농구 동호회에서 새로운 멤버를 모집합니다. 매주 일요일 정기 모임 있습니다.",
    ]
    
    for idx, recruit in enumerate(recruitment_list, 1):
        recruit["id"] = idx
        recruit["date"] = datetime.strptime(recruit["date"], "%Y-%m-%d")
        recruit["content"] = recruitment_contents[idx % len(recruitment_contents)]
        recruit["date_formatted"] = {
            "day": recruit["date"].strftime("%d"),
            "month_year": recruit["date"].strftime("%Y.%m")
        }
    
    context = {
        "notice_list": pinned_notices,
        "recruitment_list": recruitment_list,
    }
    
    return render(request, 'index.html', context)

def login(request):
    return render(request, 'login.html')

def signup(request):
    return render(request, 'signup.html')

def find_id(request):
    if request.method == "POST":
        name = request.POST.get('name')
        birthday = request.POST.get('birthday')
        phone1 = request.POST.get('phone1')
        phone2 = request.POST.get('phone2')
        phone3 = request.POST.get('phone3')

        # 생일 검증
        if len(birthday) != 8 or not birthday.isdigit():
            return render(request, "findID.html", {
                "error": "생년월일은 8자리 숫자로 입력해주세요. (예: 20020528)"
            })

        # 전화번호 검증
        if (len(phone1) != 3 or not phone1.isdigit() or
            len(phone2) != 4 or not phone2.isdigit() or
            len(phone3) != 4 or not phone3.isdigit()):
            return render(request, "findID.html", {
                "error": "전화번호는 숫자만 입력해야 하며 3-4-4 자리여야 합니다."
            })

        phone_num = phone1 + phone2 + phone3

        # TODO: DB에서 이름, 생년월일, phone_num 이 일치하는 정보 찾기

        return render(request, 'findID.html', {
            "result_id": "ID"
        })

    return render(request, 'findID.html')

def generate_random_pw(length=12):
    letters = string.ascii_letters        # ABCabc
    digits = string.digits               # 012345
    symbols = "!@#$%^&*()"
    char_set = letters + digits + symbols

    return ''.join(random.choice(char_set) for _ in range(length))


def find_pw(request):
    if request.method == "POST":
        user_id = request.POST.get("user_id")
        name = request.POST.get("name")
        birthday = request.POST.get("birthday")
        phone1 = request.POST.get("phone1")
        phone2 = request.POST.get("phone2")
        phone3 = request.POST.get("phone3")

        # 생년월일 검증
        if len(birthday) != 8 or not birthday.isdigit():
            return render(request, "findPW.html", {
                "error": "생년월일은 8자리 숫자로 입력해주세요. (예: 20020528)"
            })

        # 전화번호 검증
        if (len(phone1) != 3 or not phone1.isdigit() or
            len(phone2) != 4 or not phone2.isdigit() or
            len(phone3) != 4 or not phone3.isdigit()):
            return render(request, "findPW.html", {
                "error": "전화번호는 3-4-4 숫자로 입력해주세요."
            })

        phone_num = phone1 + phone2 + phone3
        
        # TODO : DB user_id = user_id 확인 하는 if 문 작성 필요 

        # 12자리 랜덤 비밀번호 생성
        new_password = generate_random_pw(12)


        return render(request, "findPW.html", {
            "result_pw": new_password
        })

    return render(request, "findPW.html")
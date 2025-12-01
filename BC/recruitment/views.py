from django.shortcuts import render, redirect

from django.core.paginator import Paginator
from .models import *
from member.models import Member

from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, authenticate
from django.contrib import messages

# TODO: DB 연결 이후 쿼리로 교체하고 삭제 필요
from common.utils import get_recruitment_dummy_list



def recruitment_list(request):
    # 1) 기본 QuerySet
    qs = Community.objects.all()

    # 2) 정렬값
    sort = request.GET.get("sort", "recent")

    if sort == "title":
        qs = qs.order_by("title")
    elif sort == "views":
        qs = qs.order_by("-view_cnt")
    else:  # recent (등록일 최신순)
        qs = qs.order_by("-reg_date")

    # 3) 페이지당 표시 개수
    per_page = int(request.GET.get("per_page", 15))

    # 4) 현재 페이지
    page = int(request.GET.get("page", 1))

    # 5) Paginator
    paginator = Paginator(qs, per_page)
    page_obj = paginator.get_page(page)

    # 6) 블록 페이징
    block_size = 5
    current_block = (page - 1) // block_size
    block_start = current_block * block_size + 1
    block_end = block_start + block_size - 1

    if block_end > paginator.num_pages:
        block_end = paginator.num_pages

    block_range = range(block_start, block_end + 1)

    context = {
        "page_obj": page_obj,
        "paginator": paginator,
        "per_page": per_page,
        "page": page,
        "sort": sort,
        "block_range": block_range,
        "block_start": block_start,
        "block_end": block_end,
    }

    return render(request, "recruitment_list.html", context)


def write(request):
    # 0) 세션에 로그인 정보 있는지 확인
    user_id = request.session.get("user_id")   # 로그인할 때 넣어줬던 값

    if not user_id:
        messages.error(request, "로그인이 필요합니다.")
        return redirect("/member/login/")  # 로그인 URL에 맞게 수정

    # 1) 세션의 user_id 로 Member 객체 가져오기
    try:
        member = Member.objects.get(user_id=user_id)
    except Member.DoesNotExist:
        # 세션에는 있는데 실제 회원은 없으면 세션 정리 후 로그인 페이지로
        request.session.flush()
        messages.error(request, "다시 로그인 해주세요.")
        return redirect("/member/login/")

    # 2) POST 처리
    if request.method == "POST":
        title = request.POST.get("title")
        region = request.POST.get("sido")
        region2 = request.POST.get("sigungu")
        sport_type = request.POST.get("sport")
        num_member = request.POST.get("personnel")
        contents = request.POST.get("content")
        chat_url = request.POST.get("openchat_url") or None   # 빈값이면 None

        # facility = request.POST.get("facility_name") or None   # 빈값이면 None
        
        # 🔹 시설 입력값 처리
        raw_facility = request.POST.get("facility", "").strip()
        if raw_facility:
            facility = raw_facility
        else:
            facility = "미정"   # ← NULL 절대 안 보내게 강제
        
        recruit = Community.objects.create(
            title=title,
            region=region,
            region2=region2,
            sport_type=sport_type,
            num_member=num_member,
            facility=facility,
            contents=contents,
            chat_url=chat_url,
            member_id=member,   # ✅ FK 에 실제 Member 인스턴스 넣기
        )

        return redirect("recruitment_detail", pk=recruit.pk)

    # 3) GET 요청이면 작성 폼 보여주기
    return render(request, "recruitment_write.html")





def update(request,pk):
    return render(request, 'recruitment_update.html')
def detail(request, pk):
    recruit={
        'pk':pk,
        'writer':'작성자',
        'title':'제목~ 운동같이할랭?',
        'sido':'서울특별시',
        'sigungu':'양천구',
        'sport':'축구',
        'personnel':10,
        'facility_name':'체육센터',
        'content' : """sodyudaspjdofpasdjfp;oijwerpoaskdlgj
        asldifj;oawiejr내용입니다!!ㄴ아아아아아아아아앙아아아아아아""",
        'views':12
    }
    context ={
        'recruit':recruit,
    }
    # return render(request, 'recruitment_detail.html')
    return render(request, 'recruitment_detail.html', context)
from django.shortcuts import render
from django.core.paginator import Paginator
import random
from datetime import datetime, timedelta
# TODO: DB 연결 이후 쿼리로 교체하고 삭제 필요
from common.utils import get_notice_pinned_posts

def notice(request):
    # TODO: DB 연결 이후 쿼리로 교체하고 삭제 필요 - 더미 데이터 생성 (100개)
    dummy_list = []
    titles = [
        "공지사항", "안내", "업데이트", "변경사항", "중요 공지",
        "시스템 점검", "이벤트 안내", "서비스 이용", "회원 안내", "정책 변경"
    ]
    authors = ["관리자", "운영팀", "시스템", "고객센터", "할래말래팀"]
    
    for i in range(1, 101):
        random_title = random.choice(titles)
        random_author = random.choice(authors)
        # 랜덤 날짜 생성 (최근 1년 내)
        days_ago = random.randint(0, 365)
        random_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        
        dummy_list.append({
            "title": f"{random_title} {i}번째 공지사항입니다",
            "date": random_date,
            "views": random.randint(10, 5000),
            "author": random_author
        })
    
    # TODO: DB 연결 이후 쿼리로 교체하고 삭제 필요 - 고정 게시글 5개 생성 (공통 함수 사용)
    pinned_posts = get_notice_pinned_posts()
    
    # 검색 기능
    keyword = request.GET.get("keyword", "")
    search_type = request.GET.get("search_type", "all")
    
    if keyword:
        if search_type == "title":
            dummy_list = [item for item in dummy_list if keyword in item["title"]]
        elif search_type == "author":
            dummy_list = [item for item in dummy_list if keyword in item["author"]]
        elif search_type == "all":
            dummy_list = [item for item in dummy_list if keyword in item["title"] or keyword in item.get("author", "")]
    
    # 정렬 기능
    sort = request.GET.get("sort", "recent")
    if sort == "title":
        dummy_list.sort(key=lambda x: x["title"])
    elif sort == "views":
        dummy_list.sort(key=lambda x: x["views"], reverse=True)
    else:  # recent
        dummy_list.sort(key=lambda x: x["date"], reverse=True)
    
    # 페이징
    per_page = int(request.GET.get("per_page", 15))
    page = int(request.GET.get("page", 1))
    
    paginator = Paginator(dummy_list, per_page)
    page_obj = paginator.get_page(page)
    
    # 페이지 기준 블록
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
        "pinned_posts": pinned_posts,
    }
    
    return render(request, 'notice.html', context)

def event(request):
    # 더미 데이터 생성 (100개)
    dummy_list = []
    titles = [
        "이벤트", "특별 할인", "프로모션", "경품 이벤트", "참여 이벤트",
        "시작 이벤트", "종료 임박", "신규 이벤트", "연말 이벤트", "신년 이벤트"
    ]
    authors = ["이벤트팀", "마케팅팀", "운영팀", "관리자", "할래말래팀"]
    
    for i in range(1, 101):
        random_title = random.choice(titles)
        random_author = random.choice(authors)
        # 랜덤 날짜 생성 (최근 1년 내)
        days_ago = random.randint(0, 365)
        random_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        
        dummy_list.append({
            "title": f"{random_title} {i}번째 이벤트가 진행 중입니다!",
            "date": random_date,
            "views": random.randint(10, 5000),
            "author": random_author
        })
    
    # TODO: DB 연결 이후 쿼리로 교체하고 삭제 필요 - 고정 게시글 5개 생성
    pinned_posts = []
    for i in range(1, 6):
        days_ago = random.randint(0, 30)  # 최근 30일 내
        random_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        pinned_posts.append({
            "title": f"🎉 [진행중] 고정 이벤트 {i} - 지금 바로 참여하세요!",
            "date": random_date,
            "views": random.randint(100, 10000),
            "author": "이벤트팀"
        })
    
    # 검색 기능
    keyword = request.GET.get("keyword", "")
    search_type = request.GET.get("search_type", "all")
    
    if keyword:
        if search_type == "title":
            dummy_list = [item for item in dummy_list if keyword in item["title"]]
        elif search_type == "author":
            dummy_list = [item for item in dummy_list if keyword in item["author"]]
        elif search_type == "all":
            dummy_list = [item for item in dummy_list if keyword in item["title"] or keyword in item.get("author", "")]
    
    # 정렬 기능
    sort = request.GET.get("sort", "recent")
    if sort == "title":
        dummy_list.sort(key=lambda x: x["title"])
    elif sort == "views":
        dummy_list.sort(key=lambda x: x["views"], reverse=True)
    else:  # recent
        dummy_list.sort(key=lambda x: x["date"], reverse=True)
    
    # 페이지네이션
    per_page = int(request.GET.get("per_page", 15))
    page = int(request.GET.get("page", 1))
    
    paginator = Paginator(dummy_list, per_page)
    page_obj = paginator.get_page(page)
    
    # 페이지 블록 계산
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
        "pinned_posts": pinned_posts,
    }
    
    return render(request, 'event.html', context)

def post(request):
    return render(request, 'post.html')

def faq(request):
    return render(request, 'faq.html')
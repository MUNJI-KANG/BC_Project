from django.shortcuts import render
from django.core.paginator import Paginator


from common.utils import get_event_dummy_list


def info(request):
    member = {
        'name':'최재영',
        'user_id':'young010514',
        'nickname':'ㅇㅇㅇ',
        'birthday' : '2001-01-01',
        'email':'test@email.com',
        'phone_num':'010-1111-2222',
        'addr1' :'서울특별시',
        'addr2' :'양천구',
        'addr3' :'신정동',
    }


    return render(request, 'info.html', member)
def edit(request):
    member = {
        'name':'최재영',
        'user_id':'young010514',
        'nickname':'ㅇㅇㅇ',
        'birthday' : '2001-01-01',
        'email':'test@email.com',
        'phone_num':'010-1111-2222',
        'addr1' :'서울특별시',
        'addr2' :'양천구',
        'addr3' :'신정동',
    }

    return render('', 'info_edit.html', member)

def edit_password(request):


    return render('', 'info_edit_password.html')


def myreservation(request):

    list =[
        {
            'reservation_id':'예약번호 예시',
            'facility':'예약시설 예시',
            'reservation_date' : '예약한 날짜 예시',
            'reg_date' : '결제한 날짜 예시',
        },
        {
            'reservation_id':'예약번호 예시',
            'facility':'예약시설 예시',
            'reservation_date' : '예약한 날짜 예시',
            'reg_date' : '결제한 날짜 예시',
        },
    ]
    return render('', 'myreservation.html', {'list' : list})


def myrecruitment(request):
    list =[
        {
            'community_id':'게시글번호 예시',
            'title':'게시글 제목임다',
            'reg_date' : '게시 날짜임다',
            'reg_date' : '게시 날짜임다',
            'view_cnt' : '조회수임다',
        },
    ]
    return render('', 'myrecruitment.html',{'list':list})

def myarticle(request):
    # TODO: DB 연결 이후 쿼리로 교체하고 삭제 필요 - 더미 데이터 생성 (100개, 캐싱됨)
    dummy_list = get_event_dummy_list()

    
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
        # "pinned_posts": pinned_posts,
    }
    
    return render(request, 'myarticle.html', context)










# def myarticle(request):
#     list =[
#         {
#             'article_id':'게시글번호 예시',
#             'title':'게시글 제목임다',
#             'reg_date' : '게시 날짜임다',
#             'view_cnt' : '조회수임다',
#         },
#     ]
#     return render('', 'myarticle.html',{'list':list})


def myjoin(request):
    list=[
        {
            'community_id':'모집글 번호 예시',
            'title' : '모집글 제목 예시',
            'num_member' : '몇명참여?',
            'join_stat' : '참여했냐?',
        },
    ]
    return render('', 'myjoin.html', {'list':list})




def mypage_base(request):
    return render(request, 'mypage_base.html')
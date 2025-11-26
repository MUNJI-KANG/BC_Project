from django.shortcuts import render
from django.core.paginator import Paginator
# TODO: DB 연결 이후 쿼리로 교체하고 삭제 필요
from common.utils import get_recruitment_dummy_list

def list(request):
    # TODO: DB 연결 이후 쿼리로 교체하고 삭제 필요 - 공통 함수에서 더미 리스트 가져오기
    dummy_list = get_recruitment_dummy_list()


    # 기본값: 최신순
    sort = request.GET.get("sort", "recent")

    if sort == "title":
        dummy_list.sort(key=lambda x: x["title"])

    elif sort == "views":
        dummy_list.sort(key=lambda x: x["views"], reverse=True)
    elif sort == "recent":

        dummy_list.sort(key=lambda x: x["date"], reverse=True)
    else:
        dummy_list.sort(key=lambda x: x["date"], reverse=True)

    per_page = int(request.GET.get("per_page", 15))

    # 현재 페이지 (기본값 1)
    page = int(request.GET.get("page", 1))
    # ---------------------------


    paginator = Paginator(dummy_list, per_page)
    page_obj = paginator.get_page(page)


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

    return render(request, "list.html", context)

def write(request):
    return render(request, 'write.html')
from django.shortcuts import render
from django.core.paginator import Paginator

def list(request):

    dummy_list = [
        {
            "title": f"테스트 모집글 {i}",
            "date": "2025-11-26",
            "views": i * 3
        }
        for i in range(1, 201)
    ]


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
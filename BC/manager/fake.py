# manager deatil ----
def manager_detail(request, article_id):

    article = Article.objects.get(article_id=article_id)
    board_type = article.board_id.board_name  # notice / event / post

    # 파일 로딩
    add_info = AddInfo.objects.filter(article_id=article_id)
    files = []
    images = []
    for f in add_info:
        ext = os.path.splitext(f.file_name)[1].lower()
        info = {
            "url": f"{settings.MEDIA_URL}{f.path}",
            "name": f.file_name,
            "is_image": ext in ['.jpg', '.jpeg', '.png', '.gif']
        }
        if info["is_image"]:
            images.append(info)
        else:
            files.append(info)

    return render(request, "manager_detail.html/", {
        "article": article,
        "board_type": board_type,
        "files": files,
        "images": images,
    })




def board_form(request):
    if request.method == "POST":
        title = request.POST.get('title')
        context = request.POST.get('context')
        notice_type = request.POST.get('notice_type')
        start_date = request.POST.get('start_date')
        end_date = request.POST.get('end_date')
        pin_top = request.POST.get('pin_top', '0')

        try:
            board = get_board_by_name('notice')

            member_id = request.session.get('manager_id')
            if not member_id:
                messages.error(request, "관리자 권한이 필요합니다.")
                return render(request, 'board_form.html', {'is_edit': False})
            try:
                member = Member.objects.get(member_id=member_id)
                if member.manager_yn != 1:
                    messages.error(request, "관리자 권한이 필요합니다.")
                    return render(request, 'board_form.html', {'is_edit': False})
            except Member.DoesNotExist:
                messages.error(request, "회원 정보를 찾을 수 없습니다.")
                return render(request, 'board_form.html', {'is_edit': False})

            always_on = 0 if notice_type == 'always' else 1
            if pin_top == '1':
                always_on = 0

            from django.utils.dateparse import parse_datetime
            start_datetime = parse_datetime(start_date) if start_date else None
            end_datetime = parse_datetime(end_date) if end_date else None

            article = Article.objects.create(
                title=title,
                contents=context,
                member_id=member,
                board_id=board,
                always_on=always_on,
                start_date=start_datetime,
                end_date=end_datetime,
            )

            handle_file_uploads(request, article)
            messages.success(request, "공지사항이 등록되었습니다.")
            return redirect('/manager/board_manager/')

        except Exception as e:
            messages.error(request, f"공지사항 등록 중 오류 발생: {e}")

    return render(request, 'board_form.html', {
        'is_edit': False
    })


def board_edit(request, article_id):
    """공지사항 게시글 수정"""

    # 관리자 체크
    if not is_manager(request):
        messages.error(request, "관리자 권한이 필요합니다.")
        return redirect('/manager/')
    
    try:
        board = get_board_by_name('notice')
        article_obj = Article.objects.get(
            article_id=article_id,
            board_id=board
        )
    except Article.DoesNotExist:
        messages.error(request, "게시글을 찾을 수 없습니다.")
        return redirect('/manager/board_manager/')
    
    # POST: 수정 처리
    if request.method == "POST":
        title = request.POST.get('title')
        context = request.POST.get('context')
        notice_type = request.POST.get('notice_type')
        start_date = request.POST.get('start_date')
        end_date = request.POST.get('end_date')
        pin_top = request.POST.get('pin_top', '0')

        try:
            # always_on 계산
            always_on = 0 if notice_type == 'always' else 1
            if pin_top == '1':
                always_on = 0

            from django.utils.dateparse import parse_datetime
            start_datetime = parse_datetime(start_date) if start_date else None
            end_datetime = parse_datetime(end_date) if end_date else None

            # 게시글 수정
            article_obj.title = title
            article_obj.contents = context
            article_obj.always_on = always_on
            article_obj.start_date = start_datetime
            article_obj.end_date = end_datetime
            article_obj.save()
            # --------------------------------------------
            #  기존 파일 삭제 기능
            # --------------------------------------------
            delete_ids = request.POST.getlist("delete_files")  # hidden input 들

            if delete_ids:
                files_to_delete = AddInfo.objects.filter(add_info_id__in=delete_ids)

                for f in files_to_delete:
                    # 실제 파일 삭제
                    if f.path:
                        file_path = os.path.join(settings.MEDIA_ROOT, f.path)
                        if os.path.exists(file_path):
                            os.remove(file_path)

                # DB 레코드 삭제
                files_to_delete.delete()

            # --------------------------------------------
            #  새로운 파일들 업로드
            # --------------------------------------------
            handle_file_uploads(request, article_obj)

            messages.success(request, "이벤트가 수정되었습니다.")
            return redirect(f'/manager/detail/{article_id}/')

        except Exception as e:
            import traceback
            print(f"[ERROR] 이벤트 수정 오류: {str(e)}")
            print(traceback.format_exc())
            messages.error(request, f"이벤트 수정 중 오류가 발생했습니다: {str(e)}")

    # GET: 기존 정보 불러오기
    add_info_objs = AddInfo.objects.filter(article_id=article_id)
    
    existing_files = []
    for add_info in add_info_objs:
        file_ext = os.path.splitext(add_info.file_name)[1].lower()
        existing_files.append({
            'id': add_info.add_info_id,
            'name': add_info.file_name,
            'url': f"{settings.MEDIA_URL}{add_info.path}",
            'is_image': file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
        })
    
    # 날짜 포맷
    start_date_str = article_obj.start_date.strftime('%Y-%m-%dT%H:%M') if article_obj.start_date else ''
    end_date_str = article_obj.end_date.strftime('%Y-%m-%dT%H:%M') if article_obj.end_date else ''

    context = {
        'article': article_obj,
        'existing_files': existing_files,
        'start_date': start_date_str,
        'end_date': end_date_str,
        'is_edit': True,
    }

    return render(request, 'board_form.html', context
                  



def event_form(request):
    if request.method == "POST":
        title = request.POST.get('title')
        context = request.POST.get('context')
        notice_type = request.POST.get('notice_type')
        start_date = request.POST.get('start_date')
        end_date = request.POST.get('end_date')
        pin_top = request.POST.get('pin_top', '0')  # 상단 고정 체크박스
        
        try:
            # board_name='event'로 조회
            board = get_board_by_name('event')
            
            # 관리자 계정
            member_id = request.session.get('manager_id')
            if not member_id:
                messages.error(request, "관리자 권한이 필요합니다.")
                return render(request, 'event_form.html')
            try:
                member = Member.objects.get(member_id=member_id)
                if member.manager_yn != 1:
                    messages.error(request, "관리자 권한이 필요합니다.")
                    return render(request, 'event_form.html')
            except Member.DoesNotExist:
                member = Member.objects.first()
                if not member:
                    messages.error(request, "회원 정보를 찾을 수 없습니다.")
                    return render(request, 'event_form.html')
            
            # always_on 설정
            always_on = 0 if notice_type == 'always' else 1
            if pin_top == '1':
                always_on = 0
            
            from django.utils.dateparse import parse_datetime
            start_datetime = parse_datetime(start_date) if start_date else None
            end_datetime = parse_datetime(end_date) if end_date else None
            
            # DB에 저장
            article = Article.objects.create(
                title=title,
                contents=context,
                member_id=member,
                board_id=board,
                always_on=always_on,
                start_date=start_datetime,
                end_date=end_datetime,
            )
            
            # 파일 업로드 처리
            handle_file_uploads(request, article)
            
            print(f"[DEBUG] 이벤트 저장 완료:")
            print(f"  - article_id: {article.article_id}")
            print(f"  - board_id: {board.board_id} (name: {board.board_name})")
            
            messages.success(request, "이벤트가 등록되었습니다.")
            return redirect('/manager/event_manager/')
        except Board.DoesNotExist:
            messages.error(request, "이벤트 게시판(board_name='event')을 찾을 수 없습니다. 초기 데이터를 생성해주세요.")
        except Exception as e:
            import traceback
            print(f"[ERROR] 이벤트 등록 오류: {str(e)}")
            print(traceback.format_exc())
            messages.error(request, f"이벤트 등록 중 오류가 발생했습니다: {str(e)}")
    
    return render(request, 'event_form.html')

def event_edit(request, article_id):
    """이벤트 게시글 수정"""

    # 관리자 체크
    if not is_manager(request):
        messages.error(request, "관리자 권한이 필요합니다.")
        return redirect('/manager/')

    # 기존 이벤트 게시글 로드
    try:
        board = get_board_by_name('event')
        article_obj = Article.objects.get(
            article_id=article_id,
            board_id=board
        )
    except Article.DoesNotExist:
        messages.error(request, "게시글을 찾을 수 없습니다.")
        return redirect('/manager/event_manager/')

    # POST: 수정 처리
    if request.method == "POST":
        title = request.POST.get('title')
        context = request.POST.get('context')
        notice_type = request.POST.get('notice_type')
        start_date = request.POST.get('start_date')
        end_date = request.POST.get('end_date')
        pin_top = request.POST.get('pin_top', '0')

        try:
            # always_on 처리
            always_on = 0 if notice_type == 'always' else 1
            if pin_top == '1':
                always_on = 0

            from django.utils.dateparse import parse_datetime
            start_datetime = parse_datetime(start_date) if start_date else None
            end_datetime = parse_datetime(end_date) if end_date else None

            # 필드 업데이트
            article_obj.title = title
            article_obj.contents = context
            article_obj.always_on = always_on
            article_obj.start_date = start_datetime
            article_obj.end_date = end_datetime
            article_obj.save()

            # --------------------------------------------
            #  기존 파일 삭제 기능
            # --------------------------------------------
            delete_ids = request.POST.getlist("delete_files")  # hidden input 들

            if delete_ids:
                files_to_delete = AddInfo.objects.filter(add_info_id__in=delete_ids)

                for f in files_to_delete:
                    # 실제 파일 삭제
                    if f.path:
                        file_path = os.path.join(settings.MEDIA_ROOT, f.path)
                        if os.path.exists(file_path):
                            os.remove(file_path)

                # DB 레코드 삭제
                files_to_delete.delete()

            # --------------------------------------------
            #  새로운 파일들 업로드
            # --------------------------------------------
            handle_file_uploads(request, article_obj)

            messages.success(request, "이벤트가 수정되었습니다.")
            return redirect(f'/manager/detail/{article_id}/')

        except Exception as e:
            import traceback
            print(f"[ERROR] 이벤트 수정 오류: {str(e)}")
            print(traceback.format_exc())
            messages.error(request, f"이벤트 수정 중 오류가 발생했습니다: {str(e)}")

    # GET: 기존 파일 조회
    add_info_objs = AddInfo.objects.filter(article_id=article_id)
    existing_files = []

    for add_info in add_info_objs:
        file_ext = os.path.splitext(add_info.file_name)[1].lower()
        existing_files.append({
            'id': add_info.add_info_id,  # template 의 data-file-id="{{ file.id }}"
            'name': add_info.file_name,
            'url': f"{settings.MEDIA_URL}{add_info.path}",
            'is_image': file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
        })

    # 날짜 포맷
    start_date_str = article_obj.start_date.strftime('%Y-%m-%dT%H:%M') if article_obj.start_date else ''
    end_date_str = article_obj.end_date.strftime('%Y-%m-%dT%H:%M') if article_obj.end_date else ''

    context = {
        'article': article_obj,
        'existing_files': existing_files,
        'start_date': start_date_str,
        'end_date': end_date_str,
        'is_edit': True,
    }

    return render(request, 'event_form.html', context)

def post_manager(request):
    # DB에서 자유게시판(post) 조회 (삭제된 것도 포함)
    try:
        board = get_board_by_name('post')
        queryset = Article.objects.select_related('member_id', 'board_id').filter(
            board_id=board
        ).order_by('-reg_date')
    except Exception:
        queryset = []
    
    per_page = int(request.GET.get("per_page", 15))

    try:
        page = int(request.GET.get("page", 1))
        if page < 1:
            page = 1
    except:
        page = 1

    paginator = Paginator(queryset, per_page)
    page_obj = paginator.get_page(page)

    # 페이지 블록
    block_size = 5
    current_block = (page - 1) // block_size
    block_start = current_block * block_size + 1
    block_end = min(block_start + block_size - 1, paginator.num_pages)

    # facility_json 형식으로 데이터 변환
    start_index = (page_obj.number - 1) * per_page
    facility_page = []
    
    for idx, article in enumerate(page_obj.object_list):
        delete_date_str = None
        if article.delete_date:
            # 이미 한국 시간으로 저장되어 있음
            delete_date_str = article.delete_date.strftime('%Y-%m-%d %H:%M')
        
        facility_page.append({
            "id": article.article_id,
            "title": article.title,
            "author": article.member_id.user_id if article.member_id else "",
            "row_no": start_index + idx + 1,
            "delete_date": delete_date_str,
        })

    context = {
        "page_obj": page_obj,
        "per_page": per_page,
        "facility_json": json.dumps(facility_page, ensure_ascii=False),
        "block_range": range(block_start, block_end + 1),
    }

    return render(request, 'post_manager.html', context)

def manager_post_detail(request, article_id):
    """관리자 전용 자유게시판 상세 페이지"""
    # 관리자 체크
    if not is_manager(request):
        messages.error(request, "관리자 권한이 필요합니다.")
        return redirect('/manager/')
    
    try:
        board = get_board_by_name('post')
        article_obj = Article.objects.select_related('member_id', 'board_id').get(
            article_id=article_id,
            board_id=board
        )
        
        # 댓글 조회
        comment_objs = Comment.objects.select_related('member_id').filter(
            article_id=article_id,
            delete_date__isnull=True
        ).order_by('reg_date')
        
        comments = []
        for comment_obj in comment_objs:
            comment_author = comment_obj.member_id.nickname if comment_obj.member_id and hasattr(comment_obj.member_id, 'nickname') else '알 수 없음'
            comment_is_admin = comment_obj.member_id.manager_yn == 1 if comment_obj.member_id else False
            comments.append({
                'comment_id': comment_obj.comment_id,
                'comment': comment_obj.comment,
                'author': comment_author,
                'is_admin': comment_is_admin,
                'reg_date': comment_obj.reg_date,
            })
        
        # 작성자 정보
        author_name = article_obj.member_id.nickname if article_obj.member_id and hasattr(article_obj.member_id, 'nickname') else '알 수 없음'
        is_admin = article_obj.member_id.manager_yn == 1 if article_obj.member_id else False
        
        # 첨부파일 조회
        add_info_objs = AddInfo.objects.filter(article_id=article_id)
        files = []
        images = []
        for add_info in add_info_objs:
            file_ext = os.path.splitext(add_info.file_name)[1].lower()
            is_image = file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
            file_data = {
                'id': add_info.add_info_id,
                'name': add_info.file_name,
                'url': f"{settings.MEDIA_URL}{add_info.path}",
                'is_image': is_image,
            }
            if is_image:
                images.append(file_data)
            else:
                files.append(file_data)
        
        article = {
            'article_id': article_obj.article_id,
            'title': article_obj.title,
            'contents': article_obj.contents if article_obj.contents else '',
            'author': author_name,
            'is_admin': is_admin,
            'date': article_obj.reg_date.strftime('%Y-%m-%d'),
            'views': article_obj.view_cnt,
            'reg_date': article_obj.reg_date,
            'images': images,
            'files': files,
        }
        
        context = {
            'article': article,
            'comments': comments,
            'board_type': 'post',
            'is_manager': True,  # 관리자 페이지임을 표시
        }
        
        return render(request, 'board_detail.html', context)
    except Exception as e:
        import traceback
        print(f"[ERROR] manager_post_detail 오류: {str(e)}")
        print(traceback.format_exc())
        messages.error(request, f"게시글을 불러오는 중 오류가 발생했습니다: {str(e)}")
        return redirect('/manager/post_manager/')

def manager_notice_detail(request, article_id):
    """관리자 전용 공지사항 상세 페이지"""
    # 관리자 체크
    if not is_manager(request):
        messages.error(request, "관리자 권한이 필요합니다.")
        return redirect('/manager/')
    
    try:
        board = get_board_by_name('notice')
        article_obj = Article.objects.select_related('member_id', 'board_id').get(
            article_id=article_id,
            board_id=board
        )
        
        # 댓글 조회
        comment_objs = Comment.objects.select_related('member_id').filter(
            article_id=article_id,
            delete_date__isnull=True
        ).order_by('reg_date')
        
        comments = []
        for comment_obj in comment_objs:
            comment_author = comment_obj.member_id.nickname if comment_obj.member_id and hasattr(comment_obj.member_id, 'nickname') else '알 수 없음'
            comment_is_admin = comment_obj.member_id.manager_yn == 1 if comment_obj.member_id else False
            comments.append({
                'comment_id': comment_obj.comment_id,
                'comment': comment_obj.comment,
                'author': comment_author,
                'is_admin': comment_is_admin,
                'reg_date': comment_obj.reg_date,
            })
        
        # 작성자 정보
        author_name = article_obj.member_id.nickname if article_obj.member_id and hasattr(article_obj.member_id, 'nickname') else '알 수 없음'
        is_admin = article_obj.member_id.manager_yn == 1 if article_obj.member_id else False
        
        # 첨부파일 조회
        add_info_objs = AddInfo.objects.filter(article_id=article_id)
        files = []
        images = []
        for add_info in add_info_objs:
            file_ext = os.path.splitext(add_info.file_name)[1].lower()
            is_image = file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
            file_data = {
                'id': add_info.add_info_id,
                'name': add_info.file_name,
                'url': f"{settings.MEDIA_URL}{add_info.path}",
                'is_image': is_image,
            }
            if is_image:
                images.append(file_data)
            else:
                files.append(file_data)
        
        article = {
            'article_id': article_obj.article_id,
            'title': article_obj.title,
            'contents': article_obj.contents if article_obj.contents else '',
            'author': author_name,
            'is_admin': is_admin,
            'date': article_obj.reg_date.strftime('%Y-%m-%d'),
            'views': article_obj.view_cnt,
            'reg_date': article_obj.reg_date,
            'images': images,
            'files': files,
        }
        
        context = {
            'article': article,
            'comments': comments,
            'board_type': 'notice',
            'is_manager': True,  # 관리자 페이지임을 표시
        }
        
        return render(request, 'board_detail.html', context)
    except Exception as e:
        import traceback
        print(f"[ERROR] manager_notice_detail 오류: {str(e)}")
        print(traceback.format_exc())
        messages.error(request, f"게시글을 불러오는 중 오류가 발생했습니다: {str(e)}")
        return redirect('/manager/board_manager/')

def manager_event_detail(request, article_id):
    """관리자 전용 이벤트 상세 페이지"""
    # 관리자 체크
    if not is_manager(request):
        messages.error(request, "관리자 권한이 필요합니다.")
        return redirect('/manager/')
    
    try:
        board = get_board_by_name('event')
        article_obj = Article.objects.select_related('member_id', 'board_id').get(
            article_id=article_id,
            board_id=board
        )
        
        # 댓글 조회
        comment_objs = Comment.objects.select_related('member_id').filter(
            article_id=article_id,
            delete_date__isnull=True
        ).order_by('reg_date')
        
        comments = []
        for comment_obj in comment_objs:
            comment_author = comment_obj.member_id.nickname if comment_obj.member_id and hasattr(comment_obj.member_id, 'nickname') else '알 수 없음'
            comment_is_admin = comment_obj.member_id.manager_yn == 1 if comment_obj.member_id else False
            comments.append({
                'comment_id': comment_obj.comment_id,
                'comment': comment_obj.comment,
                'author': comment_author,
                'is_admin': comment_is_admin,
                'reg_date': comment_obj.reg_date,
            })
        
        # 작성자 정보
        author_name = article_obj.member_id.nickname if article_obj.member_id and hasattr(article_obj.member_id, 'nickname') else '알 수 없음'
        is_admin = article_obj.member_id.manager_yn == 1 if article_obj.member_id else False
        
        # 첨부파일 조회
        add_info_objs = AddInfo.objects.filter(article_id=article_id)
        files = []
        images = []
        for add_info in add_info_objs:
            file_ext = os.path.splitext(add_info.file_name)[1].lower()
            is_image = file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
            file_data = {
                'id': add_info.add_info_id,
                'name': add_info.file_name,
                'url': f"{settings.MEDIA_URL}{add_info.path}",
                'is_image': is_image,
            }
            if is_image:
                images.append(file_data)
            else:
                files.append(file_data)
        
        article = {
            'article_id': article_obj.article_id,
            'title': article_obj.title,
            'contents': article_obj.contents if article_obj.contents else '',
            'author': author_name,
            'is_admin': is_admin,
            'date': article_obj.reg_date.strftime('%Y-%m-%d'),
            'views': article_obj.view_cnt,
            'reg_date': article_obj.reg_date,
            'images': images,
            'files': files,
        }
        
        context = {
            'article': article,
            'comments': comments,
            'board_type': 'event',
            'is_manager': True,  # 관리자 페이지임을 표시
        }
        
        return render(request, 'board_detail.html', context)
    except Exception as e:
        import traceback
        print(f"[ERROR] manager_event_detail 오류: {str(e)}")
        print(traceback.format_exc())
        messages.error(request, f"게시글을 불러오는 중 오류가 발생했습니다: {str(e)}")
        return redirect('/manager/event_manager/')

@csrf_exempt
def delete_articles(request):
    """게시글 일괄 삭제 API (Article)"""
    if request.method != "POST":
        return JsonResponse({"status": "error", "msg": "POST만 가능"}, status=405)
    
    # 관리자 체크
    if not request.session.get('manager_id'):
        return JsonResponse({"status": "error", "msg": "관리자 권한이 필요합니다."}, status=403)
    
    try:
        data = json.loads(request.body)
        article_ids = data.get("ids", [])
        board_type = data.get("board_type", "")  # 'notice', 'event', 'post'
        
        if not article_ids:
            return JsonResponse({"status": "error", "msg": "삭제할 항목 없음"})
        
        # 게시판 확인
        try:
            board = get_board_by_name(board_type)
        except Exception:
            return JsonResponse({"status": "error", "msg": f"잘못된 게시판 타입: {board_type}"})
        
        # 게시글 조회 및 삭제 처리
        articles = Article.objects.filter(
            article_id__in=article_ids,
            board_id=board
        )
        
        deleted_count = 0
        now = datetime.now()  # 한국 시간으로 저장
        
        for article in articles:
            if article.delete_date is None:  # 아직 삭제되지 않은 경우만
                article.delete_date = now
                article.save(update_fields=['delete_date'])
                deleted_count += 1
        
        return JsonResponse({
            "status": "ok",
            "deleted": deleted_count,
            "total": len(article_ids)
        })
    
    except Exception as e:
        import traceback
        print(f"[ERROR] delete_articles 오류: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({"status": "error", "msg": str(e)})








def event_manager(request):
    # DB에서 이벤트 조회 (board_name='event', 삭제된 것도 포함)
    try:
        board = get_board_by_name('event')
        queryset = Article.objects.select_related('member_id', 'board_id').filter(
            board_id=board
        ).order_by('-reg_date')
    except Exception:
        queryset = []
    
    per_page = int(request.GET.get("per_page", 15))

    try:
        page = int(request.GET.get("page", 1))
        if page < 1:
            page = 1
    except:
        page = 1

    paginator = Paginator(queryset, per_page)
    page_obj = paginator.get_page(page)

    # 페이지 블록
    block_size = 5
    current_block = (page - 1) // block_size
    block_start = current_block * block_size + 1
    block_end = min(block_start + block_size - 1, paginator.num_pages)

    # facility_json 형식으로 데이터 변환
    start_index = (page_obj.number - 1) * per_page
    facility_page = []
    
    for idx, article in enumerate(page_obj.object_list):
        delete_date_str = None
        if article.delete_date:
            # 이미 한국 시간으로 저장되어 있음
            delete_date_str = article.delete_date.strftime('%Y-%m-%d %H:%M')
        
        facility_page.append({
            "id": article.article_id,
            "title": article.title,
            "author": article.member_id.user_id if article.member_id else "",
            "row_no": start_index + idx + 1,
            "delete_date": delete_date_str,
        })

    context = {
        "page_obj": page_obj,
        "per_page": per_page,
        "facility_json": json.dumps(facility_page, ensure_ascii=False),
        "block_range": range(block_start, block_end + 1),
    }

    return render(request, 'event_manager.html', context)


def board_manager(request):
    # DB에서 공지사항 조회 (board_name='notice', 삭제된 것도 포함)
    try:
        board = get_board_by_name('notice')
        queryset = Article.objects.select_related('member_id', 'board_id').filter(
            board_id=board
        ).order_by('-reg_date')
    except Exception:
        queryset = []
    
    per_page = int(request.GET.get("per_page", 15))

    try:
        page = int(request.GET.get("page", 1))
        if page < 1:
            page = 1
    except:
        page = 1

    paginator = Paginator(queryset, per_page)
    page_obj = paginator.get_page(page)

    # 페이지 블록
    block_size = 5
    current_block = (page - 1) // block_size
    block_start = current_block * block_size + 1
    block_end = min(block_start + block_size - 1, paginator.num_pages)

    # facility_json 형식으로 데이터 변환
    start_index = (page_obj.number - 1) * per_page
    facility_page = []
    
    for idx, article in enumerate(page_obj.object_list):
        delete_date_str = None
        if article.delete_date:
            # 이미 한국 시간으로 저장되어 있음
            delete_date_str = article.delete_date.strftime('%Y-%m-%d %H:%M')
        
        facility_page.append({
            "id": article.article_id,
            "title": article.title,
            "author": article.member_id.user_id if article.member_id else "",
            "row_no": start_index + idx + 1,
            "delete_date": delete_date_str,
        })

    context = {
        "page_obj": page_obj,
        "per_page": per_page,
        "facility_json": json.dumps(facility_page, ensure_ascii=False),
        "block_range": range(block_start, block_end + 1),
    }

    return render(request, "board_manager.html", context)


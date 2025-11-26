"""공통 유틸리티 함수"""
# TODO: DB 연결 이후 쿼리로 교체하고 삭제 필요 - 더미 데이터 생성 함수들
from datetime import datetime, timedelta
import random

# 모듈 레벨 변수로 캐싱 (한 번 생성 후 재사용)
# TODO: DB 연결 이후 쿼리로 교체하고 삭제 필요
_notice_pinned_posts_cache = None
_recruitment_dummy_list_cache = None


# TODO: DB 연결 이후 쿼리로 교체하고 삭제 필요
def get_notice_pinned_posts():
    """공지사항 고정 게시글 생성 (한 번 생성 후 재사용)"""
    global _notice_pinned_posts_cache
    
    # 캐시가 없으면 생성
    if _notice_pinned_posts_cache is None:
        pinned_posts = []
        for i in range(1, 6):
            days_ago = random.randint(0, 30)  # 최근 30일 내
            random_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
            pinned_posts.append({
                "title": f"🔒 [중요] 고정 공지사항 {i} - 반드시 확인해주세요",
                "date": random_date,
                "views": random.randint(100, 10000),
                "author": "관리자"
            })
        _notice_pinned_posts_cache = pinned_posts
    
    # 캐시된 데이터의 복사본 반환 (원본 수정 방지)
    return [post.copy() for post in _notice_pinned_posts_cache]


# TODO: DB 연결 이후 쿼리로 교체하고 삭제 필요
def get_recruitment_dummy_list():
    """모집 게시글 더미 리스트 생성 (한 번 생성 후 재사용)"""
    global _recruitment_dummy_list_cache
    
    # 캐시가 없으면 생성
    if _recruitment_dummy_list_cache is None:
        _recruitment_dummy_list_cache = [
            {
                "title": f"테스트 모집글 {i}",
                "date": "2025-11-26",
                "views": i * 3
            }
            for i in range(1, 201)
        ]
    
    # 캐시된 데이터의 복사본 반환 (원본 수정 방지)
    return [item.copy() for item in _recruitment_dummy_list_cache]


# TODO: DB 연결 이후 쿼리로 교체하고 삭제 필요
def reset_notice_pinned_posts_cache():
    """공지사항 고정 게시글 캐시 초기화"""
    global _notice_pinned_posts_cache
    _notice_pinned_posts_cache = None


# TODO: DB 연결 이후 쿼리로 교체하고 삭제 필요
def reset_recruitment_dummy_list_cache():
    """모집 게시글 더미 리스트 캐시 초기화"""
    global _recruitment_dummy_list_cache
    _recruitment_dummy_list_cache = None


# TODO: DB 연결 이후 쿼리로 교체하고 삭제 필요
def reset_all_caches():
    """모든 캐시 초기화"""
    reset_notice_pinned_posts_cache()
    reset_recruitment_dummy_list_cache()


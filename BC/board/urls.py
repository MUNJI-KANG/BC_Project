from django.urls import path
from . import views

urlpatterns = [
    path('', views.notice, name='board'),  # 기본 경로는 공지사항으로
    path('notice/', views.notice, name='notice'),
    path('event/', views.event, name='event'),
    path('post/', views.post, name='post'),
    path('faq/', views.faq, name='faq'),
]
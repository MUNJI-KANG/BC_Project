from django.urls import path
from . import views

urlpatterns = [
    path('', views.recruitment_list, name='recruitment_list'),
    path('write/', views.write, name = 'recruitment_write'),
    path('detail/', views.detail, name = 'recruitment_detail'),
    path('update/', views.update, name = 'recruitment_update'),
]
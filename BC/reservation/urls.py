from django.urls import path
from . import views

urlpatterns = [
    path('', views.reservation_list, name='reservation_list'),    
    path('detail/<int:pk>', views.reservation_detail, name='reservation_detail'),
    path("save/", views.reservation_save, name="reservation_save"),
]
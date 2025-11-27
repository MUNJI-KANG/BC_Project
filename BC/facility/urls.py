from django.urls import path
from . import views

urlpatterns = [
    path('', views.facility_list),
    path('detail/<fk>', views.facility_detail)
]
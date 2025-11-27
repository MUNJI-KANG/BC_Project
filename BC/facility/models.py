from django.db import models


# FacilityInfo (시설)
# -----------------------------------------------------
class FacilityInfo(models.Model):
    facility_id = models.AutoField(primary_key=True)
    photo = models.CharField(max_length=500) # 사진 필요할까요?
    facility_name = models.CharField(max_length=100)
    sport_type = models.CharField(max_length=100) # 종목인데, 그냥 sport 테이블에서 fk로 가져오는게 나을지/삭제하는게 나을지
    addr1 = models.CharField(max_length=200)  # 시
    addr2 = models.CharField(max_length=200)  # 구
    addr3 = models.CharField(max_length=200)  # 나머지 주소
    homepage = models.CharField(max_length=200, null=True, blank=True)
    tel = models.CharField(max_length=200, null=True, blank=True)
    time_date = models.JSONField(null=True, blank=True)
    etc = models.CharField(max_length=200, null=True, blank=True)
    sports_id = models.ForeignKey("reservation.Sports", null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        db_table = "facility_info"

    def __str__(self):
        return self.facility_name

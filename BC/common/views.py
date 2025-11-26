from django.shortcuts import render


def index(request):
    return render(request, 'index.html')

def login(request):
    return render(request, 'login.html')

def signup(request):
    return render(request, 'signup.html')

def find_id(request):
    if request.method == "POST":
        name = request.POST.get('name')
        birthday = request.POST.get('birthday')
        phone1 = request.POST.get('phone1')
        phone2 = request.POST.get('phone2')
        phone3 = request.POST.get('phone3')

        # 생일 검증
        if len(birthday) != 8 or not birthday.isdigit():
            return render(request, "findID.html", {
                "error": "생년월일은 8자리 숫자로 입력해주세요. (예: 20020528)"
            })

        # 전화번호 검증
        if (len(phone1) != 3 or not phone1.isdigit() or
            len(phone2) != 4 or not phone2.isdigit() or
            len(phone3) != 4 or not phone3.isdigit()):
            return render(request, "findID.html", {
                "error": "전화번호는 숫자만 입력해야 하며 3-4-4 자리여야 합니다."
            })

        phone_num = phone1 + phone2 + phone3

        # TODO: DB에서 이름, 생년월일, phone_num 이 일치하는 정보 찾기

        return render(request, 'findID.html', {
            "result_id": "ID"
        })

    return render(request, 'findID.html')

def find_pw(request):
    return render(request, 'findPW.html')

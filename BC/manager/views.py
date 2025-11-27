from django.shortcuts import render

def manager(request):
    return render(request, 'login_manager.html')
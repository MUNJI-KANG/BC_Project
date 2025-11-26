from django.shortcuts import render

def base(request):
    return render('', 'base.html')
def info(request):
    return render('', 'info.html')
def edit(request):
    return render('', 'info_edit.html')
def edit_password(request):
    return render('', 'info_edit_password.html')
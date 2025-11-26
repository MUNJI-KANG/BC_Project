from django.shortcuts import render

def notice(request):
    return render(request, 'notice.html')

def event(request):
    return render(request, 'event.html')

def post(request):
    return render(request, 'post.html')

def faq(request):
    return render(request, 'faq.html')
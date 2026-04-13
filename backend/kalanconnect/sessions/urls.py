from django.urls import path
from . import views

app_name = "sessions"

urlpatterns = [
    path("",              views.GroupSessionListView.as_view(),   name="list"),
    path("create/",       views.GroupSessionCreateView.as_view(), name="create"),
    path("my/",           views.TeacherSessionListView.as_view(), name="my-list"),
    path("<int:pk>/",     views.GroupSessionDetailView.as_view(), name="detail"),
    path("<int:pk>/update/",     views.GroupSessionUpdateView.as_view(),  name="update"),
    path("<int:pk>/register/",   views.SessionRegisterView.as_view(),     name="register"),
    path("<int:pk>/unregister/", views.SessionUnregisterView.as_view(),   name="unregister"),
    path("<int:pk>/<str:action>/", views.GroupSessionActionView.as_view(), name="action"),
]

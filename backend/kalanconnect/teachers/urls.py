from django.urls import path

from . import views

app_name = "teachers"

urlpatterns = [
    # Matières & Niveaux
    path("subjects/", views.SubjectListView.as_view(), name="subjects"),
    path("levels/", views.LevelListView.as_view(), name="levels"),
    # Profil professeur
    path("profile/", views.TeacherProfileCreateView.as_view(), name="profile-create"),
    path("me/", views.MyTeacherProfileView.as_view(), name="my-profile"),
    path("me/stats/", views.TeacherStatsView.as_view(), name="my-stats"),
    path("me/students/", views.TeacherStudentsView.as_view(), name="my-students"),
    path("me/availability/<int:pk>/", views.AvailabilityDeleteView.as_view(), name="availability-delete"),
    path("<int:pk>/", views.TeacherProfileDetailView.as_view(), name="profile-detail"),
    # Diplômes & Disponibilités
    path("diplomas/", views.DiplomaListCreateView.as_view(), name="diplomas"),
    path("diplomas/<int:pk>/", views.DiplomaDeleteView.as_view(), name="diploma-delete"),
    path("availability/", views.AvailabilityListCreateView.as_view(), name="availability"),
    # Recherche
    path("search/", views.TeacherSearchView.as_view(), name="search"),
    path("autocomplete/", views.teacher_autocomplete, name="autocomplete"),
]

from django.urls import path

from . import views

app_name = "chat"

urlpatterns = [
    path("conversations/", views.ConversationListView.as_view(), name="conversations"),
    path("conversations/start/", views.ConversationCreateView.as_view(), name="start"),
    path(
        "conversations/<int:conversation_id>/messages/",
        views.MessageListView.as_view(),
        name="messages",
    ),
    path(
        "conversations/<int:conversation_id>/read/",
        views.MarkAsReadView.as_view(),
        name="mark-read",
    ),
    path(
        "conversations/<int:conversation_id>/upload/",
        views.AttachmentUploadView.as_view(),
        name="upload",
    ),
]

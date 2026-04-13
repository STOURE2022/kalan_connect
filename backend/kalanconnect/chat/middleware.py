"""
Middleware JWT pour les connexions WebSocket.
Lit le token d'accès depuis le query parameter `?token=<jwt>`.
"""

from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


@database_sync_to_async
def get_user_from_token(token: str):
    """Valide le JWT et retourne l'utilisateur correspondant."""
    try:
        from rest_framework_simplejwt.tokens import AccessToken
        from django.contrib.auth import get_user_model

        access = AccessToken(token)
        User = get_user_model()
        return User.objects.get(id=access["user_id"])
    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware:
    """
    Middleware ASGI qui authentifie les connexions WebSocket
    via le query parameter `token`.

    Usage: ws://host/ws/chat/1/?token=<access_jwt>
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        if scope["type"] == "websocket":
            query_string = scope.get("query_string", b"").decode()
            params = parse_qs(query_string)
            token_list = params.get("token", [])
            token = token_list[0] if token_list else None

            if token:
                scope["user"] = await get_user_from_token(token)
            else:
                scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)

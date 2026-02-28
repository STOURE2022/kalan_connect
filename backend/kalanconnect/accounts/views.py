"""
KalanConnect — Views Auth & User
"""

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ — Inscription"""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Générer les tokens JWT
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/auth/profile/ — Mon profil"""

    serializer_class = UserSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user


class VerifyPhoneView(APIView):
    """POST /api/v1/auth/verify-phone/ — Vérification OTP"""

    def post(self, request):
        otp_code = request.data.get("otp")
        # TODO: Vérifier le code OTP (stocké en Redis)
        # Pour le MVP, on valide directement
        request.user.is_phone_verified = True
        request.user.save(update_fields=["is_phone_verified"])
        return Response({"status": "verified"})

from django.shortcuts import render
from django.conf import settings
from django.contrib.auth.hashers import make_password
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers


from .serializers import RegisterSerializer, UserSerializer
from .models import OneTimeToken, User
from .utils import send_verification_email
from django.core.mail import send_mail


from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


# Custom TokenObtainPairSerializer so response includes user data
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        # customize token claims if needed
        token = super().get_token(user)
        token["email"] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # add user data
        data["user"] = UserSerializer(self.user).data
        return data


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        email = serializer.validated_data["email"]
        existing_user = User.objects.filter(email=email).first()

        if existing_user:
            if not existing_user.is_verified:
                send_verification_email(existing_user, request=self.request)
                return existing_user
            else:
                raise serializers.ValidationError(
                    {"email": "Email already registered."}
                )

        user = serializer.save()
        send_verification_email(user, request=self.request)
        return user

    def create(self, request, *args, **kwargs):
        resp = super().create(request, *args, **kwargs)
        return Response(
            {
                "message": "User created successfully. Please verify email before logging in."
            },
            status=status.HTTP_201_CREATED,
        )


from rest_framework_simplejwt.exceptions import TokenError
import logging

logger = logging.getLogger(__name__)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()

            # Optional: Log logout for security auditing
            logger.info(f"User {request.user.id} logged out successfully")

            return Response(
                {"detail": "Successfully logged out."},
                status=status.HTTP_205_RESET_CONTENT,
            )
        except TokenError as e:
            logger.warning(f"Invalid refresh token during logout: {str(e)}")
            return Response(
                {"detail": "Invalid or expired refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.error(f"Unexpected logout error: {str(e)}")
            return Response(
                {"detail": "Internal server error during logout."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token = request.query_params.get("token")
        if not token:
            return Response(
                {"detail": "Token is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            token_obj = OneTimeToken.objects.get(token=token, token_type="email_verify")
        except OneTimeToken.DoesNotExist:
            return Response(
                {"detail": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )

        if token_obj.is_expired():
            return Response(
                {"detail": "Token has expired"}, status=status.HTTP_400_BAD_REQUEST
            )

        user = token_obj.user
        user.is_active = True
        user.save()
        # delete token after use
        token_obj.delete()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "detail": "Email verified. You are now logged in.",
                "token": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
            },
            status=200,
        )


# Reset Password Views
class PasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "Email doesn't exist"}, status=status.HTTP_200_OK
            )

        token_obj = OneTimeToken.create_token(
            user, token_type="password_reset", ttl_minutes=60
        )

        reset_url = (
            f"{settings.FRONTEND_BASE_URL}/auth/reset-password?token={token_obj.token}"
        )
        send_mail(
            "Reset your password",
            f"Click here to reset your password: {reset_url}",
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
        )
        return Response(
            {"detail": "Password reset email sent."}, status=status.HTTP_200_OK
        )


# Confirm Password Reset
class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get("token")
        new_password = request.data.get("password")

        try:
            token_obj = OneTimeToken.objects.get(
                token=token, token_type="password_reset"
            )
        except OneTimeToken.DoesNotExist:
            return Response(
                {"details": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if token_obj.is_expired():
            token_obj.delete()
            return Response(
                {"detail": "Token has expired"}, status=status.HTTP_400_BAD_REQUEST
            )

        user = token_obj.user
        user.password = make_password(new_password)
        user.save()

        token_obj.delete()  # invalidate after use

        return Response(
            {"detail": "Password reset successful."}, status=status.HTTP_200_OK
        )


# Optional: view for getting current user info
class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

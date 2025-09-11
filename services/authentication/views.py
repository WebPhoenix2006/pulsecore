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
    def validate(self, attrs):
        # Get email and password from request
        email = attrs.get("email", "")
        password = attrs.get("password", "")

        if email and password:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    "No account found with this email address."
                )

            if not user.check_password(password):
                raise serializers.ValidationError("Invalid password.")

            if not user.is_active:
                raise serializers.ValidationError(
                    "Account is not active. Please verify your email first."
                )

            self.user = user
            refresh = self.get_token(user)
            data = {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data,
            }
            return data
        else:
            raise serializers.ValidationError(
                "Must include 'email' and 'password' fields."
            )


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        email = serializer.validated_data["email"]
        existing_user = User.objects.filter(email=email).first()

        if existing_user:
            # Fixed: Use is_active instead of is_verified
            if not existing_user.is_active:
                send_verification_email(existing_user, request=self.request)
                return existing_user
            else:
                raise serializers.ValidationError(
                    {"email": "Email already registered and verified."}
                )

        user = serializer.save()
        send_verification_email(user, request=self.request)
        return user

    def create(self, request, *args, **kwargs):
        try:
            resp = super().create(request, *args, **kwargs)
            return Response(
                {
                    "message": "User created successfully. Please check your email for verification link."
                },
                status=status.HTTP_201_CREATED,
            )
        except serializers.ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)


from rest_framework_simplejwt.exceptions import TokenError
import logging

logger = logging.getLogger(__name__)


class LogoutView(APIView):
    # Use Access token in Authorization Bearer Token, and Refresh token in logout body
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
            token_obj.delete()  # Clean up expired token
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
                "detail": "Email verified successfully. You are now logged in.",
                "token": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=200,
        )


# Reset Password Views
class PasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response(
                {"detail": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
            # Delete any existing password reset tokens for this user
            OneTimeToken.objects.filter(user=user, token_type="password_reset").delete()

            token_obj = OneTimeToken.create_token(
                user, token_type="password_reset", ttl_minutes=60
            )

            reset_url = f"{settings.FRONTEND_BASE_URL}/auth/password-reset/confirm?token={token_obj.token}"
            send_mail(
                "Reset your password",
                f"Click here to reset your password: {reset_url}",
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
            )
        except User.DoesNotExist:
            # Don't reveal if email exists or not for security
            pass

        return Response(
            {
                "detail": "If an account with this email exists, a password reset link has been sent."
            },
            status=status.HTTP_200_OK,
        )


# Confirm Password Reset
class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get("token")
        new_password = request.data.get("password")

        if not token or not new_password:
            return Response(
                {"detail": "Token and new password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token_obj = OneTimeToken.objects.get(
                token=token, token_type="password_reset"
            )
        except OneTimeToken.DoesNotExist:
            return Response(
                {"detail": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if token_obj.is_expired():
            token_obj.delete()
            return Response(
                {"detail": "Token has expired"}, status=status.HTTP_400_BAD_REQUEST
            )

        user = token_obj.user
        user.set_password(new_password)  # ✅ correct way
        user.is_active = True  # ensure active after password reset
        user.save()  # ✅ save properly

        # Delete the used token
        token_obj.delete()  # invalidate after use

        # Return both success message and auth tokens for immediate login
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "detail": "Password reset successful. You are now logged in.",
                "token": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


# Optional: view for getting current user info
class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

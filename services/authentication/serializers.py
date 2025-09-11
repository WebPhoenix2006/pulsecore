from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "is_active",
            "role",
            "avatar",
            "phone_number",
            "date_joined",
        ]
        read_only_fields = [
            "id",
            "is_active",
            "date_joined",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "confirm_password",
            "first_name",
            "last_name",
            "username",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("Password confirmation doesn't match")
        return attrs

    def create(self, validated_data):
        # Remove confirm_password from validated_data
        validated_data.pop("confirm_password", None)

        # Create user but leave inactive for email verification
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            username=validated_data.get("username", ""),
        )
        # User is created with is_active=False by default in your model
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            # First check if user exists
            try:
                user_obj = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    "No account found with this email address."
                )

            # Check if user is active
            if not user_obj.is_active:
                raise serializers.ValidationError(
                    "Your account is not active. Please verify your email first."
                )

            # Now authenticate
            user = authenticate(
                request=self.context.get("request"),
                username=email,  # Use username parameter for authenticate()
                password=password,
            )

            if not user:
                raise serializers.ValidationError(
                    "Invalid password. Please check your credentials."
                )

            attrs["user"] = user
            return attrs
        else:
            raise serializers.ValidationError("Both email and password are required.")

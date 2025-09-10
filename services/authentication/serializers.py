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
        ]
        read_only_fields = [
            "id",
            "is_active",
            "avatar",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name", "username"]

    def create(self, validated_data):
        # create user but leave inactive if you require email verification
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            username=validated_data.get("username", ""),
        )
        user.is_active = False  # require verification on signup
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    # why do we use ModelSerializer for signup and Serializer for login(question)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        user = authenticate(
            request=self.context.get("request"), username=email, password=password
        )
        # why do we do this: request=self.context.get('request')(question)
        if not user:
            raise serializers.ValidationError(
                "Invalid Credentials, please check your email/password"
            )
        if not user.is_active:
            raise serializers.ValidationError(
                "Your account is not active, please verify your email first."
            )
        attrs["user"] = user
        return attrs

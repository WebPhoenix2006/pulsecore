import pytest
from rest_framework.test import APIRequestFactory
from django.contrib.auth import get_user_model

from authentication.serializers import UserSerializer, RegisterSerializer, LoginSerializer

User = get_user_model()


# ----- USER SERIALIZER TESTS -----


@pytest.mark.django_db
def test_user_serializer_contains_expected_fields():
    user = User.objects.create_user(
        email="test@example.com",
        password="testpassword123",
        first_name="Test",
        last_name="User",
        username="testuser",
        is_active=True,
    )
    serializer = UserSerializer(instance=user)
    data = serializer.data

    expected_fields = [
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

    for field in expected_fields:
        assert field in data


@pytest.mark.django_db
def test_user_serializer_data_content():
    user = User.objects.create_user(
        email="test@example.com",
        password="testpassword123",
        first_name="Test",
        last_name="User",
        username="testuser",
        is_active=True,
    )
    serializer = UserSerializer(instance=user)
    data = serializer.data

    assert data["email"] == "test@example.com"
    assert data["first_name"] == "Test"
    assert data["last_name"] == "User"
    assert data["username"] == "testuser"
    assert data["is_active"] is True
    assert data["role"] == "Viewer"


@pytest.mark.django_db
def test_user_serializer_read_only_fields():
    serializer = UserSerializer()
    read_only_fields = serializer.Meta.read_only_fields

    expected_read_only = ["id", "is_active", "date_joined"]
    for field in expected_read_only:
        assert field in read_only_fields


# ----- REGISTER SERIALIZER TESTS -----


@pytest.mark.django_db
def test_register_serializer_valid_data():
    valid_data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "confirm_password": "testpassword123",
        "first_name": "Test",
        "last_name": "User",
        "username": "testuser",
    }

    serializer = RegisterSerializer(data=valid_data)
    assert serializer.is_valid()


@pytest.mark.django_db
def test_register_serializer_password_mismatch():
    invalid_data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "confirm_password": "differentpassword",
        "first_name": "Test",
        "last_name": "User",
    }

    serializer = RegisterSerializer(data=invalid_data)
    assert not serializer.is_valid()
    assert "non_field_errors" in serializer.errors


@pytest.mark.django_db
def test_register_serializer_short_password():
    invalid_data = {
        "email": "test@example.com",
        "password": "short",
        "confirm_password": "short",
    }

    serializer = RegisterSerializer(data=invalid_data)
    assert not serializer.is_valid()
    assert "password" in serializer.errors


@pytest.mark.django_db
def test_register_serializer_missing_email():
    invalid_data = {
        "password": "testpassword123",
        "confirm_password": "testpassword123",
    }

    serializer = RegisterSerializer(data=invalid_data)
    assert not serializer.is_valid()
    assert "email" in serializer.errors


@pytest.mark.django_db
def test_register_serializer_create_user():
    valid_data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "confirm_password": "testpassword123",
        "first_name": "Test",
        "last_name": "User",
        "username": "testuser",
    }

    serializer = RegisterSerializer(data=valid_data)
    assert serializer.is_valid()

    user = serializer.save()

    assert user.email == "test@example.com"
    assert user.first_name == "Test"
    assert user.last_name == "User"
    assert user.username == "testuser"
    assert not user.is_active  # Should be inactive until email verification
    assert user.check_password("testpassword123")


@pytest.mark.django_db
def test_register_serializer_create_user_minimal_data():
    minimal_data = {
        "email": "minimal@example.com",
        "password": "testpassword123",
        "confirm_password": "testpassword123",
    }

    serializer = RegisterSerializer(data=minimal_data)
    assert serializer.is_valid()

    user = serializer.save()

    assert user.email == "minimal@example.com"
    assert user.first_name == ""
    assert user.last_name == ""
    assert user.username == ""


@pytest.mark.django_db
def test_register_serializer_invalid_email_format():
    invalid_data = {
        "email": "invalid-email",
        "password": "testpassword123",
        "confirm_password": "testpassword123",
    }

    serializer = RegisterSerializer(data=invalid_data)
    assert not serializer.is_valid()
    assert "email" in serializer.errors


# ----- LOGIN SERIALIZER TESTS -----


@pytest.mark.django_db
def test_login_serializer_valid_credentials():
    user = User.objects.create_user(
        email="test@example.com", password="testpassword123", is_active=True
    )
    factory = APIRequestFactory()
    data = {"email": "test@example.com", "password": "testpassword123"}
    request = factory.post("/login/", data)

    serializer = LoginSerializer(data=data, context={"request": request})
    assert serializer.is_valid()

    validated_data = serializer.validated_data
    assert validated_data["user"] == user
    assert validated_data["tenant_id"] == str(user.tenant_id)


@pytest.mark.django_db
def test_login_serializer_invalid_password():
    User.objects.create_user(
        email="test@example.com", password="testpassword123", is_active=True
    )
    factory = APIRequestFactory()
    data = {"email": "test@example.com", "password": "wrongpassword"}
    request = factory.post("/login/", data)

    serializer = LoginSerializer(data=data, context={"request": request})
    assert not serializer.is_valid()
    assert "non_field_errors" in serializer.errors


@pytest.mark.django_db
def test_login_serializer_nonexistent_user():
    factory = APIRequestFactory()
    data = {"email": "nonexistent@example.com", "password": "testpassword123"}
    request = factory.post("/login/", data)

    serializer = LoginSerializer(data=data, context={"request": request})
    assert not serializer.is_valid()
    assert "non_field_errors" in serializer.errors


@pytest.mark.django_db
def test_login_serializer_inactive_user():
    User.objects.create_user(
        email="test@example.com", password="testpassword123", is_active=False
    )
    factory = APIRequestFactory()
    data = {"email": "test@example.com", "password": "testpassword123"}
    request = factory.post("/login/", data)

    serializer = LoginSerializer(data=data, context={"request": request})
    assert not serializer.is_valid()
    assert "non_field_errors" in serializer.errors


@pytest.mark.django_db
def test_login_serializer_missing_email():
    factory = APIRequestFactory()
    data = {"password": "testpassword123"}
    request = factory.post("/login/", data)

    serializer = LoginSerializer(data=data, context={"request": request})
    assert not serializer.is_valid()
    assert "email" in serializer.errors


@pytest.mark.django_db
def test_login_serializer_missing_password():
    factory = APIRequestFactory()
    data = {"email": "test@example.com"}
    request = factory.post("/login/", data)

    serializer = LoginSerializer(data=data, context={"request": request})
    assert not serializer.is_valid()
    assert "password" in serializer.errors


@pytest.mark.django_db
def test_login_serializer_email_case_insensitive():
    user = User.objects.create_user(
        email="test@example.com", password="testpassword123", is_active=True
    )
    factory = APIRequestFactory()
    data = {"email": "TEST@EXAMPLE.COM", "password": "testpassword123"}
    request = factory.post("/login/", data)

    serializer = LoginSerializer(data=data, context={"request": request})
    assert serializer.is_valid()

    validated_data = serializer.validated_data
    assert validated_data["user"] == user


@pytest.mark.django_db
def test_login_serializer_password_write_only():
    factory = APIRequestFactory()
    data = {"email": "test@example.com", "password": "testpassword123"}
    request = factory.post("/login/", data)

    serializer = LoginSerializer(data=data, context={"request": request})

    # Check that password field is write-only
    field = serializer.fields["password"]
    assert field.write_only
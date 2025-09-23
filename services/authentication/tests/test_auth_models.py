import pytest
import uuid
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from authentication.models import OneTimeToken

User = get_user_model()


# ----- USER MODEL TESTS -----


@pytest.mark.django_db
def test_create_user_with_email():
    tenant_id = uuid.uuid4()
    user = User.objects.create_user(
        email="test@example.com",
        password="testpassword123",
        first_name="Test",
        last_name="User",
        tenant_id=tenant_id,
    )

    assert user.email == "test@example.com"
    assert user.first_name == "Test"
    assert user.last_name == "User"
    assert user.tenant_id == tenant_id
    assert user.role == "Viewer"
    assert not user.is_active
    assert not user.is_staff
    assert user.check_password("testpassword123")


@pytest.mark.django_db
def test_create_user_without_email_raises_error():
    with pytest.raises(ValueError):
        User.objects.create_user(email="", password="testpassword123")


@pytest.mark.django_db
def test_create_user_without_tenant_id_generates_one():
    user = User.objects.create_user(email="test@example.com", password="testpassword123")

    assert user.tenant_id is not None
    assert isinstance(user.tenant_id, uuid.UUID)


@pytest.mark.django_db
def test_create_superuser():
    user = User.objects.create_superuser(
        email="admin@example.com", password="adminpassword123"
    )

    assert user.email == "admin@example.com"
    assert user.role == "Admin"
    assert user.is_staff
    assert user.is_superuser
    assert user.is_active


@pytest.mark.django_db
def test_user_string_representation():
    user = User.objects.create_user(
        email="test@example.com", password="testpassword123"
    )
    assert str(user) == "test@example.com"


@pytest.mark.django_db
def test_get_full_name():
    user = User.objects.create_user(
        email="test@example.com",
        password="testpassword123",
        first_name="Test",
        last_name="User",
    )
    assert user.get_full_name() == "Test User"


@pytest.mark.django_db
def test_get_full_name_with_empty_names():
    user = User.objects.create_user(email="test@example.com", password="testpassword123")
    assert user.get_full_name() == ""


@pytest.mark.django_db
def test_get_short_name():
    user = User.objects.create_user(
        email="test@example.com", password="testpassword123", first_name="Test"
    )
    assert user.get_short_name() == "Test"


@pytest.mark.django_db
def test_get_short_name_fallback_to_email():
    user = User.objects.create_user(email="test@example.com", password="testpassword123")
    assert user.get_short_name() == "test@example.com"


@pytest.mark.django_db
def test_email_normalization():
    user = User.objects.create_user(email="Test@EXAMPLE.COM", password="testpassword123")
    assert user.email == "Test@example.com"


@pytest.mark.django_db
def test_unique_email_constraint():
    User.objects.create_user(email="test@example.com", password="testpassword123")

    with pytest.raises(Exception):
        User.objects.create_user(email="test@example.com", password="anotherpwd")


@pytest.mark.django_db
def test_role_choices():
    for role, _ in User.ROLE_CHOICES:
        user = User.objects.create_user(
            email=f"test{role}@example.com",
            password="testpassword123",
            role=role,
        )
        assert user.role == role


# ----- ONE TIME TOKEN TESTS -----


@pytest.mark.django_db
def test_create_email_verification_token():
    user = User.objects.create_user(email="test@example.com", password="testpassword123")
    token_obj = OneTimeToken.create_token(user, "email_verify")

    assert token_obj.user == user
    assert token_obj.token_type == "email_verify"
    assert token_obj.token is not None
    assert not token_obj.is_expired()


@pytest.mark.django_db
def test_create_password_reset_token():
    user = User.objects.create_user(email="test@example.com", password="testpassword123")
    token_obj = OneTimeToken.create_token(user, "password_reset")

    assert token_obj.user == user
    assert token_obj.token_type == "password_reset"
    assert token_obj.token is not None
    assert not token_obj.is_expired()


@pytest.mark.django_db
def test_token_expiration():
    user = User.objects.create_user(email="test@example.com", password="testpassword123")
    token_obj = OneTimeToken.create_token(user, "email_verify", ttl_minutes=0)

    assert token_obj.is_expired()


@pytest.mark.django_db
def test_token_not_expired():
    user = User.objects.create_user(email="test@example.com", password="testpassword123")
    token_obj = OneTimeToken.create_token(user, "email_verify", ttl_minutes=60)

    assert not token_obj.is_expired()


@pytest.mark.django_db
def test_token_uniqueness():
    user = User.objects.create_user(email="test@example.com", password="testpassword123")
    token1 = OneTimeToken.create_token(user, "email_verify")
    token2 = OneTimeToken.create_token(user, "email_verify")

    assert token1.token != token2.token


@pytest.mark.django_db
def test_multiple_tokens_per_user():
    user = User.objects.create_user(email="test@example.com", password="testpassword123")
    email_token = OneTimeToken.create_token(user, "email_verify")
    password_token = OneTimeToken.create_token(user, "password_reset")

    user_tokens = OneTimeToken.objects.filter(user=user)
    assert user_tokens.count() == 2
    assert email_token in user_tokens
    assert password_token in user_tokens


@pytest.mark.django_db
def test_custom_ttl():
    user = User.objects.create_user(email="test@example.com", password="testpassword123")
    token_obj = OneTimeToken.create_token(user, "email_verify", ttl_minutes=30)
    expected_expiry = timezone.now() + timedelta(minutes=30)

    # Allow for small time difference due to test execution time
    time_diff = abs((token_obj.expires_at - expected_expiry).total_seconds())
    assert time_diff < 2  # within 2 seconds


@pytest.mark.django_db
def test_default_ttl():
    user = User.objects.create_user(email="test@example.com", password="testpassword123")
    token_obj = OneTimeToken.create_token(user)
    expected_expiry = timezone.now() + timedelta(minutes=60)

    time_diff = abs((token_obj.expires_at - expected_expiry).total_seconds())
    assert time_diff < 2
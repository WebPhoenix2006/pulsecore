from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)
from django.utils import timezone
from django.conf import settings
import uuid
from datetime import timedelta


class UserManager(BaseUserManager):
    def create_user(
        self, email, password=None, tenant_id=None, role="Viewer", **extra_fields
    ):
        if not email:
            raise ValueError("Email must be provided")
        if not tenant_id:
            tenant_id = uuid.uuid4()  # assign a new tenant if not provided
        email = self.normalize_email(email)
        user = self.model(email=email, tenant_id=tenant_id, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(email, password, role="Admin", **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    # Multi-tenancy
    tenant_id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        db_index=True,
        help_text="Tenant ID for multi-tenant isolation",
    )

    # User info
    email = models.EmailField(unique=True, max_length=255)
    username = models.CharField(max_length=150, blank=True, null=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    # Optional
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)

    # RBAC roles
    ROLE_CHOICES = [
        ("Admin", "Admin"),
        ("Manager", "Manager"),
        ("Viewer", "Viewer"),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="Viewer")

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name", "username"]

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name or self.email

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]

    def __str__(self):
        return self.email


class OneTimeToken(models.Model):
    """
    Generic one-time token record used for email verification and password reset.
    """

    TOKEN_TYPE_CHOICES = [
        ("email_verify", "Email verification"),
        ("password_reset", "Password reset"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="one_time_tokens",
    )
    token = models.CharField(max_length=128, unique=True)
    token_type = models.CharField(max_length=32, choices=TOKEN_TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        indexes = [
            models.Index(fields=["token"]),
            models.Index(fields=["user", "token_type"]),
        ]

    def is_expired(self):
        return timezone.now() >= self.expires_at

    @classmethod
    def create_token(cls, user, token_type="email_verify", ttl_minutes=60):
        token = uuid.uuid4().hex
        expires_at = timezone.now() + timedelta(minutes=ttl_minutes)
        return cls.objects.create(
            user=user, token=token, token_type=token_type, expires_at=expires_at
        )

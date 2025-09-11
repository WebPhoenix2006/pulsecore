Authentication
🔑 Endpoints
Register – POST /api/auth/register/

Request

{
"email": "john@example.com",
"username": "johnny",
"first_name": "John",
"last_name": "Doe",
"password": "strongpassword123",
"confirm_password": "strongpassword123"
}

Response

{
"message": "User created successfully. Please check your email for verification link."
}

Verify Email – GET /api/auth/verify-email/?token=<token>

Response

{
"detail": "Email verified successfully. You are now logged in.",
"token": "ACCESS_TOKEN",
"refresh": "REFRESH_TOKEN",
"user": {
"id": "f91e1c9a-94a7-4e44-8b29-8a0a6a4445ef",
"email": "john@example.com",
"username": "johnny",
"first_name": "John",
"last_name": "Doe",
"is_active": true,
"role": "Viewer",
"avatar": null,
"phone_number": null,
"date_joined": "2025-09-11T07:00:00Z"
}
}

Login (JWT) – POST /api/auth/login/

Request

{
"email": "john@example.com",
"password": "strongpassword123"
}

Response

{
"refresh": "REFRESH_TOKEN",
"access": "ACCESS_TOKEN",
"user": {
"id": "f91e1c9a-94a7-4e44-8b29-8a0a6a4445ef",
"email": "john@example.com",
"username": "johnny",
"first_name": "John",
"last_name": "Doe",
"role": "Viewer",
"avatar": null
}
}

Logout – POST /api/auth/logout/

Headers: Authorization: Bearer <ACCESS_TOKEN>
Request

{
"refresh": "REFRESH_TOKEN"
}

Response

{
"detail": "Successfully logged out."
}

Request Password Reset – POST /api/auth/password-reset/

Request

{
"email": "john@example.com"
}

Response

{
"detail": "If an account with this email exists, a password reset link has been sent."
}

Confirm Password Reset – POST /api/auth/password-reset/confirm/

Request

{
"token": "RESET_TOKEN",
"password": "newpassword123"
}

Response

{
"detail": "Password reset successful. You are now logged in.",
"token": "ACCESS_TOKEN",
"refresh": "REFRESH_TOKEN",
"user": {
"id": "f91e1c9a-94a7-4e44-8b29-8a0a6a4445ef",
"email": "john@example.com",
"username": "johnny"
}
}

Current User – GET /api/auth/me/

Headers: Authorization: Bearer <ACCESS_TOKEN>
Response

{
"id": "f91e1c9a-94a7-4e44-8b29-8a0a6a4445ef",
"email": "john@example.com",
"username": "johnny",
"first_name": "John",
"last_name": "Doe",
"is_active": true,
"role": "Viewer",
"avatar": null
}

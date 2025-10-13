# PulseCore - Multi-Tenant Restaurant Management System

A comprehensive, multi-tenant restaurant management platform built with Django REST Framework (backend) and Angular 17+ (frontend). PulseCore provides inventory management, order processing, payments, analytics, and more.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Key Features](#key-features)
- [Recent Development Work](#recent-development-work)
- [API Documentation](#api-documentation)
- [Authentication & Security](#authentication--security)
- [Payment Integration](#payment-integration)
- [Multi-Tenancy](#multi-tenancy)
- [Development Guidelines](#development-guidelines)

---

## Architecture Overview

PulseCore follows a **client-server architecture** with clear separation between frontend and backend:

```
┌─────────────────────────────────────────────────────────────┐
│                     Angular Frontend                         │
│  (Admin Portal - Port 4200)                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Orders   │  │Inventory │  │Analytics │  │ Payments │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                     HTTP/REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Django REST Backend                        │
│  (API Server - Port 8000)                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Multi-Tenant Architecture (X-Tenant-ID header)      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Orders  │  │Inventory │  │Analytics │  │ Payments │  │
│  │ Service  │  │ Service  │  │ Service  │  │ (Paystack)│ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                      ┌─────────────┐
                      │   SQLite    │
                      │  (Dev DB)   │
                      └─────────────┘
```

---

## Tech Stack

### Backend
- **Python 3.11+**
- **Django 5.2.6** - Web framework
- **Django REST Framework** - RESTful API
- **Simple JWT** - JWT authentication with token blacklisting
- **Paystack** - Payment gateway integration
- **Celery** - Async task processing
- **Redis** - Celery broker
- **SQLite** - Development database (PostgreSQL for production)

### Frontend
- **Angular 17+** - Modern Angular with signals
- **TypeScript** - Type-safe development
- **RxJS** - Reactive programming
- **SCSS** - Advanced styling
- **Remix Icons** - Icon library

### Development Tools
- **Git** - Version control
- **VS Code** - IDE
- **Postman** - API testing
- **Chrome DevTools** - Debugging

---

## Project Structure

```
pulsecore/
├── services/                          # Django Backend
│   ├── backend/                       # Django project settings
│   │   ├── settings.py               # Main configuration
│   │   ├── urls.py                   # Root URL routing
│   │   └── celery.py                 # Celery configuration
│   ├── authentication/                # Auth service
│   │   ├── models.py                 # User, OneTimeToken models
│   │   ├── views.py                  # Login, Register, Logout
│   │   └── serializers.py            # User serializers
│   ├── main_services/
│   │   ├── orders/                   # Order management
│   │   │   ├── models.py             # Order, OrderItem, PaystackTransaction
│   │   │   ├── views.py              # Order CRUD, Payment APIs
│   │   │   ├── serializers.py        # Order serializers
│   │   │   └── paystack.py           # Paystack integration
│   │   ├── inventory/                # Inventory management
│   │   │   ├── models.py             # SKU, Stock models
│   │   │   └── views.py              # Inventory APIs
│   │   ├── catalog/                  # Product catalog
│   │   ├── analytics/                # Analytics & reporting
│   │   ├── suppliers/                # Supplier management
│   │   └── riders/                   # Delivery management
│   ├── manage.py                     # Django CLI
│   └── requirements.txt              # Python dependencies
│
├── admin-portal/                      # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/                 # Authentication module
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── orders/               # Orders module
│   │   │   │   ├── components/
│   │   │   │   │   ├── orders/       # Orders list
│   │   │   │   │   ├── order-details/# Order details modal
│   │   │   │   │   ├── create-order-modal/
│   │   │   │   │   ├── return-modal/ # Return requests
│   │   │   │   │   └── payments/     # Payment management
│   │   │   │   ├── services/
│   │   │   │   │   ├── orders.service.ts
│   │   │   │   │   └── catalog.service.ts
│   │   │   │   └── interfaces/
│   │   │   │       └── order.interface.ts
│   │   │   ├── inventory/            # Inventory module
│   │   │   ├── analytics/            # Analytics module
│   │   │   ├── services/             # Shared services
│   │   │   │   ├── auth.service.ts   # Authentication
│   │   │   │   └── toast.service.ts  # Notifications
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts # JWT & tenant headers
│   │   │   ├── guards/
│   │   │   │   └── auth-guard.ts     # Route protection
│   │   │   └── interfaces/
│   │   └── environments/
│   │       └── environment.ts        # API endpoints
│   ├── package.json                  # NPM dependencies
│   └── angular.json                  # Angular configuration
│
└── README.md                         # This file
```

---

## Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm
- **Git**
- **Redis** (for Celery - optional for basic dev)

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd pulsecore
```

2. **Create virtual environment**
```bash
cd services
python -m venv env

# Activate (Windows)
env\Scripts\activate

# Activate (Mac/Linux)
source env/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Run migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

5. **Create superuser**
```bash
python manage.py createsuperuser
```

6. **Run development server**
```bash
python manage.py runserver 0.0.0.0:8000
```

Backend will be available at: `http://127.0.0.1:8000`

### Frontend Setup

1. **Navigate to admin-portal**
```bash
cd admin-portal
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm start
# or
ng serve
```

Frontend will be available at: `http://localhost:4200`

### Environment Configuration

Create `.env` file in `services/` directory:
```env
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=True
PAYSTACK_SECRET_KEY=sk_test_your_paystack_key
FRONTEND_BASE_URL=http://localhost:4200
```

---

## Key Features

### 1. Orders Management
- Create orders with multiple items from inventory
- Track order status (pending → processing → delivered → cancelled)
- Payment status tracking (unpaid → paid)
- Order returns and refunds
- Real-time order statistics

### 2. Inventory Management
- SKU-based inventory tracking
- Stock quantity management
- Product catalog integration
- Multi-tenant inventory isolation

### 3. Payment Processing
- **Paystack Integration** for card payments
- Payment initialization and verification
- Payment history tracking
- Multiple payment attempts per order
- Automatic order status updates

### 4. Analytics & Reporting
- Order statistics and trends
- Revenue tracking
- Delivery performance metrics
- Custom date range filtering

### 5. Multi-Tenancy
- Complete data isolation per tenant
- Tenant-scoped API queries
- Secure tenant identification via headers

### 6. Authentication & Security
- JWT-based authentication
- Access token (5 min) + Refresh token (24 hours)
- Token blacklisting on logout
- Automatic token expiration monitoring
- Secure password reset flow
- Email verification

---

## Recent Development Work

### Authentication System Improvements

#### Problem
The original authentication system had several critical issues:
1. **Logout didn't work** when tokens were expired or already blacklisted
2. **No automatic logout** when tokens expired while app was open
3. **Tokens couldn't be blacklisted** if they were already expired
4. **Poor user experience** - users couldn't logout if tokens were invalid

#### Solution Implemented

**1. Frontend Token Management (`auth.service.ts`)**
- Added automatic token expiration monitoring
- Timer that tracks refresh token expiration
- Automatically logs out user when refresh token expires
- Logout now always clears local storage, even if API call fails

```typescript
// Monitors token expiration and auto-logout
private startTokenExpirationMonitoring() {
  const refreshToken = this.getRefreshToken();
  const refreshExpiration = this.getTokenExpiration(refreshToken);

  // Set timer to logout when refresh token expires
  this.tokenExpirationTimer = setTimeout(() => {
    console.warn('Refresh token expired - logging out automatically');
    this.clearAuth();
    this.router.navigate(['/auth/login']);
  }, refreshTimeUntilExpiry);
}
```

**2. Backend Logout Improvements (`authentication/views.py`)**
- Changed logout endpoint from `IsAuthenticated` to `AllowAny` permission
- Users can now logout even with expired access tokens
- Returns success (205) even if token is already blacklisted/expired
- Better error handling and logging

```python
# If token is already blacklisted or expired, still return success
if 'blacklist' in error_msg or 'expired' in error_msg:
    logger.info(f"Logout attempt with already blacklisted/expired token")
    return Response(
        {"detail": "Successfully logged out (token was already invalid)."},
        status=status.HTTP_205_RESET_CONTENT,
    )
```

**3. HTTP Interceptor Enhancement (`auth.interceptor.ts`)**
- Detects blacklisted token errors in 401 responses
- Automatically logs out if token is blacklisted
- Better error logging for debugging
- Handles refresh token failures gracefully

### Orders & Payment System

#### Problem
- Frontend and backend used inconsistent field naming (camelCase vs snake_case)
- Empty rows showing in orders table
- SKU not found errors when creating orders
- Payment initiation missing customer email

#### Solution Implemented

**1. Consistent Field Naming Convention**
- Unified all Order and Payment interfaces to use **snake_case** (matching Django convention)
- Updated all components and templates to use consistent naming:
  - `order_id` instead of `id`
  - `customer_name` instead of `customerName`
  - `total_amount` instead of `totalAmount`
  - `created_at` instead of `createdAt`

**2. Fixed Order Creation Flow**
- Changed catalog service to fetch from `/inventory/skus/` instead of `/catalog/products/`
- Orders backend expects SKU IDs from inventory service, not product IDs
- Ensured consistent use of `sku_id` throughout order creation process

**3. Payment Integration**
- Added `customer_email` field to Order interface
- Updated payment initiation to send customer email to Paystack
- Fixed field name mismatch: `email` → `customer_email`

**4. UI/UX Fixes**
- Added table row background colors for better visibility
- Fixed product select dropdown loading issues
- Improved quantity calculation and validation

### Payment Flow Implementation

The payment flow follows this sequence:

```
1. ORDER CREATED
   ↓
   [Order] status: pending, payment_status: unpaid

2. ADMIN CLICKS "INITIATE PAYMENT"
   ↓
   POST /api/orders/payments/paystack/initialize/
   {
     "order_id": "...",
     "customer_email": "customer@example.com",
     "amount": 1000,
     "currency": "NGN"
   }

3. BACKEND CALLS PAYSTACK API
   ↓
   Paystack creates payment session
   Returns: authorization_url (secure checkout page)

4. USER REDIRECTED TO PAYSTACK
   ↓
   Customer enters card details on Paystack's site
   (PCI compliant - we never see card details)

5. PAYMENT COMPLETED
   ↓
   Paystack redirects back to callback URL

6. VERIFY PAYMENT
   ↓
   GET /api/orders/payments/paystack/verify/{reference}/

7. UPDATE ORDER
   ↓
   [Order] payment_status: paid
   [PaystackTransaction] status: success
```

**Why This Approach?**
- **Security**: Card details never touch our servers
- **PCI Compliance**: Paystack handles all PCI requirements
- **User Trust**: Recognized payment gateway
- **Flexibility**: Supports multiple payment methods (card, bank transfer, USSD)

---

## API Documentation

### Base URL
- Development: `http://127.0.0.1:8000/api/`
- Production: `https://pulsecore-qk5b.onrender.com/api/`

### Authentication Endpoints

#### Register
```http
POST /auth/register/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe"
}

Response: 201 Created
{
  "message": "User created successfully. Please verify your email.",
  "verification_token": "abc123..."
}
```

#### Login
```http
POST /auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response: 200 OK
{
  "access": "eyJ0eXAiOiJKV1QiLC...",
  "refresh": "eyJ0eXAiOiJKV1QiLC...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "tenant_id": "276233a1-571e-4b8c-9af8-168fa67bc0f8"
}
```

#### Logout
```http
POST /auth/logout/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLC..."
}

Response: 205 Reset Content
{
  "detail": "Successfully logged out."
}
```

#### Refresh Token
```http
POST /auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLC..."
}

Response: 200 OK
{
  "access": "eyJ0eXAiOiJKV1QiLC..."
}
```

### Orders Endpoints

#### List Orders
```http
GET /orders/
Authorization: Bearer {access_token}
X-Tenant-ID: {tenant_id}

Response: 200 OK
{
  "count": 10,
  "results": [
    {
      "order_id": "abc123...",
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "status": "pending",
      "payment_status": "unpaid",
      "total_amount": 5000.00,
      "items": [
        {
          "item_id": "...",
          "sku_id": "...",
          "quantity": 2
        }
      ],
      "created_at": "2025-10-13T10:30:00Z",
      "updated_at": "2025-10-13T10:30:00Z"
    }
  ]
}
```

#### Create Order
```http
POST /orders/
Authorization: Bearer {access_token}
X-Tenant-ID: {tenant_id}
Content-Type: application/json

{
  "customer_name": "John Doe",
  "items": [
    {
      "sku_id": "abc123...",
      "quantity": 2
    }
  ],
  "status": "pending",
  "payment_status": "unpaid"
}

Response: 201 Created
{
  "order_id": "...",
  "customer_name": "John Doe",
  "total_amount": 5000.00,
  ...
}
```

#### Order Statistics
```http
GET /orders/stats/
Authorization: Bearer {access_token}
X-Tenant-ID: {tenant_id}

Response: 200 OK
{
  "totalOrders": 150,
  "pendingOrders": 25,
  "processingOrders": 30,
  "deliveredOrders": 90,
  "cancelledOrders": 5,
  "totalRevenue": 500000.00,
  "pendingPayments": 15
}
```

### Payment Endpoints

#### Initialize Payment
```http
POST /orders/payments/paystack/initialize/
Authorization: Bearer {access_token}
X-Tenant-ID: {tenant_id}
Content-Type: application/json

{
  "order_id": "abc123...",
  "customer_email": "customer@example.com",
  "amount": 5000,
  "currency": "NGN"
}

Response: 201 Created
{
  "reference": "T123456789",
  "authorization_url": "https://checkout.paystack.com/...",
  "access_code": "...",
  "status": "initialized"
}
```

#### Verify Payment
```http
GET /orders/payments/paystack/verify/{reference}/
Authorization: Bearer {access_token}
X-Tenant-ID: {tenant_id}

Response: 200 OK
{
  "reference": "T123456789",
  "status": "success",
  "amount": 5000.00,
  "paid_at": "2025-10-13T11:00:00Z"
}
```

---

## Authentication & Security

### JWT Token Flow

```
1. USER LOGS IN
   ↓
   Backend issues:
   - Access Token (5 min lifetime)
   - Refresh Token (24 hours lifetime)
   - Tenant ID

2. FRONTEND STORES TOKENS
   ↓
   localStorage:
   - token (access)
   - refresh-token (refresh)
   - tenant-id

3. API REQUESTS
   ↓
   HTTP Headers:
   - Authorization: Bearer {access_token}
   - X-Tenant-ID: {tenant_id}

4. TOKEN EXPIRATION
   ↓
   Access token expires (5 min)
   ↓
   Interceptor catches 401 error
   ↓
   Automatically refreshes using refresh token
   ↓
   Retries original request with new access token

5. REFRESH TOKEN EXPIRES (24 hours)
   ↓
   Auto-logout
   ↓
   Redirect to login page
```

### Security Features

1. **Token Blacklisting**
   - Refresh tokens are blacklisted on logout
   - Prevents token reuse after logout
   - Automatic cleanup of expired tokens

2. **Automatic Token Monitoring**
   - Frontend tracks token expiration
   - Auto-logout before refresh token expires
   - Prevents using expired tokens

3. **Secure Password Handling**
   - Passwords hashed with Django's PBKDF2
   - Password reset via one-time tokens (60 min expiry)
   - Token burned after single use

4. **CORS Configuration**
   - Restricted to allowed origins
   - Credentials support for cookies
   - Custom headers for tenant ID

---

## Payment Integration

### Paystack Setup

1. **Get API Keys**
   - Sign up at https://paystack.com
   - Get test keys from Settings → API Keys & Webhooks

2. **Configure Backend**
```python
# services/backend/settings.py
PAYSTACK_SECRET_KEY = 'sk_test_your_key_here'
```

3. **Test Payment Flow**
   - Use test card: `4084 0840 8408 4081`
   - CVV: `408`
   - Expiry: Any future date
   - PIN: `0000`
   - OTP: `123456`

### Payment States

| Status | Description |
|--------|-------------|
| `initialized` | Payment session created, waiting for customer |
| `pending` | Customer redirected to Paystack, payment in progress |
| `success` | Payment completed successfully |
| `failed` | Payment failed (card declined, insufficient funds, etc.) |

### Webhook Integration (Coming Soon)

Paystack can notify your backend when payment status changes:

```python
# Future implementation
@csrf_exempt
def paystack_webhook(request):
    payload = request.body
    signature = request.headers.get('x-paystack-signature')

    # Verify webhook signature
    if not verify_signature(payload, signature):
        return HttpResponse(status=400)

    # Process webhook event
    event = json.loads(payload)
    if event['event'] == 'charge.success':
        # Update order payment status
        pass
```

---

## Multi-Tenancy

### How It Works

PulseCore uses **header-based tenant identification**:

1. **User logs in** → Backend returns `tenant_id`
2. **Frontend stores** `tenant_id` in localStorage
3. **Every API request** includes `X-Tenant-ID` header
4. **Backend filters data** by tenant ID automatically

### Tenant Isolation

```python
# All models inherit from TenantScopedMixin
class Order(TenantScopedMixin):
    # Automatically adds tenant_id field
    # and filters all queries by tenant
    pass

# ViewSets automatically scope queries
class OrderViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        tenant_id = self.request.headers.get("X-Tenant-ID")
        return Order.objects.filter(tenant_id=tenant_id)
```

### Benefits

- Complete data isolation between tenants
- No risk of data leakage
- Easy to scale to multiple businesses
- Single codebase, multiple customers

---

## Development Guidelines

### Naming Conventions

- **Backend (Python/Django)**: Use `snake_case`
  - Models: `order_id`, `customer_name`, `total_amount`
  - URLs: `/api/orders/payments/paystack/initialize/`

- **Frontend (TypeScript/Angular)**: Use `snake_case` for API-related interfaces
  - Interfaces matching backend: `order_id`, `customer_name`
  - Components/services: `camelCase` for local variables

### Code Style

**Backend (Python)**
- Follow PEP 8
- Use Django coding style
- Document complex logic
- Add type hints where possible

**Frontend (TypeScript)**
- Use Angular style guide
- Leverage signals for reactive state
- Prefer standalone components (when possible)
- Use RxJS operators efficiently

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/payment-integration

# Make changes and commit
git add .
git commit -m "feat: add paystack payment integration"

# Push to remote
git push origin feature/payment-integration

# Create pull request on GitHub
```

### Commit Message Format

```
<type>: <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

---

## Testing

### Backend Tests

```bash
cd services

# Run all tests
python manage.py test

# Run specific app tests
python manage.py test main_services.orders

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

### Frontend Tests

```bash
cd admin-portal

# Run unit tests
ng test

# Run e2e tests
ng e2e

# Build production
ng build --configuration production
```

---

## Deployment

### Backend (Render)

1. Create new Web Service on Render
2. Connect GitHub repository
3. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn backend.wsgi:application`
4. Add environment variables
5. Deploy

### Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Configure:
   - Framework: Angular
   - Build Command: `ng build`
   - Output Directory: `dist/admin-portal`
3. Add environment variables
4. Deploy

---

## Troubleshooting

### Common Issues

**1. CORS Errors**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Add frontend URL to `CORS_ALLOWED_ORIGINS` in `settings.py`

**2. Token Expired**
```
401 Unauthorized: Token has expired
```
**Solution**: Refresh token automatically handled by interceptor. If refresh token also expired, user must re-login.

**3. Tenant ID Missing**
```
400 Bad Request: X-Tenant-ID header is required
```
**Solution**: Ensure auth interceptor adds X-Tenant-ID header to all requests

**4. SKU Not Found**
```
400 Bad Request: SKU xyz not found for this tenant
```
**Solution**: Ensure SKU exists in inventory for the current tenant

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## License

This project is proprietary software. All rights reserved.

---

## Contact & Support

For questions or support:
- Email: devsamuel0611@gmail.com
- GitHub Issues: [Create an issue](https://github.com/WebPhoenix2006/pulsecore/issues)

---

## Acknowledgments

- Django REST Framework for excellent API framework
- Angular team for modern frontend framework
- Paystack for reliable payment processing
- All contributors who helped build PulseCore

---

**Last Updated**: October 13, 2025
**Version**: 1.0.0
**Status**: Active Development

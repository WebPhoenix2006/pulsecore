export const api_url: string = 'http://127.0.0.1:8000/api';

export const Environments = {
  auth: {
    login: `${api_url}/auth/login/`,
    signup: `${api_url}/auth/register/`,
    verifyEmail: `${api_url}/auth/verify-email/`,
    logout: `${api_url}/auth/logout/`,
    refreshToken: `${api_url}/auth/token/refresh/`,
    passwordReset: `${api_url}/auth/password-reset/`,
    passwordResetConfirm: `${api_url}/auth/password-reset/confirm/`,
    currentUser: `${api_url}/auth/user/`,
  },
  catalog: {
    categories: `${api_url}/catalog/categories/`,
    products: `${api_url}/catalog/products/`,
  },
  orders: {
    orders: `${api_url}/orders/`,
    paystackInit: `${api_url}/orders/payments/paystack/initialize/`,
    paystackVerify: `${api_url}/orders/payments/paystack/verify/`,
  },
  suppliers: {
    suppliers: `${api_url}/suppliers/suppliers/`,
    purchaseOrders: `${api_url}/suppliers/purchase-orders/`,
  },
  inventory: {
    inventory: `${api_url}/inventory/`,
    alerts: `${api_url}/inventory/alerts/`,
    skus: `${api_url}/inventory/skus/`,
  },
};

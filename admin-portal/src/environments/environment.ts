export const api_url: string = 'http://127.0.0.1:8000/api';

export const Environments = {
  auth: {
    login: `${api_url}/auth/login/`,
    signup: `${api_url}/auth/register/`,
    verifyEmail: `${api_url}/auth/verify-email/`,
    logout: `${api_url}/auth/logout/`,
    refreshToken: `${api_url}/auth/token/refresh/`,
  },
};

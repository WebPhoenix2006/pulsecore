export const api_url: string = 'http://localhost:8000/api';

export const Environments = {
  auth: {
    login: `${api_url}/auth/login/`,
    signup: `${api_url}/auth/register/`,
    verifyEmail: `${api_url}/auth/verify-email/`,
  },
};

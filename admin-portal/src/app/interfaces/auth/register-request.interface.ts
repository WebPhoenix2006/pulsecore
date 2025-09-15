export interface RegisterRequestInterface {
  email: string;
  username: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  rememberMe?: boolean;
}

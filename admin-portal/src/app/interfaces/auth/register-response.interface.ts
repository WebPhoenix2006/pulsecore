import { User } from './user.interface';

export interface RegisterResponseInterface {
  message: string;
  verification_token: string;
}
export interface AuthResponseInterface {
  detail: string;
  token: string;
  refresh: string;
  user: User;
}

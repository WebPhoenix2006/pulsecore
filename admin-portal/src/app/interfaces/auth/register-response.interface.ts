import { User } from './user.interface';

export interface RegisterResponseInterface {
  message: string;
  verification_token: string;
}
export interface AuthResponseInterface {
  refresh: string;
  access: string;
  user: User;
  tenant_id: string;
}

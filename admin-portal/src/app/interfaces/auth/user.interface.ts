export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role: 'Admin' | 'Manager' | 'Viewer'; // adjust if more roles exist
  avatar: string | null;
  phone_number: string | null;
  date_joined: string; // ISO date string
}

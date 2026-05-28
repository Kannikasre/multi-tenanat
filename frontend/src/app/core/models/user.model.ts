export interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'USER';
  org_id?: number;
}

export interface ApiUser {
  _id?: string;
  id?: string;
  username?: string;
  name?: string;
  email: string;
  role: string;
  active?: boolean;
  sessions?: number;
  last_login?: string;
}

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: true | false;
  sessions: number;
  lastActive: string;
};
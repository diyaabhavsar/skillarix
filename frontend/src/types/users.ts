export interface ApiUser {
  _id?: string;
  id?: string;
  username?: string;
  name?: string;
  email: string;
  role: "admin" | "employee";
  active?: boolean;
  sessions?: number;
  last_login?: string;
}

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee";
  active: true | false;
  sessions: number;
  lastActive: string;
};
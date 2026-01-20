export type ViewState = 'login' | 'dashboard' | 'personnel' | 'processes';

export interface Sector {
  id: string;
  name: string;
}

export interface Process {
  id: string;
  data: string;
  nup: string;
  description: string;
}

export interface UserProfile {
  name: string;
  role: string;
  email: string | null;
}
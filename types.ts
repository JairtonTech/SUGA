
export type ViewState = 'login' | 'dashboard' | 'personnel' | 'personnel-detail' | 'processes';

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

export interface Personnel {
  id: string;
  name: string;
  role: string;
  registration: string; // Matrícula
  status: 'Ativo' | 'Férias' | 'Licença';
  sector: string;
}

export interface UserProfile {
  name: string;
  role: string;
  email: string | null;
}

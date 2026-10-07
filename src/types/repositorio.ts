export type UserPerfilRole = 'Administrador' | 'Docente' | 'Estudiante' | 'Personal no clases';

export interface MonografiaItem {
  documento_id: string;
  titulo: string;
  autor: string;
  grado: string;
  año: string;
  'Unidad Académica': string;
  'Linea de investigación': string;
  tipo: string;
  palabras_clave: string;
  resumen: string;
  'Asesor(es)': string;
  drive_file_id: string;
  url_documento: string;
  visibilidad: string;
  estado: string;
  fecha_registro: string;
  fecha_actualizacion: string;
  [key: string]: string;
}

export interface UsuarioItem {
  Nombres: string;
  Curso: string;
  Correo: string;
  Sección: string;
  Perfil: UserPerfilRole;
  isAdmin?: boolean;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  error?: string;
  syncedAt?: string;
  count?: number;
}

export interface CheckUserRoleResponse {
  registered: boolean;
  perfil: UserPerfilRole;
  isAdmin: boolean;
  user?: UsuarioItem;
}

export interface RepositorioStats {
  total: number;
  unidadesCount: number;
  yearsCount: number;
  lastSyncedAt?: string;
}

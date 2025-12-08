export interface Usuario {
  id_usuario: number;
  username: string;
  rol: string;
  id_sucursal: number;
  nombre_sucursal: string; // Asumo que viene esto también, o lo necesito para session.service
  nombre_completo: string;
  token?: string; // Usualmente viene un token
}

export interface LoginResponse {
  usuario: Usuario;
  token: string;
}

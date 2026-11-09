export interface Usuario {
    _id?: string;
    nombre: string;
    correo: string;
    contraseña?: string;
    codigo?: string;
    direccion: string;
    telefono: string;
    rol?: string;
}

export interface Sesion {
    usuario: Usuario;
    token: string;
}

export interface Comentario {
  _id?: string;
  usuario_id: string;
  nombreUsuario: string;
  producto_id: string;
  texto: string;
  fecha?: Date;
}

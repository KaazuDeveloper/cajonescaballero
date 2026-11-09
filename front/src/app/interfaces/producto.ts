export interface Producto {
  _id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  marca_id: string;
  stock: number;
  imagen_url: string;
  categoria: string;
  fecha_lanzamiento: Date;
}

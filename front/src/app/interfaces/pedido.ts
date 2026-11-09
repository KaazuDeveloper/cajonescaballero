export interface OrdenCompra {
  _id: string;
  usuario_id: string;
  productos: ProductoOrden[];
  estado: string;
}

export interface ProductoOrden {
  _id?: string;
  nombre: string;
  descripcion: string;
  tipo_madera?: string;
  numero_cuerdas?: number;
  dataUrl?: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  estado: string;
  imagen_url?: string;
}

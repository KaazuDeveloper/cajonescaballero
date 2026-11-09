import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { Producto } from '../interfaces/producto';

@Injectable({
  providedIn: 'root'
})

export class productoService {
  private url = environment.apiUrl;
  private http = inject(HttpClient);

  getProductos():Observable<Producto[]>{
    return this.http.get<Producto[]>(`${this.url}/productos`).pipe(
      catchError(error=>{
        return of ([])
      })
    );
  }

  getCuatroProductos():Observable<Producto[]>{
    return this.http.get<Producto[]>(`${this.url}/productos`).pipe(
      catchError(error => {
        return of([]);
      }),
      map(productos => productos.slice(0, 4))
    );
  }

  getProducto(id:string):Observable<Producto>{
    return this.http.get<Producto>(`${this.url}/productos/${id}`).pipe(
      map(res=>{
        return res as Producto;
      }),
      catchError(error=>{
        return of ({} as Producto)
      })
    );
  }

  addProducto(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(`${this.url}/productos`, producto);
  }

  updateProducto(producto:Producto,id:string):Observable<boolean>{
    return this.http.put<Producto>(`${this.url}/productos/${id}`,producto).pipe(
      map(res=>{
        return true;
      }),
      catchError(error=>{
        return of (false)
      })
    );
  }

  delProducto(_id:string | undefined):Observable<boolean>{
    return this.http.delete(`${this.url}/productos/${_id}`).pipe(
      map(()=>true),
      catchError(error=>{
       return of (false);
     })
    );
   }
}

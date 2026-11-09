import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { OrdenCompra } from '../interfaces/pedido';

@Injectable({
  providedIn: 'root'
})

export class pedidoService {
  private url = environment.apiUrl;
  private http = inject(HttpClient);

  /* The API checks the payment with Stripe before creating the order. */
  enviarOrdenCompra(pago: { session_id: string; dataUrl?: string }): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.url}/pedidos`, pago);
  }

  obtenerPedidos(): Observable<OrdenCompra[]> {
    return this.http.get<OrdenCompra[]>(`${this.url}/pedidos`).pipe(
      catchError(error => {
        return of([] as OrdenCompra[]);
      })
    );
  }

  obtenerPedidosUsuario(usuarioId: string): Observable<OrdenCompra[]> {
    return this.http.get<OrdenCompra[]>(`${this.url}/pedidos/${usuarioId}`).pipe(
      catchError(error => {
        return of([] as OrdenCompra[]); // Devuelve un arreglo vacío en caso de error
      })
    );
  }

  delPedido(id: string): Observable<any> {
    return this.http.delete<any>(`${this.url}/pedidos/${id}`);
  }

  updatePedido(id: string, update: any): Observable<any> {
    return this.http.put<any>(`${this.url}/pedidos/${id}`, update);
  }
}

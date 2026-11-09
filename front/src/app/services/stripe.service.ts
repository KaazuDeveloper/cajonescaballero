import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from '../../environments/environment';

export type Compra =
  | { items: { id: string; cantidad: number }[] }
  | { personalizado: { tipoMadera: unknown; tipoCuerdas: unknown } };

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private http = inject(HttpClient);

  /* The API works out the price and returns the Stripe payment page. */
  async procesarPago(compra: Compra): Promise<void> {
    try {
      const { url } = await firstValueFrom(
        this.http.post<{ url: string }>(`${environment.apiUrl}/crear-sesion-pago`, compra),
      );
      window.location.href = url;
    } catch (error) {
      if ((error as HttpErrorResponse).status !== 401) {
        Swal.fire({ icon: 'error', iconColor: '#8ea7f7', title: 'Error', confirmButtonColor: '#252525', text: 'No se ha podido iniciar el pago.' });
      }
    }
  }
}

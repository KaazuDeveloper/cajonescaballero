import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { Sesion, Usuario } from '../interfaces/usuario';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})

export class usuarioService {
  private url = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getUsuarios():Observable<Usuario[]>{
    return this.http.get<Usuario[]>(`${this.url}/usuarios`).pipe(
      catchError(error=>{
        return of ([])
      })
    );
  }

  getUsuario(id:string):Observable<Usuario>{
    return this.http.get<Usuario>(`${this.url}/usuarios/${id}`).pipe(
      map(res=>{
        return res as Usuario;
      }),
      catchError(error=>{
        return of ({} as Usuario)
      })
    );
  }

  loginUsuario(correo: string, contraseña: string): Observable<Sesion> {
    return this.http.post<Sesion>(`${this.url}/login`, { correo, contraseña });
  }

  addUsuario(usuario: Usuario): Observable<Sesion> {
    return this.http.post<Sesion>(`${this.url}/usuarios`, usuario);
  }

  enviarCodigo(email: string): Observable<unknown> {
    return this.http.post(`${this.url}/verify-code`, { email });
  }

  updateUsuario(usuario:Usuario,id:string):Observable<boolean>{
    return this.http.put<Usuario>(`${this.url}/usuarios/${id}`,usuario).pipe(
      map(res=>{
        return true;
      }),
      catchError(error=>{
        return of (false)
      })
    );
  }

  delUsuario(_id:string | undefined):Observable<boolean>{
    return this.http.delete(`${this.url}/usuarios/${_id}`).pipe(
      map(()=>true),
      catchError(error=>{
        return of (false);
      })
    );
  }
}

import { Injectable } from '@angular/core';
import { Sesion } from '../interfaces/usuario';

type Claims = { sub: string; rol?: string; exp: number };

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private readonly tokenKey = 'token';

  private get storage(): Storage | null {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  }

  login({ usuario, token }: Sesion): void {
    this.storage?.setItem(this.tokenKey, token);
    this.storage?.setItem('username', usuario.nombre);
    this.storage?.setItem('userId', usuario._id ?? '');
  }

  logout(): void {
    this.storage?.removeItem(this.tokenKey);
    this.storage?.removeItem('username');
    this.storage?.removeItem('userId');
  }

  getToken(): string | null {
    return this.claims() ? this.storage!.getItem(this.tokenKey) : null;
  }

  isAuthenticated(): boolean {
    return this.claims() !== null;
  }

  isAuthenticatedPromise(): Promise<boolean> {
    return Promise.resolve(this.isAuthenticated());
  }

  /* Only decides what the interface shows: the API checks the role on every request. */
  isAdmin(): boolean {
    return this.claims()?.rol === 'admin';
  }

  private claims(): Claims | null {
    const token = this.storage?.getItem(this.tokenKey);
    if (!token) return null;
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const claims: Claims = JSON.parse(new TextDecoder().decode(bytes));
      return claims.exp * 1000 > Date.now() ? claims : null;
    } catch {
      return null;
    }
  }
}

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginService } from '../services/login.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const login = inject(LoginService);
  const router = inject(Router);
  const token = login.getToken();
  const paraLaApi = req.url.startsWith(environment.apiUrl);

  const peticion = token && paraLaApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (paraLaApi && error.status === 401 && !req.url.endsWith('/login')) {
        login.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};

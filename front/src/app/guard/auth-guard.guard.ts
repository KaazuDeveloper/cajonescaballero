import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, CanActivateFn, Router, RouterStateSnapshot } from "@angular/router";
import { LoginService } from "../services/login.service";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})

export class PermissionsService implements CanActivate{
  constructor(private router: Router, private authService : LoginService) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}

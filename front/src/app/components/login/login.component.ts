import { environment } from '../../../environments/environment';
import { ADMIN_DEMO, CLIENTE_DEMO } from '../../demo/demo-api.interceptor';
  import { ChangeDetectorRef, Component, NgZone, inject, ChangeDetectionStrategy } from '@angular/core';
  import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
  import { usuarioService } from '../../services/usuario.service';
  
  import { Router, RouterLink } from '@angular/router';
  import { LoginService } from '../../services/login.service';
  import Swal from 'sweetalert2';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { first } from 'rxjs';

  @Component({
    selector: 'app-login',
    imports: [TranslatePipe, ReactiveFormsModule, RouterLink],
    templateUrl: './login.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './login.component.css'
})
  export class LoginComponent {
    readonly demo = environment.demo;
    readonly clienteDemo = CLIENTE_DEMO;
    readonly adminDemo = ADMIN_DEMO;
    loginForm: FormGroup;
    private userService = inject(usuarioService)
    private authService = inject(LoginService)

    constructor(private formBuilder: FormBuilder,private router: Router,private translate: TranslateService, private cd: ChangeDetectorRef,
      private ngZone: NgZone) {
      this.loginForm = this.formBuilder.group({
        correo: ['', [Validators.required, Validators.email]],
        contraseña: ['', Validators.required]
      });
    }

    entrarDemo(correo: string): void {
      this.loginForm.setValue({ correo, contraseña: 'demo' });
      this.login();
    }

    login() {
      if (this.loginForm.valid) {
        const correo = this.loginForm.get('correo')?.value;
        const contraseña = this.loginForm.get('contraseña')?.value;
        this.userService.loginUsuario(correo, contraseña).subscribe(
          response => {
            this.authService.login(response);

            const Toast = Swal.mixin({
              toast: true,
              position: "top-end",
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
              }
            });

            this.router.navigate(['/']).then(() => {
              this.ngZone.onStable.asObservable().pipe(first()).subscribe(() => {
                this.cd.detectChanges();
                window.scrollTo(0, 0);
                window.location.reload();
                localStorage.setItem('showToastLogin', 'true');
              });
            });
          },
          error => {
            Swal.fire({
              icon: 'error',
              iconColor: "#bf4800",
              title: 'Error',
              confirmButtonColor: "#1d1d1f",
              text: this.translate.getCurrentLang() === 'es' ? 'Ha ocurrido un error' :
                    this.translate.getCurrentLang() === 'en' ? 'An error has occurred' :
                    'Si è verificato un errore'
          });
          }
        );
      }
    }
  }

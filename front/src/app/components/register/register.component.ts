import { environment } from '../../../environments/environment';
import { ChangeDetectorRef, Component, NgZone, inject, ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { usuarioService } from '../../services/usuario.service';
import { LoginService } from '../../services/login.service';

import { Observable, first, of } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-register',
    imports: [ReactiveFormsModule, FormsModule, TranslatePipe, RouterLink],
    templateUrl: './register.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './register.component.css'
})
export class RegisterComponent {
  readonly demo = environment.demo;
  registerForm: FormGroup;
  showModal: boolean = false;
  verificationCode: string = '';
  private authService = inject(LoginService)
  private userService = inject(usuarioService)

  constructor(private formBuilder: FormBuilder,private router:Router, private translate: TranslateService, private cd: ChangeDetectorRef,
    private ngZone: NgZone) {
    this.registerForm = this.formBuilder.group({
      nombre: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      contraseña: ['', Validators.required, this.validatePassword],
      repetirContrasenia: ['', Validators.required],
      direccion: ['', Validators.required],
      telefono: ['', Validators.required, this.isNumber]
    });
    this.registerForm.get('contraseña')?.valueChanges.subscribe(() => {
      this.registerForm.get('repetirContrasenia')?.setValidators(
        this.repetirPasswordValidator(this.registerForm.get('contraseña')?.value)
      );
      this.registerForm.get('repetirContrasenia')?.updateValueAndValidity();
    });
  }

  validatePassword(control: any): Observable<any> {
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\S]{8,}$/;
    if (control.value && !passwordPattern.test(control.value)) {
      return of({ invalidPassword: true });
    }
    return of(null);
  }

  isNumber(control: any): Observable<any> {
    const phonePattern = /^[0-9]{9}$/;
    if (control.value && !phonePattern.test(control.value)) {
      return of({ invalidNumber: true });
    }
    return of(null);
  }

  repetirPasswordValidator(contrasenia: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const repetirContraseña = control.value;

      if (contrasenia && repetirContraseña && contrasenia === repetirContraseña) {
        return null;
      } else {
        return { passwordMismatch: true };
      }
    };
  }

  submitRegister(){
    this.userService.addUsuario({ ...this.registerForm.value, codigo: this.getVerificationCode() }).subscribe(
      response => {
        this.authService.login(response);
        this.closeModal();
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
            Toast.fire({
              icon: "success",
              iconColor: "#bf4800",
              title: this.translate.getCurrentLang() === 'es' ? 'Usuario registrado correctamente' :
                     this.translate.getCurrentLang() === 'en' ? 'User registered successfully' :
                     'Utente registrato con successo'
            });
            localStorage.setItem('showToastRegister', 'true');
          });
        });

      },
      error => this.mostrarErrorRegistro(error.status)
      );
  }

  private mostrarErrorRegistro(status: number) {
    const textos: Record<string, [string, string, string]> = {
      400: ['Código de verificación erróneo', 'Incorrect verification code', 'Codice di verifica errato'],
      409: ['Este email ya existe.', 'This email already exists.', 'Questa email esiste già.'],
    };
    const [es, en, it] = textos[status] ?? ['Ha ocurrido un error', 'An error has occurred', 'Si è verificato un errore'];
    Swal.fire({
      icon: 'error',
      iconColor: "#bf4800",
      title: 'Error',
      confirmButtonColor: "#1d1d1f",
      text: this.translate.getCurrentLang() === 'es' ? es : this.translate.getCurrentLang() === 'en' ? en : it
    });
  }

  sendVerificationEmail() {
    if (this.registerForm.valid) {
      this.submitVerificationCode();
    }
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  submitVerificationCode() {
    this.userService.enviarCodigo(this.registerForm.get('correo')?.value).subscribe({
      next: () => this.openModal(),
      error: (error) => this.mostrarErrorRegistro(error.status),
    });
  }

  confirmVerificationCode() {
    this.submitRegister();
  }

  moveToNext(event: any, index: number) {
    const input = event.target;
    if (!input.value && index > 0) {
      const prevInput = document.getElementById(`input${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        return;
      }
    }
    if (input.value && index < 6) {
      const nextInput = document.getElementById(`input${index + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
    this.verificationCode = this.getVerificationCode();
  }

  getVerificationCode(): string {
    let code = '';
    for (let i = 1; i <= 6; i++) {
      const input = document.getElementById(`input${i}`) as HTMLInputElement;
      code += input.value || '';
    }
    return code;
  }
}

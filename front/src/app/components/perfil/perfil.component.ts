import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Usuario } from '../../interfaces/usuario';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { usuarioService } from '../../services/usuario.service';
import Swal from 'sweetalert2';
import { Observable, of } from 'rxjs';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SpinnerService } from '../../services/spinner-service.service';

@Component({
    selector: 'app-perfil',
    imports: [ReactiveFormsModule, TranslatePipe],
    templateUrl: './perfil.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {
  perfilForm: FormGroup;
  usuario: Usuario;
  messageWithLink?: string;

  constructor(
    private fb: FormBuilder,
    private usuarioService: usuarioService,
    private translate: TranslateService,
    private spinner: SpinnerService

  ) {
    this.perfilForm = this.fb.group({
      nombre: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      direccion: ['', Validators.required],
      telefono: ['', Validators.required, this.isNumber]
    });

    this.usuario = {
      nombre: '',
      correo: '',
      contraseña: '',
      direccion: '',
      telefono: ''
    };

    this.translate.onLangChange.subscribe(() => {
      this.setMessageWithLink();
    });
    this.setMessageWithLink();
  }

  setMessageWithLink(): void {
    if (this.translate.getCurrentLang() === 'es') {
      this.messageWithLink = `<p style='margin-bottom:3px;'>Datos de la cuenta actualizados correctamente.</p>`;
    } else {
      this.messageWithLink = `<p style='margin-bottom:3px;'>Account details updated successfully.</p>`;
    }
  }

  isNumber(control: any): Observable<any> {
    const phonePattern = /^[0-9]{9}$/;
    if (control.value && !phonePattern.test(control.value)) {
      return of({ invalidNumber: true });
    }
    return of(null);
  }

  ngOnInit(): void {
    this.obtenerUsuario();
  }

  obtenerUsuario(): void {
    this.spinner.show()
    let idUsuario = sessionStorage.getItem("userId");
    // Supongamos que tienes un método en tu servicio para obtener el usuario actual
    this.usuarioService.getUsuario(idUsuario || "").subscribe(
      (data: Usuario) => {
        this.usuario = data;
        this.perfilForm.patchValue(this.usuario);
        this.spinner.hide()
  },
      (error) => {
        this.spinner.hide()
      }
    );
  }

  onSubmit(): void {
    let idUsuario = sessionStorage.getItem("userId");

    // Verificar si el formulario es válido
    if (this.perfilForm.valid) {
      // Verificar si al menos un campo ha sido modificado
      const formControls = this.perfilForm.controls;
      const hasChanges = Object.keys(formControls).some(key => formControls[key].dirty);

      if (hasChanges) {
        const usuarioActualizado = { ...this.usuario, ...this.perfilForm.value };

        this.usuarioService.updateUsuario(usuarioActualizado, idUsuario || "").subscribe(
          (response) => {
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

            Toast.fire({
              icon: "success",
              iconColor: "#bf4800",
              html: this.messageWithLink
            });
          },
          (error) => {
          }
        );
      } else {
      }
    }
  }
}

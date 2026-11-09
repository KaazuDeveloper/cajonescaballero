import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { productoService } from '../../services/producto.service';
import { Producto } from '../../interfaces/producto';

import { marcaService } from '../../services/marca.service';
import { Marca } from '../../interfaces/marca';
import { SpinnerService } from '../../services/spinner-service.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-gestion-productos',
    imports: [TranslatePipe, ReactiveFormsModule],
    templateUrl: './gestion-productos.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./gestion-productos.component.css']
})
export class GestionProductosComponent implements OnInit {
  marcas: Marca[] = [];
  productoForm: FormGroup;
  selectedFile: File | null = null;

  cargarMarcas(): void {
    this.marcaService.getMarcas().subscribe(marcas => {
      this.marcas = marcas;
    }, error => {
    });
  }

  constructor(private fb: FormBuilder,private translate: TranslateService, private productoService: productoService, private marcaService: marcaService, private spinnerService: SpinnerService) {
    this.productoForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      precio: ['', [Validators.required, Validators.min(0)]],
      marca_id: ['', Validators.required],
      stock: ['', [Validators.required, Validators.min(0)]],
      imagen_url: ['', Validators.required],
      categoria: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarMarcas();
  }

  onSubmit(): void {
    if (this.productoForm.invalid) {
        Swal.fire(this.translate.getCurrentLang() === 'es' ? "Por favor, complete todos los campos requeridos" :
                  this.translate.getCurrentLang() === 'en' ? "Please complete all required fields" :
                  "Si prega di compilare tutti i campi richiesti");
        return;
    }
    if (!this.selectedFile) {
        Swal.fire(this.translate.getCurrentLang() === 'es' ? "Por favor, seleccione una imagen para el producto" :
                  this.translate.getCurrentLang() === 'en' ? "Please select an image for the product" :
                  "Si prega di selezionare un'immagine per il prodotto");
        return;
    }

    this.spinnerService.show();
    const nuevoProducto: Producto = {
        ...this.productoForm.value,
        fecha_lanzamiento: new Date()
    };

    this.productoService.addProducto(nuevoProducto).subscribe(response => {
        this.spinnerService.hide();
        Swal.fire(this.translate.getCurrentLang() === 'es' ? "Producto añadido al carrito satisfactoriamente" :
                  this.translate.getCurrentLang() === 'en' ? "Product added to cart successfully" :
                  "Prodotto aggiunto al carrello con successo");
    }, error => {
        this.spinnerService.hide();
        Swal.fire(this.translate.getCurrentLang() === 'es' ? "Error al añadir el producto" :
                  this.translate.getCurrentLang() === 'en' ? "Error adding the product" :
                  "Errore nell'aggiungere il prodotto");
    });
}


  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.productoForm.patchValue({ imagen_url: `/assets/img/design/${file.name}` });
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedFile = null;
      this.productoForm.patchValue({ imagen_url: '' });
    }
  }
}

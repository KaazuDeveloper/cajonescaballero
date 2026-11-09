import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cuerdas',
  standalone: true
})
export class CuerdasPipe implements PipeTransform {

  transform(cadena: string): string {
    if (cadena == "sin-cuerdas") {
      return "Sin cuerdas";
    }else if(cadena == "una-cuerda-central"){
      return "Una cuerda central";
    }else if(cadena == "dos-cuerdas-v"){
      return "Dos cuerdas en V";
    }else{
      return "Varias cuerdas";
    }
  }

}

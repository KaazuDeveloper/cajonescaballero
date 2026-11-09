import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stockFilter',
  standalone: true
})
export class StockFilterPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}

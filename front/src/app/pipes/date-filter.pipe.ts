import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFilter',
  standalone: true
})
export class DateFilterPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}

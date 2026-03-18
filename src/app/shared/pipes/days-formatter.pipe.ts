import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'daysFormatter',
  standalone: true
})
export class DaysFormatterPipe implements PipeTransform {
  transform(days: string[]): string {
    if (!days || days.length === 0) return '';
    
    // Caso especial: Lunes a Viernes (5 días laborables)
    const weekDays = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
    const isFullWeek = days.length === 5 && weekDays.every(day => days.includes(day));
    
    if (isFullWeek) {
      return 'Lunes a Viernes';
    }

    if (days.length === 1) {
      return days[0];
    }

    if (days.length === 2) {
      return `${days[0]} y ${days[1]}`;
    }

    // Para 3 o más días: "Día1, Día2 y Día3"
    const lastDay = days[days.length - 1];
    const otherDays = days.slice(0, -1).join(', ');
    
    return `${otherDays} y ${lastDay}`;
  }
}

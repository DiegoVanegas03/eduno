import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roleTranslate',
  standalone: true
})
export class RoleTranslatePipe implements PipeTransform {
  private roleLabels: Record<string, string> = {
    alumno: 'Alumno',
    profesor: 'Profesor',
    moderador: 'Moderador',
    admin: 'Administrador',
  };

  transform(role: string | undefined | null): string {
    if (!role) return '';
    return this.roleLabels[role.toLowerCase()] || role;
  }
}

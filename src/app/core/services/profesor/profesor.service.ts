import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Profesor, ProfesorDetalle } from '@core/models/profesor.model';
import { PROFESORES_MOCK } from './profesor.mock';

@Injectable({
  providedIn: 'root',
})
export class ProfesorService {
  constructor() {}

  getProfesores(): Observable<Profesor[]> {
    // Para la lista principal, podemos mapear a la estructura base y quitar detalles extraños
    const resumidos: Profesor[] = PROFESORES_MOCK.map((p) => {
      const { materias, resenas, materiasPasadas, ...base } = p;
      return base;
    });
    return of(resumidos);
  }

  getProfesorById(id: number): Observable<ProfesorDetalle | undefined> {
    const prof = PROFESORES_MOCK.find((p) => p.id === id);
    return of(prof);
  }
}

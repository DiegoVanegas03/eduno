import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { IApiResponse, IPaginatedResponse, IProfessor } from '@eduno/shared';
import { Profesor, ProfesorDetalle } from '@core/models/profesor.model';

@Injectable({
  providedIn: 'root',
})
export class ProfesorService {
  private http = inject(HttpClient);

  getProfesores(params?: {
    search?: string;
    areaCode?: number;
    page?: number;
    limit?: number;
  }): Observable<IPaginatedResponse<Profesor[]>> {
    return this.http.get<IPaginatedResponse<IProfessor[]>>('/api/professors', {
      params: params as any,
    }).pipe(
      map(res => {
        const mappedData = (res.data || []).map(p => ({
          id: p.id,
          nombre: p.name,
          titulo: p.isVerificado ? 'Profesor Verificado' : 'Docente',
          inicial: p.name.charAt(0),
          materiaPrincipal: 'Materia Académica',
          calificacion: p.calificacion,
          numResenas: p.numResenas,
          descripcionAbreviada: p.descripcionAbreviada || 'Sin opiniones todavía.',
          isVerificado: p.isVerificado,
          descripcionPerfil: p.descripcionPerfil || '',
        }));
        return {
          ...res,
          data: mappedData,
        };
      })
    );
  }

  getTrendingProfesores(): Observable<IApiResponse<Profesor[]>> {
    return this.http.get<IApiResponse<IProfessor[]>>('/api/professors/trending').pipe(
      map(res => {
        const mappedData = (res.data || []).map(p => ({
          id: p.id,
          nombre: p.name,
          titulo: p.isVerificado ? 'Profesor Verificado' : 'Docente',
          inicial: p.name.charAt(0),
          materiaPrincipal: 'Materia Académica',
          calificacion: p.calificacion,
          numResenas: p.numResenas,
          descripcionAbreviada: p.descripcionAbreviada || 'Sin opiniones todavía.',
          isVerificado: p.isVerificado,
          descripcionPerfil: p.descripcionPerfil || '',
        }));
        return {
          ...res,
          data: mappedData,
        };
      })
    );
  }

  getProfesorById(id: string): Observable<IApiResponse<ProfesorDetalle>> {
    return this.http.get<IApiResponse<any>>(`/api/professors/${id}`).pipe(
      map(res => {
        const p = res.data;
        if (!p) return res;

        // Group schedules into materias and grupos
        const materiasMap: Record<string, any> = {};
        const schedules = p.schedules || [];

        schedules.forEach((s: any, idx: number) => {
          const key = s.courseCode;
          if (!materiasMap[key]) {
            materiasMap[key] = {
              id: key,
              nombre: s.courseName || 'Materia Académica',
              clave: s.courseCode,
              gruposCount: 0,
              grupos: [],
              recursos: [],
            };
          }

          materiasMap[key].grupos.push({
            id: s.id || idx.toString(),
            nombre: s.group.toString().padStart(2, '0'),
            dias: s.days || [],
            horario: s.timeBlock || '',
            salon: (s.building && s.classroom) ? `${s.building}-${s.classroom}` : s.classroom || '',
            ocupacion: s.occupancy || 0,
            tipoDocencia: s.type || 'Presencial',
          });
          materiasMap[key].gruposCount++;
        });

        const reviews = (p.reviews || []).map((r: any) => ({
          id: r.id,
          autor: r.user?.name || 'Estudiante',
          tiempoAgo: 'Reciente',
          rating: r.rating,
          comentario: r.comment,
          materia: 'Clase',
        }));

        const detail: ProfesorDetalle = {
          id: p.id,
          nombre: p.name,
          titulo: p.isVerificado ? 'Profesor Verificado' : 'Docente',
          inicial: p.name.charAt(0),
          materiaPrincipal: Object.values(materiasMap)[0]?.nombre || 'Materia Académica',
          calificacion: p.calificacion,
          numResenas: p.numResenas,
          descripcionAbreviada: p.descripcionAbreviada || '',
          isVerificado: p.isVerificado,
          descripcionPerfil: p.descripcionPerfil || '',
          materias: Object.values(materiasMap),
          materiasPasadas: [],
          resenas: reviews,
        };

        return {
          ...res,
          data: detail,
        };
      })
    );
  }
}

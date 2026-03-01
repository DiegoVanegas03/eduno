export interface Profesor {
  id: number;
  nombre: string;
  titulo: string; // Ej: "Doctor", "Mtro."
  inicial: string; // Ej: "M", "S"
  materiaPrincipal: string;
  calificacion: number;
  numResenas: number;
  descripcionAbreviada: string;
  colorTheme: 'cerulean' | 'punch-red' | 'honeydew' | 'oxford-navy';
}

export interface Recurso {
  id: number;
  nombre: string;
  subidoPor: string;
  tamano: string;
  isPdf: boolean; // Para elegir el ícono
  fecha: string; // ISO String para fácil ordenamiento
}

export interface Grupo {
  id: number;
  nombre: string; // Ej: "01", "04"
  colorBadge: string; // Ej: "punch-red-400", "honeydew-500"
  horario: string; // Ej: "Lunes, Miércoles y Viernes"
  recursos: Recurso[];
}

export interface Materia {
  id: number;
  nombre: string;
  gruposCount: number;
  colorTheme: 'cerulean' | 'punch-red' | 'honeydew' | 'oxford-navy';
  grupos: Grupo[];
}

export interface Resena {
  id: number;
  autor: string;
  tiempoAgo: string;
  rating: number; // Ej: 4, 5
  comentario: string;
  materia: string;
  colorTheme: 'cerulean' | 'punch-red' | 'honeydew' | 'oxford-navy';
}

export interface ProfesorDetalle extends Profesor {
  materias: Materia[];
  resenas: Resena[];
}

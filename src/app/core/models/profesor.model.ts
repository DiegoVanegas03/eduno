export interface Profesor {
  id: number;
  nombre: string;
  titulo: string; // Ej: "Doctor", "Mtro."
  inicial: string; // Ej: "M", "S"
  materiaPrincipal: string;
  calificacion: number;
  numResenas: number;
  descripcionAbreviada: string;
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
  horario: string; // Ej: "Lunes, Miércoles y Viernes"
  recursos: Recurso[];
}

export interface Materia {
  id: number;
  nombre: string;
  gruposCount: number;
  grupos: Grupo[];
}

export interface Resena {
  id: number;
  autor: string;
  tiempoAgo: string;
  rating: number; // Ej: 4, 5
  comentario: string;
  materia: string;
}

export interface ProfesorDetalle extends Profesor {
  materias: Materia[];
  resenas: Resena[];
}

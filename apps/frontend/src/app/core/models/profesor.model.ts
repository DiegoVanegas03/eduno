export interface Profesor {
  id: number;
  nombre: string;
  titulo: string; // Ej: "Doctor", "Mtro."
  inicial: string; // Ej: "M", "S"
  materiaPrincipal: string;
  calificacion: number;
  numResenas: number;
  descripcionAbreviada: string;
  isVerificado?: boolean;
  descripcionPerfil?: string;
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
  dias: string[]; // Ej: ["Lunes", "Miércoles", "Viernes"]
  horario: string; // Ej: "07:00 - 09:00"
  salon: string;
  ocupacion: number; // Porcentaje de ocupación
  tipoDocencia: 'Presencial' | 'En línea' | 'Presencial en Inglés' | 'En línea en Inglés';
}

export interface Materia {
  id: number;
  nombre: string;
  clave: string;
  gruposCount: number;
  grupos: Grupo[];
  recursos: Recurso[];
}

export interface HistorialMateria {
  id: number;
  nombre: string;
  clave: string;
  semestres: string[]; // Ej: ["2023-1", "2023-2"]
  fechaInicio: string; // Cuándo comenzó a impartirla
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
  materiasPasadas: HistorialMateria[];
  resenas: Resena[];
}

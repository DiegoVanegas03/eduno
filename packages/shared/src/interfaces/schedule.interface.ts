export interface ISchedule {
  id?: string;
  courseCode: string;
  courseName: string;
  group: number;
  type: string;
  timeBlock: string;
  days: number[];
  professor: string;
  building: string;
  classroom: string;
  occupancy: number; // Porcentaje de ocupación (0 a 100)
  areaCode: number;   // Código numérico del área académica
  period: string;     // Periodo escolar (ej. "2026-I")
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IScheduleFilters {
  period?: string;
  areaCode?: number;
  courseCode?: string;
  professor?: string;
  group?: number;
}

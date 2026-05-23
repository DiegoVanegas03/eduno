export const ACADEMIC_AREAS = {
  0: "Departamento Físico Matemáticas",
  1: "Formación Humanistica",
  2: "Ciencias de la Computación",
  3: "Civil",
  4: "Ciencias de la Tierra",
  5: "Mecanica y Electrica",
  6: "Metalurgia y Materiales",
  7: "Agroindustrial",
  8: "Departamento Universitario de Inglés"
} as const;

export type AcademicAreaCode = keyof typeof ACADEMIC_AREAS;

export const getAcademicAreaName = (code: number): string => {
  return ACADEMIC_AREAS[code as AcademicAreaCode] ?? "Área Desconocida";
};

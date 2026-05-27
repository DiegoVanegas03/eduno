export interface IProfessor {
  id: string;
  name: string;
  userId?: string | null;
  isVerificado: boolean;
  email?: string | null;
  calificacion: number;
  numResenas: number;
  descripcionAbreviada?: string;
  descripcionPerfil?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ICreateProfessorDTO {
  name: string;
  email?: string;
  calificacion?: number;
  descripcionAbreviada?: string;
  descripcionPerfil?: string;
}

export interface IUpdateProfessorDTO {
  name?: string;
  email?: string;
  userId?: string | null;
  isVerificado?: boolean;
  calificacion?: number;
  descripcionAbreviada?: string;
  descripcionPerfil?: string;
}

export interface IVerifyProfessorDTO {
  professorId: string;
}

export interface ICareer {
  id: string;
  name: string;
  areaCode?: number;
  semesters: number;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type ICreateCareerDTO = Omit<ICareer, "id" | "createdAt" | "updatedAt">;
export type IUpdateCareerDTO = Partial<ICreateCareerDTO>;

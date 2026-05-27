export interface ICoursePlan {
  code: string;
  name: string;
  theoryHours: string;
  practicalHours: string;
  credits: string;
  cacei: string;
  prerequisites: string[];
  type: string;
}

export interface ISemesterPlan {
  semester: number;
  courses: ICoursePlan[];
  canInscribeEmphasis: boolean;
}

export interface IEmphasisArea {
  name: string;
  courses: ICoursePlan[];
}

export interface IStudyPlanStructure {
  semesters: ISemesterPlan[];
  emphasisAreas: IEmphasisArea[];
}

export interface IStudyPlan {
  id: string;
  name: string;
  career: string; // ID referencing Career (as string/ObjectId)
  isActive: boolean;
  isLatest: boolean;
  url?: string;
  structure?: IStudyPlanStructure;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type ICreateStudyPlanDTO = Omit<
  IStudyPlan,
  "id" | "createdAt" | "updatedAt"
>;
export type IUpdateStudyPlanDTO = Partial<ICreateStudyPlanDTO>;

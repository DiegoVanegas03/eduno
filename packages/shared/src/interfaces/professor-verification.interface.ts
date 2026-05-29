export interface IProfessorVerificationRequest {
  id: string;
  professorId: string;
  professorName: string;
  userId: string;
  userName: string;
  userEmail: string;
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ICreateVerificationRequestDTO {
  professorId: string;
}

export interface IApproveVerificationRequestDTO {
  status: 'approved' | 'rejected';
  notes?: string;
}

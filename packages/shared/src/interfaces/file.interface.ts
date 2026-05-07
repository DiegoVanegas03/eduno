export interface IFileBase {
  originalName: string;
  minioObjectName: string;
  size: number;
  mimetype: string;
  isClean: boolean;
}

export interface IFile extends IFileBase {
  id: string;
  uploadedAt: Date;
}

export interface IFileBase {
  originalName: string;
  minioObjectName: string;
  size: number;
  mimetype: string;
  isClean: boolean;
}

export interface IFile extends IFileBase {
  id: string;
  uploaderId: string;
  materiaId: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: Date;
}

export interface IDownloadStats {
  downloadsLeft: number;
  maxDownloads: number;
  totalUploads: number;
  lastDownloadDate: string | Date | null;
}

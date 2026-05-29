export type ReportReasonType = 'spam' | 'abuse' | 'inappropriate_content' | 'copyright' | 'other';

export interface IReport {
  id: string;
  reporterId: string;
  targetType: 'review' | 'file';
  targetId: string;
  reasonType: ReportReasonType;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ICreateReportDTO {
  targetType: 'review' | 'file';
  targetId: string;
  reasonType: ReportReasonType;
  description: string;
}

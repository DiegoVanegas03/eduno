export const FILE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type FileStatus = (typeof FILE_STATUS)[keyof typeof FILE_STATUS];

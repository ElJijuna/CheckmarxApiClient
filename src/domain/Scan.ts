export interface CheckmarxScan {
  id: string;
  status: CheckmarxScanStatus;
  statusDetails?: CheckmarxScanStatusDetail[];
  branch?: string;
  createdAt?: string;
  updatedAt?: string;
  projectId?: string;
  projectName?: string;
  userAgent?: string;
  initiator?: string;
  tags?: Record<string, string>;
  metadata?: Record<string, unknown>;
  engines?: string[];
}

export type CheckmarxScanStatus = 'Queued' | 'Running' | 'Completed' | 'Failed' | 'Canceled' | 'Partial';

export interface CheckmarxScanStatusDetail {
  name: string;
  status: string;
  details?: string;
}

export interface ScansParams {
  'project-id'?: string;
  'project-name'?: string;
  branch?: string;
  status?: string;
  tags?: string;
  limit?: number;
  offset?: number;
  'from-date'?: string;
  'to-date'?: string;
}

export interface CheckmarxReportRequest {
  reportName?: string;
  fileFormat?: CheckmarxReportFormat;
  reportType?: string;
  data?: CheckmarxReportData;
}

export type CheckmarxReportFormat = 'PDF' | 'CSV' | 'JSON' | 'XLSX';

export interface CheckmarxReportData {
  projectId?: string;
  scanId?: string;
  branchName?: string;
}

export interface CheckmarxReportResponse {
  reportId: string;
}

export interface CheckmarxReportStatus {
  reportId: string;
  status: CheckmarxReportStatusValue;
  url?: string;
}

export type CheckmarxReportStatusValue = 'Requested' | 'Started' | 'Completed' | 'Failed' | 'Deleted';

export interface ReportDownloadParams {
  'report-id'?: string;
}

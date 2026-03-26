export interface CheckmarxScanSummary {
  scanId: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
  sastCounters?: CheckmarxSastCounters;
  scaCounters?: CheckmarxScaCounters;
  kicsCounters?: CheckmarxKicsCounters;
}

export interface CheckmarxSastCounters {
  totalCounter?: number;
  highCounter?: number;
  mediumCounter?: number;
  lowCounter?: number;
  infoCounter?: number;
}

export interface CheckmarxScaCounters {
  totalCounter?: number;
  highCounter?: number;
  mediumCounter?: number;
  lowCounter?: number;
}

export interface CheckmarxKicsCounters {
  totalCounter?: number;
  highCounter?: number;
  mediumCounter?: number;
  lowCounter?: number;
  infoCounter?: number;
  traceCounter?: number;
}

export interface ScanSummaryParams {
  'scan-ids'?: string;
  'include-queries'?: boolean;
  'include-status-counters'?: boolean;
}

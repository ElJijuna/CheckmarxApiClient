export interface CheckmarxSeverityCounter {
  severity: string;
  counter: number;
}

export interface CheckmarxTotalCounters {
  severityCounters: CheckmarxSeverityCounter[];
}

export interface CheckmarxEngineData {
  engineId?: string;
  engineName?: string;
  lastScanDate?: string;
  lastScanId?: string;
}

export interface CheckmarxProjectOverview {
  projectId: string;
  projectName: string;
  applications: string[];
  enginesData: CheckmarxEngineData[];
  groupIds: string[];
  importedProjName: string;
  isPublic: boolean;
  isDeployed: boolean;
  lastScanDate: string;
  projectOrigin: string;
  repoId: number;
  riskLevel: string;
  scmRepoId: string;
  sourceOrigin: string;
  sourceType: string;
  tags: Record<string, string>;
  totalCounters: CheckmarxTotalCounters;
}

export interface CheckmarxProjectsOverviewResponse {
  projects: CheckmarxProjectOverview[];
}

export interface ProjectsOverviewParams {
  limit?: number;
  offset?: number;
  'project-ids'?: string;
  tags?: string;
  'branch-name'?: string;
}

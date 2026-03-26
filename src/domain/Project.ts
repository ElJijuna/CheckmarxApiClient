export interface CheckmarxProject {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: Record<string, string>;
  groups?: string[];
  applicationIds?: string[];
  mainBranch?: string;
  repoUrl?: string;
  criticality?: number;
}

export interface ProjectsParams {
  limit?: number;
  offset?: number;
  name?: string;
  ids?: string;
  tags?: string;
}

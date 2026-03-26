export interface CheckmarxBranch {
  name: string;
}

export interface BranchesParams {
  limit?: number;
  offset?: number;
  branchName?: string;
}

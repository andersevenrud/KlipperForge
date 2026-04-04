export interface AuthUser {
  userId: string;
  githubId: number;
  username: string;
}

export interface AuthMeResponse {
  user: AuthUser | null;
}

export interface ConfigSummary {
  id: string;
  name: string;
  currentRevision: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigListResponse {
  configs: ConfigSummary[];
  maxConfigs: number;
}

export interface RevisionDetail {
  number: number;
  comment: string | null;
  document: string;
  createdAt: string;
}

export interface ConfigDetailResponse {
  id: string;
  name: string;
  currentRevision: number;
  createdAt: string;
  updatedAt: string;
  latestRevision: RevisionDetail;
}

export interface CreateConfigResponse {
  id: string;
  name: string;
  revision: number;
  createdAt: string;
}

export interface UpdateConfigResponse {
  id: string;
  revision: number;
  updatedAt: string;
}

export interface RevisionSummary {
  number: number;
  comment: string | null;
  documentSize: number;
  createdAt: string;
}

export interface RevisionListResponse {
  revisions: RevisionSummary[];
}

export interface RevisionDetailResponse {
  number: number;
  comment: string | null;
  document: string;
  documentSize: number;
  createdAt: string;
}

export interface ShareInfo {
  id: string;
  shareToken: string;
  createdAt: string;
  accessCount: number;
  lastAccessed: string | null;
}

export interface CreateShareResponse {
  id: string;
  shareToken: string;
  createdAt: string;
}

export interface ShareListResponse {
  shares: ShareInfo[];
}

export interface SharedConfigResponse {
  name: string;
  document: string;
  revisionNumber: number;
  owner: string;
  sharedAt: string;
}

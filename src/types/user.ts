export interface Activity {
  id: number;
  type: string;
  action: string;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  analysisCount?: number;
  workspaceCount?: number;
  collaborationCount?: number;
  recentActivities?: Activity[];
} 
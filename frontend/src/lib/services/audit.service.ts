import api from '@/lib/api';

export async function requestAudit(projectId: string) {
  return api.post(`/projects/${projectId}/site-audit`);
}

export async function getAuditProgress(projectId: string) {
  return api.get(`/projects/${projectId}/site-audit/progress`);
}

export async function getAuditReport(projectId: string) {
  return api.get(`/projects/${projectId}/site-audit/report`);
}

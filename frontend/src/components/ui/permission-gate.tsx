import React from 'react';

// Single-user application - simplified permission gate (always allows access)
interface PermissionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ children }: PermissionGateProps) {
  return <>{children}</>;
}

// Simplified permission gates for single-user application
export function ProjectPermissionGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function ArticlePermissionGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function TopicPermissionGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}



export function SettingsPermissionGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function ReportPermissionGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function AdminGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function ManagementGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
import type { ReactNode } from 'react';

export interface RecoverySuggestion {
  icon: ReactNode;
  title: string;
  description: string;
  impact: string;
  action?: string;
}

export interface RouteSegment {
  type: 'drive' | 'job';
  duration: number;
  label: string;
  stopId?: number;
  jobType?: string;
  color?: string;
}

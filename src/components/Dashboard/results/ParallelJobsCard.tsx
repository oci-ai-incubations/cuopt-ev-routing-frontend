import { Badge } from '@/components/shared/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { formatSolveTime } from '@/utils';

import type { ParallelJobResult } from '@/types';

interface ParallelJobsCardProps {
  parallelJobs: ParallelJobResult[];
}

export function ParallelJobsCard({ parallelJobs }: ParallelJobsCardProps) {
  if (parallelJobs.length === 0) return null;

  return (
    <Card variant="bordered">
      <CardHeader>
        <CardTitle>Parallel Jobs</CardTitle>
        <Badge variant="nvidia" pulse>
          {parallelJobs.filter((j) => j.status === 'running').length} running
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {parallelJobs.map((job) => (
            <div key={job.jobId} className="bg-dark-bg rounded-lg p-3 border border-dark-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">Cluster {job.clusterId}</span>
                <Badge
                  variant={({ completed: 'success', running: 'info', failed: 'error' } as Record<string, 'success' | 'info' | 'error' | 'default'>)[job.status] ?? 'default'}
                  pulse={job.status === 'running'}
                >
                  {job.status}
                </Badge>
              </div>
              <div className="text-xs text-gray-400">
                {job.stops} stops
                {job.solveTime && (
                  <span className="ml-2 text-[#C74634]">{formatSolveTime(job.solveTime * 1000)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

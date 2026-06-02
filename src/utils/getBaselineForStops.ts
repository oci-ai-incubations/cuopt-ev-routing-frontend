import { performanceBaselines } from '@/data';

export function getBaselineForStops(numStops: number): number {
  const sorted = [...performanceBaselines].sort((a, b) => a.stopCount - b.stopCount);

  if (numStops <= sorted[0].stopCount) return sorted[0].solveTimeSeconds;
  if (numStops >= sorted[sorted.length - 1].stopCount)
    return sorted[sorted.length - 1].solveTimeSeconds;

  for (let i = 0; i < sorted.length - 1; i++) {
    if (numStops >= sorted[i].stopCount && numStops <= sorted[i + 1].stopCount) {
      const ratio =
        (numStops - sorted[i].stopCount) / (sorted[i + 1].stopCount - sorted[i].stopCount);

      return (
        sorted[i].solveTimeSeconds +
        ratio * (sorted[i + 1].solveTimeSeconds - sorted[i].solveTimeSeconds)
      );
    }
  }

  return sorted[0].solveTimeSeconds;
}

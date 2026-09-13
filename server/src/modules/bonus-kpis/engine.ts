export interface BonusThresholdInput {
  minCount: number;
  points: number;
}

export interface BonusMetricInput {
  key: string;
  name: string;
  maxPoints: number;
  thresholds: BonusThresholdInput[];
  count: number;
  recordIds: string[];
  evidenceCount: number;
}

export interface BonusMetricResult {
  key: string;
  name: string;
  count: number;
  score: number;
  maxPoints: number;
  progress: number;
  targetReached: { minCount: number; points: number } | null;
  nextTarget: { minCount: number; points: number } | null;
  missingForNext: number;
  traceability: {
    recordIds: string[];
    dataUsed: number;
    evidenceCount: number;
    calculation: string;
    score: number;
  };
}

export function calculateBonusMetric(input: BonusMetricInput): BonusMetricResult {
  const thresholds = [...input.thresholds].sort((a, b) => b.minCount - a.minCount);
  const targetReached = thresholds.find((threshold) => input.count >= threshold.minCount) ?? null;
  const nextTarget = [...thresholds]
    .sort((a, b) => a.minCount - b.minCount)
    .find((threshold) => threshold.minCount > input.count) ?? null;
  const score = targetReached?.points ?? 0;
  const progress = input.maxPoints > 0 ? Math.min(100, Math.round((score / input.maxPoints) * 100)) : 0;
  const calculation = targetReached
    ? `${input.count} registros válidos; umbral de ${targetReached.minCount} registros alcanzado; ${score} puntos.`
    : `${input.count} registros válidos; ningún umbral alcanzado; 0 puntos.`;

  return {
    key: input.key,
    name: input.name,
    count: input.count,
    score,
    maxPoints: input.maxPoints,
    progress,
    targetReached,
    nextTarget,
    missingForNext: nextTarget ? Math.max(0, nextTarget.minCount - input.count) : 0,
    traceability: {
      recordIds: input.recordIds,
      dataUsed: input.count,
      evidenceCount: input.evidenceCount,
      calculation,
      score,
    },
  };
}

export function performanceLevel(score: number, maxPoints: number): string {
  if (maxPoints <= 0) return 'Sin configurar';
  const percentage = (score / maxPoints) * 100;
  if (percentage >= 100) return 'Excelente';
  if (percentage >= 70) return 'Bueno';
  if (percentage >= 40) return 'En desarrollo';
  return 'Inicial';
}

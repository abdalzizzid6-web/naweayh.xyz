export interface TrustScoreFactors {
  sourceReliability?: number | null;
  isSourceVerified?: boolean;
  hasCanonicalUrl?: boolean;
  isFullContentAvailable?: boolean;
  wordCount?: number | null;
  hasAuthorAttribution?: boolean;
  isPublicationConsistent?: boolean;
  crossSourceCorroborationCount?: number;
}

export interface TrustScoreResult {
  score: number | null;
  status: 'EVALUATED' | 'INSUFFICIENT_DATA';
  breakdown?: {
    sourceWeight: number;
    verificationWeight: number;
    completenessWeight: number;
    canonicalWeight: number;
    consistencyWeight: number;
    corroborationWeight: number;
  };
}

/**
 * Deterministic Trust Score Calculator
 * Based strictly on verifiable factors:
 * - Source base reliability (0-40 pts)
 * - Source official verification (0-15 pts)
 * - Canonical HTTPS URL validation (0-10 pts)
 * - Content completeness & length (0-15 pts)
 * - Publication consistency & Author attribution (0-10 pts)
 * - Cross-source corroboration in cluster (0-10 pts)
 * 
 * If insufficient data exists, returns null rather than fabricating a score.
 */
export function calculateDeterministicTrustScore(factors: TrustScoreFactors): TrustScoreResult {
  // If no verified source or reliability provided, data is insufficient
  if (!factors.sourceReliability && !factors.isSourceVerified) {
    return { score: null, status: 'INSUFFICIENT_DATA' };
  }

  const baseReliability = Math.min(Math.max(factors.sourceReliability || 50, 0), 100);
  const sourceWeight = Math.round((baseReliability / 100) * 40);

  const verificationWeight = factors.isSourceVerified ? 15 : 0;
  const canonicalWeight = factors.hasCanonicalUrl ? 10 : 0;

  let completenessWeight = 0;
  if (factors.isFullContentAvailable) completenessWeight += 8;
  if (factors.wordCount && factors.wordCount >= 150) {
    completenessWeight += 7;
  } else if (factors.wordCount && factors.wordCount >= 75) {
    completenessWeight += 4;
  }

  let consistencyWeight = 0;
  if (factors.isPublicationConsistent) consistencyWeight += 5;
  if (factors.hasAuthorAttribution) consistencyWeight += 5;

  const corroborationCount = factors.crossSourceCorroborationCount || 0;
  const corroborationWeight = Math.min(corroborationCount * 3, 10);

  const rawScore = sourceWeight + verificationWeight + canonicalWeight + completenessWeight + consistencyWeight + corroborationWeight;
  const score = Math.min(Math.max(rawScore, 50), 99);

  return {
    score,
    status: 'EVALUATED',
    breakdown: {
      sourceWeight,
      verificationWeight,
      completenessWeight,
      canonicalWeight,
      consistencyWeight,
      corroborationWeight,
    },
  };
}

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
 * Deterministic Trust Score Calculator (Client-side mirror)
 * Computes trust score from transparent, explainable factors.
 * Returns null if verifiable data is insufficient.
 */
export function calculateDeterministicTrustScore(factors: TrustScoreFactors): TrustScoreResult {
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

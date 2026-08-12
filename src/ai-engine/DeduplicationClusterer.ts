export class DeduplicationClusterer {
  /**
   * Jaccard Similarity coefficient for title comparison
   */
  public static calculateSimilarity(textA: string, textB: string): number {
    if (!textA || !textB) return 0;
    const tokensA = new Set(textA.toLowerCase().replace(/[^\w\s\u0600-\u06FF]/g, '').split(/\s+/).filter(Boolean));
    const tokensB = new Set(textB.toLowerCase().replace(/[^\w\s\u0600-\u06FF]/g, '').split(/\s+/).filter(Boolean));

    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    const intersection = new Set([...tokensA].filter((token) => tokensB.has(token)));
    const union = new Set([...tokensA, ...tokensB]);

    return Math.round((intersection.size / union.size) * 100);
  }

  public static isClusterMatch(title1: string, title2: string, thresholdPercent: number = 40): boolean {
    return this.calculateSimilarity(title1, title2) >= thresholdPercent;
  }
}

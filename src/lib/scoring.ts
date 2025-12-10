/**
 * YouTube Video Scoring System v2
 * 
 * BALANCED scoring that doesn't favor new videos unfairly:
 * - Engagement quality is the primary driver (scale-independent)
 * - Total reach matters (logarithmic scaling)
 * - Time decay is gentle and optional
 * - Viral potential considers sustainability
 * 
 * @author Statistics Expert Refactor v2
 */

export interface VideoMetrics {
  views: number;
  likes: number;
  comments: number;
  days: number;
}

export interface ScoringResult {
  /** Final composite score (0-100 scale) */
  score: number;
  /** Individual component scores */
  components: {
    /** Engagement rate quality (likes + comments per view) */
    engagementScore: number;
    /** Total reach/success (log-scaled views) */
    reachScore: number;
    /** Consistency: engagement sustained over time */
    consistencyScore: number;
    /** Community depth: comment-to-like ratio */
    communityScore: number;
  };
  /** Raw calculated rates */
  rates: {
    /** Likes per 1000 views */
    likeRate: number;
    /** Comments per 1000 views */
    commentRate: number;
    /** Total engagement per 1000 views */
    engagementRate: number;
    /** Average views per day */
    viewsPerDay: number;
  };
}

/**
 * Scoring Configuration v2
 * VIEWS-FIRST: Total views is the most important factor
 */
const CONFIG = {
  // Engagement weights (comments require more effort = more valuable)
  COMMENT_WEIGHT: 5,
  LIKE_WEIGHT: 1,
  
  // Component weights for final score (must sum to 1)
  // VIEWS (reach) is the PRIMARY factor
  WEIGHTS: {
    reach: 0.50,         // PRIMARY: Total views achieved (log-scaled)
    engagement: 0.25,    // How well the video engages viewers (rate-based)
    consistency: 0.15,   // Sustained engagement over time
    community: 0.10,     // Depth of audience interaction (comments vs likes)
  },
  
  // Benchmark rates (typical YouTube averages)
  BENCHMARKS: {
    likeRatePct: 4,           // 4% like rate is good
    commentRatePct: 0.5,      // 0.5% comment rate is good  
    goodViews: 100000,        // Reference point for "good" views
    excellentViews: 1000000,  // Reference for "excellent" views
  },
};

/**
 * Sigmoid normalization to map any value to 0-100 scale
 * Provides smooth, bounded scaling that handles outliers well
 */
function sigmoidNormalize(value: number, midpoint: number, steepness: number = 1): number {
  return 100 / (1 + Math.exp(-steepness * (value - midpoint) / midpoint));
}

/**
 * Calculate engagement rate per 1000 views (per mille)
 */
function calculateEngagementRate(metrics: VideoMetrics): number {
  if (metrics.views === 0) return 0;
  
  const weightedEngagement = 
    metrics.likes * CONFIG.LIKE_WEIGHT + 
    metrics.comments * CONFIG.COMMENT_WEIGHT;
  
  return (weightedEngagement / metrics.views) * 1000;
}

/**
 * Calculate like rate per 1000 views
 */
function calculateLikeRate(metrics: VideoMetrics): number {
  if (metrics.views === 0) return 0;
  return (metrics.likes / metrics.views) * 1000;
}

/**
 * Calculate comment rate per 1000 views
 */
function calculateCommentRate(metrics: VideoMetrics): number {
  if (metrics.views === 0) return 0;
  return (metrics.comments / metrics.views) * 1000;
}

/**
 * Calculate views per day
 */
function calculateViewsPerDay(metrics: VideoMetrics): number {
  if (metrics.days === 0) return metrics.views;
  return metrics.views / metrics.days;
}

/**
 * ENGAGEMENT SCORE (0-100)
 * Measures how well the video engages its viewers relative to view count
 * THIS IS AGE-INDEPENDENT - older and newer videos compete fairly
 */
function calculateEngagementScore(metrics: VideoMetrics): number {
  const engagementRate = calculateEngagementRate(metrics);
  // midpoint at ~40‰ (which equals ~4% like rate + weighted comments)
  return sigmoidNormalize(engagementRate, 40, 0.6);
}

/**
 * REACH SCORE (0-100) - PRIMARY FACTOR
 * Measures total success/visibility achieved
 * Uses logarithmic scale for fair comparison across different scales
 * 
 * Scale:
 *   1K views   → ~20
 *   10K views  → ~40
 *   100K views → ~60
 *   1M views   → ~80
 *   10M views  → ~100
 */
function calculateReachScore(metrics: VideoMetrics): number {
  if (metrics.views === 0) return 0;
  
  // Log-scaled views with better distribution
  // log10(1K) = 3, log10(10M) = 7, range of 4
  // Normalize to 0-100 scale
  const logViews = Math.log10(metrics.views + 1);
  
  // Map log scale: 3 (1K) → 20, 7 (10M) → 100
  const score = (logViews - 2) * 20;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * CONSISTENCY SCORE (0-100)
 * Measures if engagement is sustained over time
 * A video that maintains good engagement as it ages scores higher
 * 
 * Formula: engagement_rate × age_factor
 * - New videos (< 7 days): neutral factor (1.0)
 * - Medium age (7-90 days): slight bonus for sustained engagement
 * - Old videos (90+ days): bonus if still engaging well
 */
function calculateConsistencyScore(metrics: VideoMetrics): number {
  const engagementRate = calculateEngagementRate(metrics);
  
  // Age factor: rewards sustained engagement
  let ageFactor: number;
  if (metrics.days <= 7) {
    // New videos: no bonus or penalty
    ageFactor = 1.0;
  } else if (metrics.days <= 90) {
    // Medium age: slight bonus (up to 1.2x)
    ageFactor = 1 + (metrics.days - 7) / 83 * 0.2;
  } else {
    // Old videos: full bonus if still engaging (up to 1.5x)
    ageFactor = 1.2 + Math.min((metrics.days - 90) / 275, 0.3);
  }
  
  const consistencyIndex = engagementRate * ageFactor;
  
  return sigmoidNormalize(consistencyIndex, 50, 0.5);
}

/**
 * COMMUNITY SCORE (0-100)
 * Measures depth of audience interaction
 * High comment-to-like ratio indicates engaged community discussion
 */
function calculateCommunityScore(metrics: VideoMetrics): number {
  if (metrics.likes === 0 && metrics.comments === 0) return 0;
  
  // Comment-to-engagement ratio
  const totalEngagement = metrics.likes + metrics.comments;
  const commentRatio = metrics.comments / totalEngagement;
  
  // Also consider absolute comment rate
  const commentRate = calculateCommentRate(metrics);
  
  // Combined: 60% ratio, 40% absolute rate
  const communityIndex = commentRatio * 100 * 0.6 + commentRate * 8 * 0.4;
  
  return sigmoidNormalize(communityIndex, 15, 0.6);
}

/**
 * MAIN SCORING FUNCTION
 * Calculates comprehensive video performance score
 * BALANCED: doesn't favor new or old videos unfairly
 */
export function calculateVideoScore(metrics: VideoMetrics): ScoringResult {
  // Calculate component scores
  const engagementScore = calculateEngagementScore(metrics);
  const reachScore = calculateReachScore(metrics);
  const consistencyScore = calculateConsistencyScore(metrics);
  const communityScore = calculateCommunityScore(metrics);
  
  // Weighted composite score
  const score = 
    engagementScore * CONFIG.WEIGHTS.engagement +
    reachScore * CONFIG.WEIGHTS.reach +
    consistencyScore * CONFIG.WEIGHTS.consistency +
    communityScore * CONFIG.WEIGHTS.community;
  
  return {
    score: Math.round(score * 10) / 10,
    components: {
      engagementScore: Math.round(engagementScore * 10) / 10,
      reachScore: Math.round(reachScore * 10) / 10,
      consistencyScore: Math.round(consistencyScore * 10) / 10,
      communityScore: Math.round(communityScore * 10) / 10,
    },
    rates: {
      likeRate: Math.round(calculateLikeRate(metrics) * 10) / 10,
      commentRate: Math.round(calculateCommentRate(metrics) * 100) / 100,
      engagementRate: Math.round(calculateEngagementRate(metrics) * 10) / 10,
      viewsPerDay: Math.round(calculateViewsPerDay(metrics)),
    },
  };
}

/**
 * Get score interpretation/label
 */
export function getScoreLabel(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 70) {
    return {
      label: "Excellent",
      color: "text-emerald-500",
      description: "Exceptional performance - high engagement and reach",
    };
  }
  if (score >= 55) {
    return {
      label: "Very Good",
      color: "text-green-500",
      description: "Above average - good audience engagement",
    };
  }
  if (score >= 40) {
    return {
      label: "Good",
      color: "text-yellow-500",
      description: "Adequate performance - within expectations",
    };
  }
  if (score >= 25) {
    return {
      label: "Fair",
      color: "text-orange-500",
      description: "Below average - engagement could improve",
    };
  }
  return {
    label: "Low",
    color: "text-red-500",
    description: "Needs attention - low engagement",
  };
}

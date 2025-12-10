/**
 * Input validation utilities for API routes
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

// Characters allowed in search queries and channel names
const ALLOWED_SEARCH_REGEX = /^[a-zA-Z0-9\s\-'.:,&!?()@_]+$/;

// YouTube channel IDs are 24 characters, alphanumeric with - and _
const CHANNEL_ID_REGEX = /^UC[a-zA-Z0-9_-]{22}$/;

const MAX_QUERY_LENGTH = 200;

/**
 * Validate and sanitize a channel search query
 */
export function validateSearchQuery(
  query: string | null | undefined
): ValidationResult {
  if (!query || typeof query !== "string") {
    return { valid: false, error: "Search query is required" };
  }

  const trimmed = query.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: "Search query cannot be empty" };
  }

  if (trimmed.length > MAX_QUERY_LENGTH) {
    return {
      valid: false,
      error: `Query too long (max ${MAX_QUERY_LENGTH} characters)`,
    };
  }

  if (!ALLOWED_SEARCH_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "Query contains invalid characters",
    };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validate a YouTube channel ID
 */
export function validateChannelId(
  channelId: string | null | undefined
): ValidationResult {
  if (!channelId || typeof channelId !== "string") {
    return { valid: false, error: "Channel ID is required" };
  }

  const trimmed = channelId.trim();

  if (!CHANNEL_ID_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "Invalid YouTube channel ID format",
    };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Create a safe error message for production
 */
export function getSafeErrorMessage(error: unknown, fallback: string): string {
  if (process.env.NODE_ENV === "development") {
    return error instanceof Error ? error.message : fallback;
  }

  if (error instanceof Error) {
    const safeMessages = [
      "Channel not found",
      "Could not find uploads playlist",
      "Invalid channel ID",
      "Request limit reached",
      "No videos found",
    ];

    if (safeMessages.some((msg) => error.message.includes(msg))) {
      return error.message;
    }
  }

  return fallback;
}


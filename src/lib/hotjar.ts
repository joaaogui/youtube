// Hotjar utility functions for user identification and events
import Hotjar from "@hotjar/browser";

type HotjarUserInfo = Record<string | number, string | number | Date | boolean>;

/**
 * Identifies a user in Hotjar with their profile information
 */
export const identifyHotjarUser = (
  userId: string,
  userAttributes?: HotjarUserInfo
) => {
  try {
    Hotjar.identify(userId, userAttributes ?? {});
  } catch (error) {
    console.warn("[Hotjar] Failed to identify user:", error);
  }
};

/**
 * Triggers a custom event in Hotjar
 */
export const triggerHotjarEvent = (eventName: string) => {
  try {
    Hotjar.event(eventName);
  } catch (error) {
    console.warn("[Hotjar] Failed to trigger event:", error);
  }
};

/**
 * Triggers a state change in Hotjar (for SPA navigation tracking)
 */
export const triggerHotjarStateChange = (relativePath: string) => {
  try {
    Hotjar.stateChange(relativePath);
  } catch (error) {
    console.warn("[Hotjar] Failed to trigger state change:", error);
  }
};

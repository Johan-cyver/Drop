/**
 * Haptic Feedback Utility
 * Uses the Web Vibration API to provide tactile feedback for social interactions.
 */

export const Haptics = {
    /**
     * Light tap for simple interactions (voting, clicking buttons)
     */
    light: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    },

    /**
     * Medium impact for success actions (coins earned, successful posting)
     */
    success: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([15, 30, 20]);
        }
    },

    /**
     * Warning or error haptic pattern
     */
    error: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([10, 50, 10, 50]);
        }
    },

    /**
     * Heavy "thud" for the Drop action
     */
    heavy: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50);
        }
    },

    /**
     * Subtle "tick" for scrolling or selection changes
     */
    selection: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(5);
        }
    }
};

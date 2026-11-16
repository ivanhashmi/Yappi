/**
 * Light native haptic feedback helper for mobile touch interactions
 * Safe no-op on desktop, iOS Safari without vibration support, or when disabled
 */
export function triggerHaptic(type = "light") {
  if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.vibrate) {
    return;
  }
  try {
    switch (type) {
      case "selection":
      case "light":
        navigator.vibrate(8);
        break;
      case "medium":
        navigator.vibrate(14);
        break;
      case "success":
        navigator.vibrate([8, 25, 12]);
        break;
      case "error":
        navigator.vibrate([15, 30, 15]);
        break;
      default:
        navigator.vibrate(8);
    }
  } catch {
    // Graceful no-op if blocked by browser autoplay/vibration policy
  }
}

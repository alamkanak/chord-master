import { useEffect, useRef, useState } from "react";

/**
 * Custom hook to manage Screen Wake Lock API
 * Prevents screen from dimming or locking during active sessions
 * 
 * Supported on:
 * - iOS Safari 16.4+ (when installed as PWA)
 * - Chrome/Edge on Android
 * - Desktop browsers
 */
export function useWakeLock() {
  // Check if Wake Lock API is supported
  const [isSupported] = useState(() => "wakeLock" in navigator);
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = async () => {
    if (!("wakeLock" in navigator)) {
      console.log("Wake Lock API not supported");
      return false;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      setIsActive(true);
      
      console.log("Wake Lock activated - screen will stay awake");

      // Handle wake lock release (e.g., when tab becomes inactive)
      wakeLockRef.current.addEventListener("release", () => {
        console.log("Wake Lock released");
        setIsActive(false);
      });

      return true;
    } catch (err) {
      console.error("Failed to activate Wake Lock:", err);
      setIsActive(false);
      return false;
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsActive(false);
        console.log("Wake Lock manually released");
      } catch (err) {
        console.error("Failed to release Wake Lock:", err);
      }
    }
  };

  // Re-request wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (wakeLockRef.current !== null && document.visibilityState === "visible") {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  return {
    isSupported,
    isActive,
    requestWakeLock,
    releaseWakeLock,
  };
}

import { useState, useRef, useEffect } from "react";

export function usePullToRefresh(onRefresh, containerRef) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(null);
  const pullDistanceRef = useRef(0);
  const THRESHOLD = 70;

  useEffect(() => {
    const el = containerRef?.current || window;

    const onTouchStart = (e) => {
      const scrollTop = containerRef?.current
        ? containerRef.current.scrollTop
        : window.scrollY;
      if (scrollTop === 0) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (startYRef.current === null) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta > 0) {
        const distance = Math.min(delta, THRESHOLD * 1.5);
        pullDistanceRef.current = distance;
        setPullDistance(distance);
        setIsPulling(true);
      }
    };

    const onTouchEnd = async () => {
      if (pullDistanceRef.current >= THRESHOLD) {
        await onRefresh();
      }
      pullDistanceRef.current = 0;
      setPullDistance(0);
      setIsPulling(false);
      startYRef.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, containerRef]);

  return { isPulling, pullDistance, threshold: THRESHOLD };
}
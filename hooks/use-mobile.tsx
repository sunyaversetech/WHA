import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // ✅ Lazy initializer for initial value — no effect setState needed
  const [isMobile, setIsMobile] = React.useState(
    () =>
      typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    function onChange(event: MediaQueryListEvent) {
      setIsMobile(event.matches); // ✅ only inside callback
    }

    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

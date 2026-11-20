"use client";

import { usePathname } from "next/navigation";
import { useSearchMapVisibility } from "@/components/Business/search-map-visibility";
import { cn } from "@/lib/utils";

export default function Footer() {
  const pathname = usePathname();
  const isMapVisible = useSearchMapVisibility((s) => s.isMapVisible);

  // Dashboard/auth/super-admin have their own fixed-height app shells —
  // a trailing footer there would sit under the fold or break the layout.
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/super-admin")
  )
    return null;

  // On the search page (/ and /search), the desktop (>=1024px) map panel
  // is position:fixed to the viewport — once the footer scrolls into
  // view, a full-width footer would sit partly underneath it. Shrinking
  // the footer to the results-column width while the map's visible keeps
  // it clear instead. Only applies at the lg breakpoint: mobile's map is
  // a full-screen overlay triggered separately, not a persistent fixed
  // sidebar, so it has no equivalent overlap to avoid, and 60vw on a
  // phone-width viewport would wrongly shrink the footer there too.
  // Hiding the map (or being on any other page) goes back to full width.
  const isSearchPage = pathname === "/" || pathname === "/search";
  const constrained = isSearchPage && isMapVisible;

  return (
    <footer
      className={cn(
        "border-t border-border py-6 text-center text-xs text-muted-foreground",
        constrained && "lg:w-[min(60vw,855px)]",
      )}>
      <p>
        &copy; {new Date().getFullYear()}{" "}
        <a
          href="https://sunyaverse.com.au"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:text-foreground hover:underline"
        >
          Sunyaverse
        </a>
        . All rights reserved.
      </p>
    </footer>
  );
}

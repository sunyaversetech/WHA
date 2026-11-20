"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, Calendar, User } from "lucide-react";
import { useSession } from "next-auth/react";

// "/" now renders the same content as "/search" (it's the home page), so a
// separate "Home" tab here would just duplicate the "Search" tab.
const NAV_LINKS = (isLoggedIn: boolean) => [
  { name: "Search",   path: "/search",                                     icon: Search   },
  { name: "Activity", path: isLoggedIn ? "/activity" : "/auth",            icon: Calendar },
  { name: "Profile",  path: isLoggedIn ? "/dashboard" : "/auth",           icon: User     },
];

type NavLink = { name: string; path: string; icon: typeof Search };

// The actual nav markup, parameterized on buildPath so it can be rendered
// either with the real, search-param-aware version (CityAwareLinks below)
// or, as a Suspense fallback, with plain undecorated hrefs — never with
// nothing. buildPath only ever adds an optional ?city= for an
// already-browsing visitor; it's not something a crawler needs, so the
// plain-href fallback is a fully functional, fully crawlable nav on its
// own, not a placeholder.
function BottomNavLinks({
  links,
  isActive,
  buildPath,
}: {
  links: NavLink[];
  isActive: (path: string) => boolean;
  buildPath: (href: string) => string;
}) {
  return (
    <div className="flex items-stretch">
      {links.map(({ name, path, icon: Icon }) => {
        const active = isActive(path);
        return (
          <Link
            key={name}
            href={buildPath(path)}
            aria-label={name}
            aria-current={active ? "page" : undefined}
            className="relative flex-1 flex flex-col items-center justify-center py-2 gap-0.5
                       min-h-[56px] touch-manipulation
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary"
          >
            <Icon
              size={20}
              strokeWidth={active ? 2.5 : 1.8}
              className={`transition-colors duration-150 ${
                active ? "text-secondary" : "text-muted-foreground"
              }`}
            />
            <span
              className={`text-[9px] font-bold tracking-tight transition-colors duration-150 ${
                active ? "text-secondary" : "text-muted-foreground"
              }`}
            >
              {name}
            </span>
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-secondary rounded-full" />
            )}
          </Link>
        );
      })}
    </div>
  );
}

function CityAwareLinks({
  links,
  isActive,
}: {
  links: NavLink[];
  isActive: (path: string) => boolean;
}) {
  const searchParams = useSearchParams();
  const currentCity = searchParams.get("city");
  const buildPath = (href: string) =>
    currentCity ? `${href}?city=${currentCity}` : href;
  return <BottomNavLinks links={links} isActive={isActive} buildPath={buildPath} />;
}

export default function BottomNav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // "/" renders the same content as "/search" (it's the home page now), so
  // the Search tab should read as active on either URL.
  const isActive = (path: string) =>
    path === "/search"
      ? pathname === "/" || pathname.startsWith("/search")
      : pathname.startsWith(path);

  const links = NAV_LINKS(!!session);

  if (pathname.startsWith("/auth")) return null;
  // Business accounts already have an always-visible icon-rail nav on
  // /dashboard routes; a second, customer-oriented bottom bar would
  // overlap it and confuse the business-specific nav.
  if (pathname.startsWith("/dashboard") && session?.user?.category === "business")
    return null;

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50
                 bg-white/90 backdrop-blur-xl
                 border-t border-border
                 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
    >
      <Suspense fallback={<BottomNavLinks links={links} isActive={isActive} buildPath={(href) => href} />}>
        <CityAwareLinks links={links} isActive={isActive} />
      </Suspense>
    </nav>
  );
}

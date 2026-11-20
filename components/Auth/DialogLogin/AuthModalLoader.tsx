"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useAuthModal } from "./use-auth-model";

// AuthModal pulls in react-hook-form + zod + the dialog/drawer primitives —
// a real chunk of JS that was previously in every page's initial bundle via
// a static import in app/layout.tsx, even though it's only ever visible
// after someone explicitly opens it. Mounting (and therefore fetching) it
// only once isOpen actually flips true means that cost is paid on first
// use, not on every page load.
const AuthModal = dynamic(
  () => import("./AuthModel").then((mod) => mod.AuthModal),
  { ssr: false },
);

export default function AuthModalLoader() {
  const { isOpen } = useAuthModal();
  // Stay mounted once opened, even after closing — so a close still gets
  // the Dialog/Drawer's own exit animation instead of the component
  // vanishing mid-transition. Only the time-to-first-open is deferred.
  const [hasOpened, setHasOpened] = useState(false);
  useEffect(() => {
    // Latching "has this ever been true" has no pure-render equivalent
    // (ref mutation during render is also disallowed by this project's
    // rules); this only ever flips once, from false to true.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

  if (!hasOpened) return null;
  return <AuthModal />;
}

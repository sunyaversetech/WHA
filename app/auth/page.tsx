import { Suspense } from "react";
import AuthChoicePage from "@/components/Auth/AuthChoicePage";
import { buildMetadata, SITE_NAME } from "@/lib/seo";

export const metadata = buildMetadata({
  title: `Sign In or Sign Up | ${SITE_NAME}`,
  description: "Sign in or create an account on What's Happening Australia.",
  path: "/auth",
});

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthChoicePage />
    </Suspense>
  );
}

import { Suspense } from "react";
import AuthShell from "@/components/Auth/AuthShell";
import LoginPage from "@/components/Auth/LoginPage";
import { buildMetadata, SITE_NAME } from "@/lib/seo";

export const metadata = buildMetadata({
  title: `Business Login | ${SITE_NAME}`,
  description: "Log in to manage your bookings, services and team on What's Happening Australia.",
  path: "/auth/business/login",
});

export default function BusinessLoginPage() {
  return (
    <AuthShell
      heading="WHA for Business"
      subheading="Log in to manage your bookings, services and team."
      backHref="/auth">
      <Suspense fallback={null}>
        <LoginPage
          loginType="business"
          showGoogle={false}
          signupHref="/auth/business/signup"
        />
      </Suspense>
    </AuthShell>
  );
}

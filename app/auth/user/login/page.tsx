import { Suspense } from "react";
import AuthShell from "@/components/Auth/AuthShell";
import LoginPage from "@/components/Auth/LoginPage";
import { buildMetadata, SITE_NAME } from "@/lib/seo";

export const metadata = buildMetadata({
  title: `Customer Login | ${SITE_NAME}`,
  description: "Log in to book and manage your appointments on What's Happening Australia.",
  path: "/auth/user/login",
});

export default function UserLoginPage() {
  return (
    <AuthShell
      heading="WHA for Customers"
      subheading="Log in to book and manage your appointments."
      backHref="/auth">
      <Suspense fallback={null}>
        <LoginPage
          loginType="user"
          showGoogle={true}
          signupHref="/auth/user/signup"
        />
      </Suspense>
    </AuthShell>
  );
}

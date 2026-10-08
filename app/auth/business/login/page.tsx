import AuthShell from "@/components/Auth/AuthShell";
import LoginPage from "@/components/Auth/LoginPage";

export const metadata = {
  title: "Business Login",
  description: "Log in to manage your bookings, services and team on What's Happening Australia.",
  alternates: { canonical: "/auth/business/login" },
};

export default function BusinessLoginPage() {
  return (
    <AuthShell
      heading="WHA for Business"
      subheading="Log in to manage your bookings, services and team."
      backHref="/auth">
      <LoginPage
        loginType="business"
        showGoogle={false}
        signupHref="/auth/business/signup"
      />
    </AuthShell>
  );
}

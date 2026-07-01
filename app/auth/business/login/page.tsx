import AuthShell from "@/components/Auth/AuthShell";
import LoginPage from "@/components/Auth/LoginPage";

export default function BusinessLoginPage() {
  return (
    <AuthShell
      heading="WHA for Business"
      subheading="Log in to manage your bookings, services and team."
      backHref="/auth">
      <LoginPage showGoogle={false} signupHref="/auth/business/signup" />
    </AuthShell>
  );
}

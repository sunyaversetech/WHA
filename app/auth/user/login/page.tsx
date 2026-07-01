import AuthShell from "@/components/Auth/AuthShell";
import LoginPage from "@/components/Auth/LoginPage";
import Image from "next/image";

export default function UserLoginPage() {
  return (
    <AuthShell
      heading="WHA for Customers"
      subheading="Log in to book and manage your appointments."
      backHref="/auth">
      <LoginPage showGoogle={true} signupHref="/auth/user/signup" />
    </AuthShell>
  );
}

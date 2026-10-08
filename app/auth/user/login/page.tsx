import AuthShell from "@/components/Auth/AuthShell";
import LoginPage from "@/components/Auth/LoginPage";

export const metadata = {
  title: "Customer Login",
  description: "Log in to book and manage your appointments on What's Happening Australia.",
  alternates: { canonical: "/auth/user/login" },
};

export default function UserLoginPage() {
  return (
    <AuthShell
      heading="WHA for Customers"
      subheading="Log in to book and manage your appointments."
      backHref="/auth">
      <LoginPage
        loginType="user"
        showGoogle={true}
        signupHref="/auth/user/signup"
      />
    </AuthShell>
  );
}

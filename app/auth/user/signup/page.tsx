import SignupPage from "@/components/Auth/Signup";
import { buildMetadata, SITE_NAME } from "@/lib/seo";

export const metadata = buildMetadata({
  title: `Sign Up | ${SITE_NAME}`,
  description: "Create a free account to book appointments, claim deals and save events on What's Happening Australia.",
  path: "/auth/user/signup",
});

export default SignupPage;

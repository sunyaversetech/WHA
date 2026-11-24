import BusinessSignupPage from "@/components/Auth/BusinessSignupPage";
import { buildMetadata, SITE_NAME } from "@/lib/seo";

export const metadata = buildMetadata({
  title: `List Your Business | ${SITE_NAME}`,
  description: "Create a free business account to list your services, events and deals on What's Happening Australia.",
  path: "/auth/business/signup",
});

export default BusinessSignupPage;

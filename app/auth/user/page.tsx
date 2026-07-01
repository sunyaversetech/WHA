import { redirect } from "next/navigation";

export default function UserAuthPage() {
  redirect("/auth/user/login");
}

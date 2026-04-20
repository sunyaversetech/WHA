"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import LoginPage from "./LoginPage";
import SignupPage from "./Signup";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import AuthSelectionPage from "./AuthSelectionPage";

export default function AuthPage() {
  const params = useSearchParams();
  const router = useRouter();

  const currentTab = params.get("tab") === "signup" ? "signup" : "login";

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(params.toString());
    newParams.set("tab", value);
    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  return (
    <div className="flex w-full h-[90vh]  ">
      <div className="flex w-full md:w-1/2 items-center justify-center md: p-4 md:p-6 ">
        <Card className="w-full  max-w-md border-none shadow-none! bg-transparent flex flex-col">
          <CardHeader className="text-center pb-4  border-none!">
            <CardTitle className="text-2xl font-bold text-start md:text-center">
              Log in or sign up
            </CardTitle>
            <CardDescription className="text-start md:text-center">
              Create an account or log back in
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1">
            <Tabs
              value={currentTab}
              onValueChange={handleTabChange}
              className="flex flex-col">
              <TabsList className="grid w-full grid-cols-2 rounded-full border-none! mb-4">
                <TabsTrigger
                  value="login"
                  className="shadow-none! rounded-none! border-2 data-[state=active]:bg-white 
                  data-[state=active]:border-b-blue-950 data-[state=active]:text-black py-2">
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="shadow-none! rounded-none! border-2 data-[state=active]:bg-white 
                  data-[state=active]:border-b-blue-950 data-[state=active]:text-black py-2">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0 outline-none">
                <LoginPage />
              </TabsContent>

              <TabsContent value="signup" className="mt-0 w-full outline-none">
                <AuthSelectionPage />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:block md:fixed md:top-24 md:right-0 md:bottom-10 md:w-1/2 px-4">
        <div className="relative w-full h-full rounded-xl overflow-hidden">
          <Image
            src="/wha/wha-auth.png"
            alt="Australia community"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}

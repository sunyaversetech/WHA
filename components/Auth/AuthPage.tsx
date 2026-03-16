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
import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function AuthPage() {
  const params = useSearchParams();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* LEFT SIDE */}
      <div className="flex w-full md:w-1/2 items-start justify-center p-6">
        <Card className="w-full max-w-md shadow-lg border-none bg-white flex flex-col max-h-[90vh]">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-start md:text-center">
              Log in or sign up
            </CardTitle>
            <CardDescription className="text-start md:text-center">
              Create an account or log back in
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1">
            <Tabs
              defaultValue={params.get("tab") === "signup" ? "signup" : "login"}
              className="flex flex-col">
              <TabsList className="grid w-full grid-cols-2 rounded-full bg-gray-100 p-1 mb-4 h-11">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0">
                <LoginPage />
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <SignupPage />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT IMAGE */}
      <div className="relative hidden md:block md:w-1/2 h-full">
        <Image
          src="/wha/wha-auth.png"
          alt="Australia community"
          fill
          className="object-cover object-top"
          priority
        />
      </div>
    </div>
  );
}

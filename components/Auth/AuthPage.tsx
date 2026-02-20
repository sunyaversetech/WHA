"use client";

import { signIn } from "next-auth/react";
import { Chrome } from "lucide-react";
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

export default function AuthPage() {
  const params = useSearchParams();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-none bg-white">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
          <CardDescription>Join our community or sign back in</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs
            defaultValue={params.get("tab") === "signup" ? "signup" : "login"}
            className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-full bg-gray-100 p-1 mb-6 h-12">
              <TabsTrigger
                value="login"
                className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black text-gray-500 transition-all">
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black text-gray-500 transition-all">
                Sign Up
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-4">
              <LoginPage />
            </TabsContent>
            <TabsContent value="signup">
              <SignupPage />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

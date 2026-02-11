"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Briefcase } from "lucide-react";

export default function SelectCategoryPage() {
  const [loading, setLoading] = useState(false);
  const { update } = useSession();
  const router = useRouter();

  const handleSelect = async (category: "user" | "business") => {
    setLoading(true);
    const res = await fetch("/api/user/select-category", {
      method: "POST",
      body: JSON.stringify({ category }),
    });

    if (res.ok) {
      await update({ category });
      router.push("/complete-profile");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col justify-center p-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        How will you use WhatsHappeningAustralia?
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Option */}
        <Card
          className="cursor-pointer hover:border-primary transition-all shadow-md"
          onClick={() => !loading && handleSelect("user")}>
          <CardHeader className="flex items-center justify-center pt-8">
            <User size={64} className="text-blue-500" />
          </CardHeader>
          <CardContent className="text-center">
            <CardTitle className="text-xl mb-2">Individual User</CardTitle>
            <p className="text-sm text-gray-500">
              I want to discover events and services around me.
            </p>
          </CardContent>
        </Card>

        {/* Business Option */}
        <Card
          className="cursor-pointer hover:border-primary transition-all shadow-md"
          onClick={() => !loading && handleSelect("business")}>
          <CardHeader className="flex items-center justify-center pt-8">
            <Briefcase size={64} className="text-green-500" />
          </CardHeader>
          <CardContent className="text-center">
            <CardTitle className="text-xl mb-2">
              Business / Service Provider
            </CardTitle>
            <p className="text-sm text-gray-500">
              I want to list my services and manage bookings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { ChevronLeft, Home, Briefcase, Plus, Trash2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import ProfileAvatar from "../Dashboard/ProfilePic";
import { Button } from "../ui/button";
import { DeleteConfirmDialog } from "../ui/DynamicDeleteButton";
import { useDeleteProfile } from "@/services/Auth/auth.service";

const ProfilePage = ({ userData }: { userData: any }) => {
  const { data: session } = useSession();
  const { mutate: deleteAccount, isPending } = useDeleteProfile();
  const router = useRouter();

  const handleDelete = (id: string) => {
    deleteAccount(
      { id: id },
      {
        onSuccess: () => {
          signOut({ callbackUrl: "/" });
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to delete account",
          );
        },
      },
    );
  };

  // Helper for info rows
  const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <div className="py-3 border-b border-gray-50 last:border-0">
      <p className="text-xs font-semibold text-gray-900 mb-0.5">{label}</p>
      <p className="text-sm text-gray-500">{value || "-"}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full h-10 w-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Personal Info Card */}
          <div className="lg:col-span-7 xl:col-span-6">
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm relative">
              <button className="absolute top-6 right-8 text-[#7C3AED] font-semibold text-sm hover:opacity-70 transition-opacity">
                Edit
              </button>

              <div className="flex flex-col items-center text-center mb-8">
                <div className="relative mb-4">
                  <ProfileAvatar currentImage={session?.user?.image || ""} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {session?.user?.business_name || "User Name"}
                </h2>
              </div>

              <div className="space-y-1">
                <InfoRow label="Full name" />
                <InfoRow label="Email" />

                <InfoRow label="Mobile number" value={userData?.phone} />
              </div>
            </div>
          </div>

          {/* Right Column: Addresses & Security */}
          <div className="lg:col-span-5 xl:col-span-6 space-y-6">
            {/* Address Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                My addresses
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-4 group-hover:bg-white">
                    <Home className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">Home</p>
                    <p className="text-xs text-gray-400 font-medium">
                      Add a home address
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-4 group-hover:bg-white">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">Work</p>
                    <p className="text-xs text-gray-400 font-medium">
                      Add a work address
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="rounded-full px-5 py-2 h-auto text-sm font-bold border-gray-200 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>

            {/* Account Management Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Account Management
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Warning: Deleting your account is permanent.
              </p>

              <DeleteConfirmDialog
                onConfirm={() => handleDelete(session?.user.id ?? "")}
                text="This Account"
                isPending={isPending}
                header={
                  <div className="inline-flex items-center gap-2 px-4 py-2 border border-red-100 bg-red-50 text-red-600 rounded-full text-sm font-semibold cursor-pointer hover:bg-red-100 transition-colors">
                    <Trash2 className="w-4 h-4" />
                    Delete My Account
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

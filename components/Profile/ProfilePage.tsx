"use client";

import { ChevronLeft, Home, Trash2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import ProfileAvatar from "../Dashboard/ProfilePic";
import { Button } from "../ui/button";
import { DeleteConfirmDialog } from "../ui/DynamicDeleteButton";
import { useDeleteProfile, useEditProfile } from "@/services/Auth/auth.service";
import { useState } from "react";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProfileLocationFormField } from "./ProfileLocationFormField";
import { Form, FormField } from "../ui/form";
import { Input } from "../ui/input";

const editformschema = z.object({
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone_number: z.string().optional(),
});

type EditFormSchema = z.infer<typeof editformschema>;

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="py-3 border-b border-gray-50 last:border-0">
    <p className="text-xs font-semibold text-gray-900 mb-0.5">{label}</p>
    <p className="text-sm text-gray-500">{value || "-"}</p>
  </div>
);

const ProfilePage = () => {
  const { data: session, update } = useSession();
  const { mutate: deleteAccount, isPending } = useDeleteProfile();
  const { mutate: editProfile } = useEditProfile();
  const router = useRouter();
  const [editAddress, setEditAddress] = useState(false);
  const [editPhone, setEditPhone] = useState(false);

  const form = useForm<EditFormSchema>({
    resolver: zodResolver(editformschema),
    defaultValues: {
      location: session?.user?.location || "",
      phone_number: session?.user.phone_number || "",
    },
  });

  const onSubmit = (data: EditFormSchema) => {
    const filteredData = Object.entries(data).reduce(
      (acc: any, [key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {},
    );

    if (Object.keys(filteredData).length === 0) {
      toast.error("No changes detected");
      return;
    }

    editProfile(filteredData, {
      onSuccess: async () => {
        await update();
        toast.success("Profile updated");
        setEditPhone(false);
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to update profile");
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteAccount(
      { id },
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

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="min-h-screen bg-gray-50/50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full h-10 w-10">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 xl:col-span-6">
              <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm relative">
                <div className="flex flex-col items-center text-center mb-8">
                  <ProfileAvatar currentImage={session?.user?.image || ""} />
                  <h2 className="text-2xl font-bold text-gray-900">
                    {session?.user?.business_name || "User Name"}
                  </h2>
                </div>

                <div className="space-y-1">
                  <InfoRow
                    label="Full name"
                    value={session?.user?.name ?? ""}
                  />
                  <InfoRow label="Email" value={session?.user?.email ?? ""} />
                  <div className="py-3 border-b border-gray-50 last:border-0">
                    <p className="text-xs font-semibold text-gray-900 mb-0.5">
                      Mobile Number
                    </p>
                    {editPhone ? (
                      <div>
                        <FormField
                          control={form.control}
                          name="phone_number"
                          render={({ field }) => (
                            <Input
                              {...field}
                              placeholder={
                                session?.user?.phone_number ||
                                "Enter phone number"
                              }
                            />
                          )}
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            className="text-xs"
                            type="submit"
                            onClick={(e) => {
                              setEditPhone(false);
                              e.preventDefault();
                              e.stopPropagation();
                            }}>
                            Cancel
                          </Button>
                          <Button className="text-xs" type="submit">
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500">
                          {session?.user?.phone_number || "-"}
                        </p>
                        <Button
                          type="button"
                          className="mt-5 text-xs"
                          onClick={(e) => {
                            setEditPhone(true);
                            e.preventDefault();
                            e.stopPropagation();
                          }}>
                          Edit Number
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 xl:col-span-6 space-y-6">
              <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  My addresses
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div className="h-10 w-10 rounded-full  flex items-center justify-center mr-4">
                      <Home className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">Home</p>
                      <div className="text-xs flex flex-col  gap-2 text-gray-400 font-medium">
                        {editAddress ? (
                          <ProfileLocationFormField />
                        ) : (
                          <p className="text-clip-1 truncate w-70">
                            {session?.user?.location || "No address found"}
                          </p>
                        )}

                        {editAddress ? (
                          <div className="flex gap-2">
                            <Button
                              type="submit"
                              className="text-white h-10 justify-end mt-auto p-2 rounded-md font-semibold"
                              onClick={(e) => {
                                setEditAddress(false);
                                e.preventDefault();
                                e.stopPropagation();
                              }}>
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              className="text-white h-10 w-23 justify-end  p-2 rounded-md font-semibold">
                              Save Changes
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            onClick={(e) => {
                              setEditAddress(true);
                              e.preventDefault();
                              e.stopPropagation();
                            }}>
                            Edit Address
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
      </form>
    </Form>
  );
};

export default ProfilePage;

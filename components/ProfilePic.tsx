"use client";

import React, { useRef } from "react";
import { Edit3, Loader2 } from "lucide-react";
import Image from "next/image";
import { useCreateProfilePic } from "@/services/profile-pic.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ProfileAvatar({
  currentImage,
}: {
  currentImage?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate, isPending } = useCreateProfilePic();
  const router = useRouter();

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      mutate(formData, {
        onSuccess: () => {
          toast.success("Profile picture updated successfully!");
          router.refresh();
        },
        onError: (error) => {
          console.error("Failed to upload profile picture:", error);
          toast.error("Failed to upload profile picture. Please try again.");
        },
      });
    }
  };

  return (
    <div className="relative inline-block">
      <div className="h-20 w-20 rounded-full border-2 border-orange-500 overflow-hidden bg-slate-100 flex items-center justify-center relative">
        {isPending ? (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          </div>
        ) : null}

        {currentImage ? (
          <Image
            width={500}
            height={500}
            src={currentImage}
            alt="Avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-slate-400 text-xs text-center p-2">
            No Image
          </span>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".jpg, .jpeg, .png, .webp, image/jpeg, image/png, image/webp"
      />

      <div
        onClick={handleIconClick}
        className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-md border cursor-pointer hover:bg-slate-50 transition-all active:scale-90">
        <Edit3 className="h-3 w-3 text-slate-500" />
      </div>
    </div>
  );
}

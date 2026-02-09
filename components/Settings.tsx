"use client";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
      <p className="text-slate-500 mb-8">
        Manage your account preferences for {session?.user?.email}
      </p>

      <div className="space-y-6">
        <div className="p-4 border rounded-lg bg-slate-50">
          <h3 className="font-semibold">Email Notifications</h3>
          <p className="text-sm text-slate-500">
            Receive updates about new events in Australia.
          </p>
        </div>
        <div className="p-4 border rounded-lg bg-slate-50">
          <h3 className="font-semibold text-red-600">Danger Zone</h3>
          <button className="mt-2 text-sm bg-red-100 text-red-700 px-3 py-1 rounded">
            Deactivate Account
          </button>
        </div>
      </div>
    </div>
  );
}

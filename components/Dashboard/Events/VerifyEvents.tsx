"use client";

import { useState } from "react";
import { ClipboardCheck, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useVerifyEvent } from "@/services/event.service";

export default function VerifyEventPage() {
  const [code, setCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const { mutate, isPending } = useVerifyEvent();

  const handleVerify = async (manualCode?: string) => {
    const codeToVerify = manualCode || code;
    if (!codeToVerify) return toast.error("Please enter or scan a code");

    mutate(
      { uniqueKey: codeToVerify },
      {
        onSuccess: () => toast.success("Event verified successfully!"),
        onError: (error) => toast.error(error.message || "Verification failed"),
      },
    );
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Verify Event</h1>
        <p className="text-gray-500">Scan QR or enter the unique code</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border">
        {isPending ? (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 text-white animate-spin mb-2" />
            <p className="text-white font-medium">Verifying Code...</p>
          </div>
        ) : isScanning ? (
          <div className="overflow-hidden rounded-lg">
            <Scanner
              onScan={(result) => {
                if (result) handleVerify(result[0].rawValue);
              }}
              scanDelay={2000}
              allowMultiple={false}
              onError={(error) => console.log(error)}
            />
            <button
              onClick={() => setIsScanning(false)}
              className="w-full mt-4 text-red-500 font-medium">
              Cancel Scan
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsScanning(true)}
            className="w-full py-12 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
            <Camera className="h-10 w-10 text-gray-400 mb-2" />
            <span className="text-gray-600 font-medium">Open QR Scanner</span>
          </button>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-gray-50 px-2 text-gray-500">Or manual entry</span>
        </div>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          disabled={isPending}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ENTER UNIQUE CODE"
          className="w-full p-4 border rounded-xl text-center text-xl font-mono tracking-widest uppercase focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          onClick={() => handleVerify()}
          disabled={isPending}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2">
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ClipboardCheck />
          )}
          Verify Code
        </button>
      </div>
    </div>
  );
}

// ... (imports remain the same)
import { ShoppingBag, SearchX } from "lucide-react";
import Link from "next/link";

export default function DealNotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative mx-auto w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
          <SearchX className="h-12 w-12 text-blue-500" />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-xs font-bold">!</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Deal Not Found</h1>
          <p className="text-gray-500">
            The deal you`re looking for might have expired, been removed, or the
            link is incorrect.
          </p>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Link
            href="/deals"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Browse Active Deals
          </Link>

          <Link
            href="/"
            className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

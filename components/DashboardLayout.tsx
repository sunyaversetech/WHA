"use client";
import { SlidersHorizontal, EllipsisVertical } from "lucide-react";
import { useState } from "react";
import Sidebar from "./Sidebar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  // const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isTopbarOpen, setIsTopbarOpen] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // useEffect(() => {
  //   setIsOpen(false);
  //   setIsTopbarOpen(false);
  // }, [pathname]);

  return (
    <div className="flex w-full">
      <div className="md:hidden fixed top-14 left-6 z-50">
        <button
          aria-label={isOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsOpen((s) => !s)}
          className="p-2 rounded-md shadow-sm bg-white/95 dark:bg-slate-800/90 backdrop-blur-sm">
          <SlidersHorizontal size={20} />
        </button>
      </div>

      <div
        className={`${
          sidebarCollapsed ? "hidden" : "hidden  md:block"
        } md:w-52 lg:w-64 top-0 left-0 h-full text-white`}>
        <Sidebar />
      </div>

      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
        onClick={() => setIsOpen(false)}>
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[80%] transform bg-white border-r border-gray-200 shadow-lg transition-transform duration-1000 ease-in-out ${
          isOpen
            ? "transition-transform duration-1000 translate-x-0"
            : "transition-transform duration-1000 -translate-x-full"
        } md:hidden`}
        role="dialog"
        aria-modal="true">
        <div className="h-full overflow-y-auto">
          <Sidebar />
        </div>
      </aside>

      <div
        className={`flex-1 mr-5 ml-5 max-lg:${
          sidebarCollapsed ? "ml-5" : "ml-1"
        }`}>
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;

// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { Home, Calendar, Tag, Store, User } from "lucide-react";
// import { useSession } from "next-auth/react";

// export default function BottomNav() {
//   const { data: session } = useSession();
//   const pathname = usePathname();

//   const isActive = (path: string) => {
//     return pathname === path || pathname.startsWith(path + "/");
//   };

//   const navLinks = [
//     { name: "Home", path: "/", icon: Home },
//     { name: "Events", path: "/events", icon: Calendar },
//     { name: "Deals", path: "/deals", icon: Tag },
//     { name: "Businesses", path: "/businesses", icon: Store },
//   ];

//   return (
//     <nav className="fixed md:hidden bottom-0 left-0 right-0 glass border-t border-neutral/30 z-50 shadow-lg backdrop-blur-md">
//       <div className="flex justify-around items-center h-16">
//         {navLinks.map((link) => {
//           const Icon = link.icon;
//           const active = isActive(link.path);

//           return (
//             <Link
//               key={link.path}
//               href={link.path}
//               className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 group ${
//                 active ? "text-secondary" : "text-black hover:text-secondary"
//               }`}
//             >
//               <div
//                 className={`flex items-center justify-center rounded-sm p-2 mb-1 transition-all duration-200 ${
//                   active
//                     ? "bg-primary text-sm shadow-md scale-110"
//                     : "group-hover:bg-[#f5f5f5]"
//                 }`}
//               >
//                 <Icon
//                   className={`h-5 w-5 ${
//                     active
//                       ? "text-base"
//                       : "text-primary group-hover:text-primary"
//                   }`}
//                 />
//               </div>
//               <span
//                 className={`text-xs font-medium transition-colors duration-200 ${
//                   active ? "text-primary" : "text-black hover:text-primary"
//                 }`}
//               >
//                 {link.name}
//               </span>
//             </Link>
//           );
//         })}

//         <Link
//           href={session ? "/dashboard" : "/auth"}
//           className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 group ${
//             isActive(session ? "/dashboard" : "/auth")
//               ? "text-primary"
//               : "text-primary hover:text-primary"
//           }`}
//         >
//           <div
//             className={`flex items-center justify-center rounded-sm p-2 mb-1 transition-all duration-200 ${
//               isActive(session ? "/dashboard" : "/auth")
//                 ? "bg-primary  text-white text-sm shadow-md scale-110"
//                 : "group-hover:bg-[#f5f5f5]"
//             }`}
//           >
//             <User
//               className={`h-5 w-5 ${
//                 isActive(session ? "/dashboard" : "/auth")
//                   ? "text-base"
//                   : "text-primary group-hover:text-priamry"
//               }`}
//             />
//           </div>
//           <span
//             className={`text-xs font-medium transition-colors duration-200 ${
//               isActive(session ? "/dashboard" : "/auth")
//                 ? "text-primary"
//                 : "text-black hover:text-primary"
//             }`}
//           >
//             {session ? "Profile" : "Login"}
//           </span>
//         </Link>
//       </div>
//     </nav>
//   );
// }

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Calendar, User, Store } from "lucide-react";
import { useSession } from "next-auth/react";

export default function BottomNav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Businesses", path: "/businesses", icon: Store },
    { name: "Events", path: "/events", icon: Calendar },
  ];

  return (
    <nav className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm">
      <div
        className="flex items-center justify-between px-2 py-2 rounded-full
      bg-white/60 backdrop-blur-2xl
      border border-white/40
      shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
      >
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.path);

          return (
            <Link
              key={link.path}
              href={link.path}
              className="flex-1 flex justify-center"
            >
              <div
                className={`flex items-center justify-center
              w-18 h-12 rounded-full
              transition-all duration-300
              ${
                active
                  ? "bg-white shadow-md scale-105"
                  : "text-neutral-500 hover:bg-white/40"
              }`}
              >
                <Icon
                  size={22}
                  strokeWidth={2}
                  className={active ? "text-primary" : ""}
                />
              </div>
            </Link>
          );
        })}

        {/* Profile / Login */}
        <Link
          href={session ? "/dashboard" : "/auth"}
          className="flex-1 flex justify-center"
        >
          <div
            className={`flex items-center justify-center
          w-18 h-12 rounded-full
          transition-all duration-300
          ${
            isActive(session ? "/dashboard" : "/auth")
              ? "bg-white shadow-md scale-105"
              : "text-neutral-500 hover:bg-white/40"
          }`}
          >
            <User size={22} strokeWidth={2} />
          </div>
        </Link>
      </div>
    </nav>
  );
}

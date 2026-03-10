import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-1 md:space-x-2 py-3 md:py-4 text-gray-600 text-xs md:text-sm overflow-x-auto scrollbar-hide">
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center whitespace-nowrap">
          {index > 0 && <ChevronRight className="h-3 w-3 md:h-4 md:w-4 mx-1" />}
          <Link
            href={item.href}
            className="hover:text-primary transition-colors">
            {item.label}
          </Link>
        </div>
      ))}
    </nav>
  );
}

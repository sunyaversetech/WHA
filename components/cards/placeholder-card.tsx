import React from 'react';
import { Search, Filter } from 'lucide-react';

interface PlaceholderCardProps {
  type: 'events' | 'deals' | 'businesses';
  className?: string;
}

export default function PlaceholderCard({
  type,
  className = '',
}: PlaceholderCardProps) {
  const getTypeInfo = () => {
    switch (type) {
      case 'events':
        return {
          title: 'No Events Found',
          message: 'No events found. Try adjusting your filters.',
          icon: <Search className="h-8 w-8 text-neutral" />,
          bgColor: 'bg-primary/5',
          borderColor: 'border-primary/20',
        };
      case 'deals':
        return {
          title: 'No Deals Found',
          message: 'No deals found. Try adjusting your filters.',
          icon: <Filter className="h-8 w-8 text-neutral" />,
          bgColor: 'bg-secondary/5',
          borderColor: 'border-secondary/20',
        };
      case 'businesses':
        return {
          title: 'No Businesses Found',
          message: 'No businesses found. Try adjusting your filters.',
          icon: <Search className="h-8 w-8 text-neutral" />,
          bgColor: 'bg-neutral/5',
          borderColor: 'border-neutral/20',
        };
      default:
        return {
          title: 'No Items Found',
          message: 'No items found. Try adjusting your filters.',
          icon: <Search className="h-8 w-8 text-neutral" />,
          bgColor: 'bg-neutral/5',
          borderColor: 'border-neutral/20',
        };
    }
  };

  const typeInfo = getTypeInfo();

  return (
    <div className={`card p-4 md:p-6 text-center ${className}`}>
      <div
        className={`p-3 md:p-4 ${typeInfo.bgColor} rounded-2xl w-fit mx-auto mb-3 md:mb-4`}
      >
        {typeInfo.icon}
      </div>

      <h3 className="text-sm md:text-base font-semibold text-secondary mb-2">
        {typeInfo.title}
      </h3>

      <p className="text-neutral text-xs md:text-sm mb-3 md:mb-4">
        {typeInfo.message}
      </p>

      <div className="flex items-center justify-center space-x-2 text-xs text-neutral">
        <Filter className="h-3 w-3" />
        <span>Check filters or try a different city</span>
      </div>
    </div>
  );
}

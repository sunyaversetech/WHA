import { Heart, MessageCircle, Share2 } from 'lucide-react';
import type { Confession } from '@/lib/types';

interface ConfessionCardProps {
  confession: Confession;
}

export default function ConfessionCard({ confession }: ConfessionCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200">
      <div className="flex items-center mb-4">
        <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-full h-10 w-10 flex items-center justify-center mr-3 text-white shadow-md">
          <span className="font-medium">A</span>
        </div>
        <div>
          <p className="font-medium text-gray-800">Anonymous</p>
          <p className="text-gray-500 text-sm">{confession.date}</p>
        </div>
      </div>

      <p className="text-gray-700 mb-4 leading-relaxed">{confession.content}</p>

      {confession.tags && confession.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {confession.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center text-gray-500 space-x-4">
        <button className="flex items-center hover:text-primary transition-colors group">
          <Heart className="h-5 w-5 mr-1 group-hover:text-primary transition-colors" />
          <span className="text-sm">Like</span>
        </button>
        <button className="flex items-center hover:text-primary transition-colors group">
          <MessageCircle className="h-5 w-5 mr-1 group-hover:text-primary transition-colors" />
          <span className="text-sm">Comment</span>
        </button>
        <button className="flex items-center hover:text-primary transition-colors group ml-auto">
          <Share2 className="h-5 w-5 group-hover:text-primary transition-colors" />
          <span className="text-sm">Share</span>
        </button>
      </div>
    </div>
  );
}

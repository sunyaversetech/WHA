'use client';

import { useState } from 'react';
import { useFavorites } from '@/contexts/favorites-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getEvents } from '@/lib/data/events';
import { getDeals } from '@/lib/data/deals';
import EventCard from '@/components/cards/event-card';
import DealCard from '@/components/cards/deal-card';
import { Calendar, Tag, Heart, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const [activeTab, setActiveTab] = useState('events');

  // Get all data
  const allEvents = getEvents();
  const allDeals = getDeals();

  // Filter favorites
  const favoriteEvents = allEvents.filter((event) =>
    favorites.events.includes(event.id)
  );
  const favoriteDeals = allDeals.filter((deal) =>
    favorites.deals.includes(deal.id)
  );

  // Total favorites count
  const totalFavorites = favoriteEvents.length + favoriteDeals.length;

  const EmptyState = ({ type }: { type: string }) => (
    <div className="card-lg p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Heart className="h-8 w-8 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold mb-2">No favorite {type} yet</h2>
      <p className="text-gray-600 mb-6">
        You haven't added any {type} to your favorites yet.
      </p>
      <Link href={`/${type}`} className="btn-primary">
        Browse {type}
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-modern">
      <div className="container-modern py-6 md:py-8">
        {/* Header */}
        <div className="card-lg p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-xl">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <h1 className="gradient-text text-xl md:text-2xl font-bold">
                Your Favorites
              </h1>
            </div>
            <div className="badge badge-primary">{totalFavorites} items</div>
          </div>
        </div>

        {totalFavorites === 0 ? (
          <div className="card-lg p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">No favorites yet</h2>
            <p className="text-gray-600 mb-6">
              Start adding events and deals to your favorites for quick access.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/events"
                className="btn-primary flex items-center space-x-2"
              >
                <Calendar className="h-4 w-4" />
                <span>Browse Events</span>
              </Link>
              <Link
                href="/deals"
                className="btn-secondary flex items-center space-x-2"
              >
                <Tag className="h-4 w-4" />
                <span>Browse Deals</span>
              </Link>
            </div>
          </div>
        ) : (
          <Tabs
            defaultValue="events"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <div className="card p-4 md:p-6 mb-6">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger
                  value="events"
                  className="flex items-center justify-center space-x-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Events ({favoriteEvents.length})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="deals"
                  className="flex items-center justify-center space-x-2"
                >
                  <Tag className="h-4 w-4" />
                  <span>Deals ({favoriteDeals.length})</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="events">
              {favoriteEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {favoriteEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <EmptyState type="events" />
              )}
            </TabsContent>

            <TabsContent value="deals">
              {favoriteDeals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {favoriteDeals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              ) : (
                <EmptyState type="deals" />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

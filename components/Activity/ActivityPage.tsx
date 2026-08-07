"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import UserBookings from "@/components/Dashboard/UserBookings/UserBookings";
import Ticket from "@/components/Dashboard/Ticket/Ticket";

export default function ActivityPage() {
  return (
    <div className="p-6 min-h-screen max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Activity</h1>
        <p className="text-muted-foreground mt-1">
          Your bookings and tickets, all in one place.
        </p>
      </div>

      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 w-full">
          <TabsTrigger value="bookings" className="w-full">
            Bookings
          </TabsTrigger>
          <TabsTrigger value="tickets" className="w-full">
            Tickets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <UserBookings hideHeader />
        </TabsContent>

        <TabsContent value="tickets">
          <Ticket hideHeader />
        </TabsContent>
      </Tabs>
    </div>
  );
}

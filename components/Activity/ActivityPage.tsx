"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarClock, Ticket as TicketIcon } from "lucide-react";
import UserBookings from "@/components/Dashboard/UserBookings/UserBookings";
import Ticket from "@/components/Dashboard/Ticket/Ticket";

const tabTriggerClass =
  "!h-auto flex-1 gap-1.5 !rounded-none !border-transparent !px-1 pb-3 text-base font-bold !text-muted-foreground data-[state=active]:!text-foreground after:!h-[3px] after:!rounded-full after:!bg-secondary";

export default function ActivityPage() {
  return (
    <div className="min-h-screen max-w-3xl mx-auto">
      <div className="px-6 pt-8 md:mt-20 pb-4">
        {/* <h1 className="text-3xl font-extrabold tracking-tight">Activity</h1> */}

        <Tabs defaultValue="tickets" className="gap-0">
          <TabsList
            variant="line"
            className="!h-auto !w-full !justify-start !gap-6 !rounded-none !p-0 px-6 border-b border-border"
          >
            <TabsTrigger value="tickets" className={tabTriggerClass}>
              {/* <TicketIcon className="h-4 w-4" /> */}
              Tickets
            </TabsTrigger>
            <TabsTrigger value="bookings" className={tabTriggerClass}>
              {/* <CalendarClock className="h-4 w-4" /> */}
              Bookings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="p-6">
            <Ticket hideHeader />
          </TabsContent>

          <TabsContent value="bookings" className="p-6">
            <UserBookings hideHeader />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

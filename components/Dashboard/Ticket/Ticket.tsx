"use client";
import React from "react";
import { useGetTickets } from "@/services/dashboard.service";
import { QRCodeCanvas } from "qrcode.react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Tag } from "lucide-react";

const Ticket = () => {
  const { data } = useGetTickets();
  const tickets = data?.data || [];

  const dealTickets = tickets.filter((t: any) => t.deal);
  const eventTickets = tickets.filter((t: any) => t.event);

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight">Wallet</h1>
        <p className="text-muted-foreground">
          Access your event passes and exclusive rewards.
        </p>
      </div>

      <Tabs defaultValue="events" className="space-y-6 ">
        <TabsList className="bg-muted/50 p-1 w-full">
          <TabsTrigger value="events" className="px-8 w-full">
            Events
          </TabsTrigger>
          <TabsTrigger value="deals" className="px-8 w-full">
            Deals
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="events"
          className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 ">
          {eventTickets.map((item: any) => (
            <EventTicket key={item._id} item={item} />
          ))}
        </TabsContent>

        <TabsContent
          value="deals"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dealTickets.map((item: any) => (
            <DealTicket key={item._id} item={item} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const EventTicket = ({ item }: { item: any }) => {
  const { event, status, uniqueKey } = item;

  return (
    <Card className="flex flex-col sm:flex-row overflow-hidden border-none shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Left Info Section */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-start mb-4">
          <Badge
            className={status === "verified" ? "bg-green-500" : "bg-blue-500"}>
            {status.toUpperCase()}
          </Badge>
        </div>
        <h3 className="text-xl font-bold mb-2 leading-tight">{event.title}</h3>
        <div className="space-y-2 text-slate-300 text-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            {new Date(event.dateRange.from).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-400" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>
      </div>

      {/* Right QR Section (The "Stub") */}
      <div className="bg-white p-6 flex flex-col items-center justify-center gap-2 border-t-2 border-dashed sm:border-t-0 sm:border-l-2 border-slate-700/30">
        <div className="bg-white p-2 rounded-lg shadow-inner">
          <QRCodeCanvas
            value={uniqueKey}
            size={100}
            level={"H"}
            includeMargin={false}
          />
        </div>
        <p className="text-[10px] font-mono text-slate-500 font-bold">
          {uniqueKey}
        </p>
      </div>
    </Card>
  );
};

const DealTicket = ({ item }: { item: any }) => {
  const { deal, status, uniqueKey } = item;

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20">
      <div className="absolute -top-3 -left-3 w-8 h-8 bg-background border-2 border-primary/20 rounded-full" />
      <div className="absolute -top-3 -right-3 w-8 h-8 bg-background border-2 border-primary/20 rounded-full" />

      <CardHeader className="text-center pb-2">
        <Badge
          variant="outline"
          className="w-fit mx-auto mb-2 border-primary text-primary">
          <Tag className="w-3 h-3 mr-1" /> DISCOUNT VOUCHER
        </Badge>
        <CardTitle className="text-lg line-clamp-1">
          {deal?.title || "Limited Deal"}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-4 py-4">
        <div className="p-3 border-2 border-slate-100 rounded-xl bg-slate-50">
          <QRCodeCanvas value={uniqueKey} size={120} />
        </div>
        <div className="text-center">
          <p className="text-xs font-mono font-black tracking-widest text-muted-foreground">
            {uniqueKey}
          </p>
          <p className="text-[10px] text-orange-600 font-semibold mt-1 italic">
            Show this at checkout
          </p>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/30 border-t border-dashed flex justify-center py-3">
        <span className="text-xs font-medium uppercase tracking-tighter">
          Status:{" "}
          <span
            className={
              status === "pending" ? "text-orange-500" : "text-green-500"
            }>
            {status}
          </span>
        </span>
      </CardFooter>
    </Card>
  );
};

export default Ticket;

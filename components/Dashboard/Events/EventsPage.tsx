"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, MapPin, Eye } from "lucide-react";
import { EventForm } from "./EventsForm";
import { useGetEvent } from "@/services/event.service";
import Image from "next/image";
import { useState } from "react";

type EventRecord = {
  id: string;
  title: string;
  price: string;
  venue: string;
  date: string;
  latitude: number;
  longitude: number;
};

export default function EventsBackend() {
  const events: EventRecord[] = [];

  const { data } = useGetEvent();
  const [open, setOpen] = useState(false);

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Events Dashboard</h1>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <EventForm open={open} setOpen={setOpen} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Coordinates</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-muted-foreground">
                  No events found. Click `Add Event` to start.
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((event: any) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="group relative h-12 w-12 cursor-pointer overflow-hidden rounded-md border">
                          <Image
                            src={event.image}
                            alt={event.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-110"
                          />

                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                            <Eye className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </DialogTrigger>

                      <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
                        <DialogTitle className="text-sm ">
                          <span
                            className="inline-block text-white bg-slate-800 px-2 py-1 rounded-md"
                            title={event.title}>
                            {event.title}
                          </span>
                        </DialogTitle>
                        <div className="w-full sm:aspect-video">
                          <Image
                            src={event.image}
                            alt={event.title}
                            width={500}
                            height={500}
                            className="rounded-lg object-cover"
                            priority
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>{event.venue}</TableCell>
                  <TableCell>
                    {event.price ? `$${event.price}` : "Free"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="mr-1 h-3 w-3" />
                      {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Intl.DateTimeFormat("en-AU", {
                      weekday: "long",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }).format(new Date(event.date))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

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
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, MapPin, Eye, Edit } from "lucide-react";
import { useDeleteEvent, useGetEvent } from "@/services/event.service";
import Image from "next/image";
import Link from "next/link";
import { DeleteConfirmDialog } from "@/components/ui/DynamicDeleteButton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function EventsBackend() {
  const { data } = useGetEvent();
  const { mutate, isPending } = useDeleteEvent();
  const queryClient = useQueryClient();
  const router = useRouter();
  const handleDelete = (id: string) => {
    mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Event deleted successfully");
          queryClient.invalidateQueries({ queryKey: ["event"] });
          queryClient.invalidateQueries({ queryKey: ["favorite"] });
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to delete event",
          );
        },
      },
    );
  };

  return (
    <div className="p-10 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Events Dashboard</h1>

        <Link
          href="/dashboard/events/add-event"
          className="ml-auto flex bg-[#041e3a] text-white items-center p-2 rounded-md hover:bg-slate-100 hover:text-[#041e3a] border hover:border-[#041e3a] transition-colors duration-200">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Event
        </Link>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
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
              data?.data?.map((event) => (
                <TableRow key={event._id}>
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
                    {event.ticket_price ? `$${event.ticket_price}` : "Free"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="mr-1 h-3 w-3" />
                      {event.location.split(",")[0]}{" "}
                      {event.location.split(",")[1]}
                    </div>
                  </TableCell>
                  <TableCell>
                    {event?.dateRange?.from
                      ? new Intl.DateTimeFormat("en-AU", {
                          day: "2-digit",
                          month: "short",
                        }).format(new Date(event?.dateRange?.from))
                      : "-"}{" "}
                    to{" "}
                    {event?.dateRange?.to
                      ? new Intl.DateTimeFormat("en-AU", {
                          day: "2-digit",
                          month: "short",
                        }).format(new Date(event?.dateRange?.to))
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Button
                        variant={"ghost"}
                        onClick={() =>
                          router.push(
                            `/dashboard/events/add-event?id=${event._id}`,
                          )
                        }>
                        <Edit className="mr-2 h-4 w-4" />
                      </Button>
                      <DeleteConfirmDialog
                        onConfirm={() => handleDelete(event._id ?? "")}
                        text={event.title}
                        isPending={isPending}
                      />
                    </div>
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

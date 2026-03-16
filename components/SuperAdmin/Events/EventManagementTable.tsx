"use client";

import React from "react";
import {
  Trash2,
  ExternalLink,
  Calendar as CalendarIcon,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// Shadcn Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EventType } from "@/services/event.service";
import { useSuperAdminDeleteEvent } from "@/services/super-admin.service";
import { useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/ui/DynamicDeleteButton";

const EventManagementTable = ({ data }: { data: EventType[] }) => {
  const { mutate } = useSuperAdminDeleteEvent();
  const queryClient = useQueryClient();
  const handleDeleteEvent = async (id: string) => {
    mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Event deleted successfully");
          queryClient.invalidateQueries({ queryKey: ["getSuperAdminEvents"] });
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
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[250px]">Event</TableHead>
            <TableHead>Organizer</TableHead>
            <TableHead>Date & Price</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((event) => (
            <TableRow
              key={event._id}
              className="hover:bg-muted/50 transition-colors">
              {/* Event Info */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-lg border">
                    <AvatarImage
                      src={event.image}
                      alt={event.title}
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-lg">EV</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-bold leading-none">
                      {event.title}
                    </span>
                    <Badge
                      variant="outline"
                      className="w-fit mt-1 text-[10px] uppercase">
                      {event.category}
                    </Badge>
                  </div>
                </div>
              </TableCell>

              {/* Organizer Info */}
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {event.user?.business_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {event.user?.name}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarIcon size={12} />
                    {event?.dateRange?.from &&
                      format(new Date(event?.dateRange?.from), "MMM dd, yyyy")}
                  </div>
                  <Badge
                    variant={
                      event.price_category === "free" ? "ghost" : "default"
                    }
                    className="w-fit text-[10px] text-muted-foreground">
                    {event.price_category === "free"
                      ? "FREE"
                      : `$${event.ticket_price}`}
                  </Badge>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <MapPin size={14} className="text-red-500" />
                  <span>{event.city}</span>
                </div>
              </TableCell>

              <TableCell className="text-right">
                <TooltipProvider>
                  <div className="flex justify-end gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink size={16} className="text-blue-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View Event Details</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DeleteConfirmDialog
                          onConfirm={() => handleDeleteEvent(event._id)}
                          text={event.title}
                          header={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeleteEvent(event._id)}>
                              <Trash2 size={16} />
                            </Button>
                          }
                        />
                      </TooltipTrigger>
                      <TooltipContent>Delete Event</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default EventManagementTable;

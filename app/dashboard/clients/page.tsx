"use client";
import { useState } from "react";
import { Search, Eye, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ClientType,
  useGetClientDetail,
  useGetClients,
} from "@/services/client.service";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientType | null>(
    null,
  );
  const { data, isLoading } = useGetClients(search);
  const { data: detail, isLoading: detailLoading } = useGetClientDetail(
    selectedClient?.user_id ?? null,
  );

  const clients = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            Clients
          </h1>
          <p className="text-sm text-slate-500">
            Everyone who has booked with you
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Bookings</TableHead>
              <TableHead>Total spent</TableHead>
              <TableHead>Last visit</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground">
                  Loading clients...
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground">
                  No clients yet.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((c) => (
                <TableRow key={c.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={c.image} />
                        <AvatarFallback className="text-xs uppercase">
                          {c.name?.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {c.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {c.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{c.phone || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {c.bookings_count}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    A${c.total_spent.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {format(new Date(c.last_booking_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedClient(c)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!selectedClient}
        onOpenChange={(open) => !open && setSelectedClient(null)}>
        {selectedClient && (
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>{selectedClient.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-3 text-xs flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {selectedClient.email}
                </span>
                {selectedClient.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {selectedClient.phone}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[360px] overflow-y-auto space-y-2">
              {detailLoading ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  Loading...
                </p>
              ) : detail?.data?.bookings?.length ? (
                detail.data.bookings.map((b) => (
                  <div
                    key={b._id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {b.service_id?.name || "Deleted service"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(b.start_time), "MMM d, yyyy · h:mm a")}
                      </p>
                    </div>
                    <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                      {b.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-6">
                  No bookings found.
                </p>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

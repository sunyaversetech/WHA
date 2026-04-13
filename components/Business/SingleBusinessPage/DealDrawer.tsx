import React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ListChevronsDownUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DealsGetValues } from "@/services/deal.service";
import DealCard from "@/components/cards/deal-card";

const DealDrawer = ({
  deal,
  user,
}: {
  deal?: DealsGetValues[];
  user: string;
}) => {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">
          <ListChevronsDownUp className="mr-2 h-4 w-4" /> Show More Deal
        </Button>
      </DrawerTrigger>
      <DrawerContent className="min-h-screen! fixed inset-x-0 bottom-0 -top-25 rounded-t-none border-none z-999">
        <div className="mx-auto w-full  h-full flex flex-col">
          <DrawerHeader className="flex flex-row items-center justify-between border-b px-6">
            <div className="space-y-1">
              <DrawerTitle className="text-2xl">
                {deal?.length} Event for {user}
              </DrawerTitle>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-5 w-5" />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid md:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1 gap-3">
              {deal?.map((d) => (
                <DealCard deal={d} key={d._id} />
              ))}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default DealDrawer;

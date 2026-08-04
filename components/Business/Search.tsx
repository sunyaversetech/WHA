"use client";

import { useState } from "react";
import { Search, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export default function WhSearchBar() {
  const [category, setCategory] = useState("Search events or deals");
  const [communityOnly, setCommunityOnly] = useState(false);
  const [mapView, setMapView] = useState(false);

  const categories = [
    "All Events",
    "Deals",
    "Restaurants",
    "Movies",
    "Festivals",
    "Nepali Community",
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-white shadow-xl rounded-2xl md:rounded-full border p-2">
        {/* SEARCHABLE CATEGORY */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="flex-1 justify-start rounded-full text-muted-foreground"
            >
              <Search size={18} className="mr-2" />
              {category}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search category..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Categories">
                  {categories.map((item) => (
                    <CommandItem key={item} onSelect={() => setCategory(item)}>
                      {item}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* COMMUNITY TOGGLE */}
        <Button
          variant={communityOnly ? "default" : "ghost"}
          className="rounded-full"
          onClick={() => setCommunityOnly(!communityOnly)}
        >
          Community
        </Button>

        {/* MAP VIEW TOGGLE */}
        <Button
          variant={mapView ? "default" : "ghost"}
          className="rounded-full"
          onClick={() => setMapView(!mapView)}
        >
          <Map size={18} className="mr-2" />
          Map View
        </Button>

        {/* SEARCH BUTTON */}
        <Button className="rounded-full px-6">Search</Button>
      </div>
    </div>
  );
}

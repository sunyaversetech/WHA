import type { Event, Deal, Business } from "@/lib/types";

export function filterByCity<T extends Event | Deal | Business>(
  items: T[],
  selectedCity: string,
): T[] {
  if (selectedCity === "All Cities") {
    return items;
  }

  return items.filter((item) => {
    if ("city" in item && item.city) {
      return item.city.toLowerCase() === selectedCity.toLowerCase();
    }

    if ("location" in item && item.location) {
      return item.location.toLowerCase().includes(selectedCity.toLowerCase());
    }

    return false;
  });
}

export function getCitiesFromData<T extends Event | Deal | Business>(
  items: T[],
): string[] {
  const cities = new Set<string>();

  items.forEach((item) => {
    if ("city" in item && item.city) {
      cities.add(item.city);
    }
    if ("location" in item && item.location) {
      // Extract city from location (assuming format like "City, State" or "City")
      const locationParts = item.location.split(",");
      if (locationParts.length > 0) {
        const city = locationParts[0].trim();
        if (city) {
          cities.add(city);
        }
      }
    }
  });

  return Array.from(cities).sort();
}

import { useCityFilter } from '@/contexts/city-filter-context';
import { filterByCity } from '@/lib/utils/city-filter';
import type { Event, Deal, Business } from '@/lib/types';

export function useFilteredEvents(allEvents: Event[]) {
  const { selectedCity } = useCityFilter();
  return filterByCity(allEvents, selectedCity);
}

export function useFilteredDeals(allDeals: Deal[]) {
  const { selectedCity } = useCityFilter();
  return filterByCity(allDeals, selectedCity);
}

export function useFilteredBusinesses(allBusinesses: Business[]) {
  const { selectedCity } = useCityFilter();
  return filterByCity(allBusinesses, selectedCity);
}

export function useFilteredData<T extends Event | Deal | Business>(
  allData: T[]
) {
  const { selectedCity } = useCityFilter();
  return filterByCity(allData, selectedCity);
}

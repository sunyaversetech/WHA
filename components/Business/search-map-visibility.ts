import { create } from "zustand";

// The /search (and /) map panel is position:fixed to the viewport (it
// stays pinned at a fixed screen position while the results column
// scrolls past it), so it would otherwise visually overlap the sitewide
// Footer once scrolled into view — Footer lives in app/layout.tsx, a
// sibling of BusinessPage, so this is how it learns whether that page's
// map is currently showing without a prop path between them.
interface SearchMapVisibilityStore {
  isMapVisible: boolean;
  setMapVisible: (visible: boolean) => void;
}

export const useSearchMapVisibility = create<SearchMapVisibilityStore>(
  (set) => ({
    isMapVisible: true,
    setMapVisible: (visible) => set({ isMapVisible: visible }),
  }),
);

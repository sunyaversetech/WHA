export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  city: string;
  image: string;
  category?: string;
  details?: string;
  contactEmail?: string;
  contactPhone?: string;
  ticketUrl?: string;
}

export interface Deal {
  id: string;
  title: string;
  description: string;
  coupon: string;
  business: string;
  businessId?: string;
  expiryDate: string;
  image: string;
  city?: string;
  code?: string;
  details?: string;
  redeem?: string;
  terms?: string;
  category?: string;
}

export interface Business {
  id: string;
  name: string;
  description: string;
  location: string;
  city?: string;
  longitude: number;
  latitude: number;
  phone?: string;
  image: string;
  email?: string;
  website?: string;
  hours?: string;
  details?: string;
  category?: string;
}

export interface Confession {
  id: string;
  content: string;
  date: string;
  tags?: string[];
  likes?: number;
}

export interface FeaturedItem {
  id: string;
  type: string;
  title: string;
  image: string;
  imageMobile?: string; // Optional mobile image
  description: string;
  city?: string;
  location?: string;
}

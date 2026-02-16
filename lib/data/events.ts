import type { Event } from '../types';
import Image from 'next/image';

const events: Event[] = [
  {
    id: 'WHA-003',
    title: 'Aastha Reunion Live ft. Naren Limbu & Sudip Gurung',
    image: '/events/aastha.png',
    date: 'August 10, 2025',
    venue: 'The Maya Lounge, Sydney',
    city: 'Sydney',
    description:
      'Experience the magical reunion of Aastha with Naren Limbu & Sudip Gurung live in Sydney! Presented by One Horned Group as part of the BrizRocks tour, this concert promises nostalgic hits and unforgettable performances.',
    details: `
      <p><strong>Aastha Reunion</strong> brings together the iconic voices of <strong>Naren Limbu</strong> and <strong>Sudip Gurung</strong> for a special night in Sydney.</p>
      <p>Organized by <strong>One Horned Group</strong> as part of their <strong>BrizRocks</strong> tour, this event will take you on a musical journey through Aastha's greatest hits.</p>
    `,
    category: 'concert',
    contactEmail: '', // not provided
    contactPhone: '', // not provided
    ticketUrl:
      'https://tixort.au/event/aastha-reunion-live-in-sydney/?fbclid=PAQ0xDSwLtsOBleHRuA2FlbQIxMQABp-Q251cQ_TIk-42prR6iOn1g5HUi0gguKFrxaq5UhJvHQyPjG-0fVc0MSWgw_aem_ZO2YTLv993kW9vB11dnVEg',
  },
  {
    id: 'wha001',
    title: 'Nawaj Ansari Live in Sydney',
    image: '/events/nawaj-syd.jpg',
    date: 'August 5, 2025',
    venue: 'Roundhouse, UNSW, Sydney',
    city: 'Sydney',
    description:
      'Join Nawaj Ansari live at the iconic Roundhouse, UNSW! Presented by Vishika Films and Moksh Events x Kaal Bhairav, this concert promises an unforgettable night of Nepali music and vibes.',
    details: `
      <p><strong>Nawaj Ansari</strong> brings his Samrajya Tour to Sydney for an exciting concert event.</p>
      <p>Organized by <strong>Vishika Films</strong> in collaboration with <strong>Moksh Events x Kaal Bhairav</strong>, this event will showcase Nawaj’s incredible vocal talent and stage presence.</p>
    `,
    category: 'concert',
    contactEmail: '', // not provided
    contactPhone: '', // not provided
    ticketUrl:
      'https://moshtix.com.au/v2/event/nawaj-ansari-samrajya-tour-sydney/180671?skin=roundhouse&fbclid=PAZXh0bgNhZW0CMTEAAaeaZ_oTz_aspAqxp19E_1knqARv9eTnhMBu2jVnEUzcgbAuWfg2xlsyKJVv6g_aem_0U9bjG0m2vPmk2LtgwGnIA',
  },
  {
    id: 'wha002',
    title: 'Nawaj Ansari Live in Brisbane',
    image: '/events/nawaj-bne.jpg', // You can update the image path if you have the actual image
    date: 'July 29, 2025',
    venue: 'THE TRIFFID, Brisbane',
    city: 'Brisbane',
    description:
      'Experience Nawaj Ansari live in Brisbane with an electrifying concert presented by Vishika Films and Sarkar Entertain. Don’t miss out on this amazing Nepali musical night!',
    details: `
    <p><strong>Nawaj Ansari</strong> is coming live to Brisbane for an unforgettable concert at THE TRIFFID.</p>
    <p>Organized by <strong>Vishika Films</strong> and <strong>Sarkar Entertain</strong>, get ready to immerse yourself in the soulful tunes and vibrant performances.</p>
 
  `,
    category: 'concert',
    contactEmail: '', // Not provided
    contactPhone: '', // Not provided
    ticketUrl:
      'https://m.moshtix.com.au/v2/event/nawaj-ansari-live-in-brisbane/182305',
  },
  {
    id: '2',
    title: 'Community Awareness & Cultural Program with Indoor Picnic',
    image: '/events/community-cultural.jpg',
    date: 'August 17, 2025',
    venue: 'To Be Confirmed',
    city: 'Canberra',
    description:
      'A vibrant community gathering celebrating Nepali culture, unity, and awareness — open to parents, students, and newcomers. Entry is free for all.',
    details: `
      <p>The Prawas Nepali Samparka Bibhag – ACT warmly invites you to a special occasion dedicated to fostering cultural connection, awareness, and celebration within the Nepali community in Australia.</p>
    <br>
      <p>This Community Awareness and Cultural Program is more than an event — it is a heartfelt initiative designed to bring together families, students, and new arrivals to experience the richness of Nepali traditions in an inclusive and welcoming environment.</p>
   <br>
      <p>The day will feature a curated blend of live music, traditional dance performances, and singing. Attendees are encouraged to dress in cultural attire and participate in the indoor picnic, which adds a cozy, family-friendly atmosphere to the event.</p>
   <br>
  
      <p>Mark your calendars and join us for a celebration of community spirit, cultural pride, and meaningful connections.</p>
    `,
    category: 'community',
    contactEmail: '', // Add if available
    contactPhone: '', // Add if available
    ticketUrl: '', // No tickets required – free event
  },
  {
    id: '3',
    title: 'ANFS Family Teej Sajh 2025',
    image: '/events/teej.jpg', // Replace with correct image path if available
    date: 'August 23, 2025',
    venue: 'Albert Hall, Canberra',
    city: 'Canberra',
    description:
      'Join us for a vibrant evening of culture, music, dance, and food at the annual ANFS Teej Night in Canberra.',
    details: `
      <p>The Australia-Nepal Friendship Society (ANFS) warmly invites you to its annual <strong>Teej Sajh 2025</strong> celebration in Canberra.</p>
      
      <p>This special evening will bring together the Nepali community for a night of joy, tradition, and togetherness. Celebrate Teej with vibrant cultural performances, traditional music, dance, and a delicious Nepali feast.</p>
      
      <p><strong>Highlights of the Evening:</strong></p>
      <ul>
        <li>Traditional Teej songs and dance performances</li>
        <li>Authentic Nepali cuisine</li>
        <li>Cultural showcases and entertainment</li>
        <li>Fun activities and games for all ages</li>
      </ul>
  
      <p>Dress in your traditional attire and come with friends and family to enjoy an unforgettable evening of Nepali culture and celebration.</p>
    `,
    category: 'festival',
    contactEmail: 'info@anfs.org.au', // Replace with actual email if available
    contactPhone: '', // Optional
    ticketUrl: '', // Add link if ticketing available
  },

  {
    id: '4',
    title: 'Dashain Night 2025 in Canberra',
    image: '/events/dashain.jpg', // Replace with actual image path
    date: 'September 27, 2025',
    venue: 'Albert Hall, Canberra',
    city: 'Canberra',
    description:
      'Celebrate Dashain with ANFS in Canberra! A vibrant night of culture, music, dance, and traditional Nepali cuisine.',
    details: `
      <p><strong>ANFS Presents: Dashain Night 2025 in Canberra! </strong></p>
      <p>Get ready for a night of culture, music, dance, and delicious food as we come together to celebrate Dashain in grand style! </p>
      
      <p><strong>Time:</strong> 6:00 PM – 10:00 PM</p>
      <p>Stay tuned for more details! Let’s make this Dashain celebration unforgettable.</p>
    `,
    category: 'Cultural Event',
    contactEmail: '', // Add if available
    contactPhone: '', // Add if available
    ticketUrl: '', // Add ticket link if available
  },
  {
    id: '5',
    title: "What's Happening Australia",
    image: '/wha/wha-banner.png',
    date: '2025', // Optional: Leave blank or add "Since 2025" etc.
    venue: 'Australia',
    city: 'Canberra',
    description:
      'Discover Nepali events, community updates, local deals, and businesses all across Australia. Your go-to platform to stay connected and informed.',
    details: `
      <p><strong>What's Happening Australia</strong> is a dedicated platform that brings together the Nepali community across Australia by showcasing the latest <strong>events</strong>, <strong>local business deals</strong>, <strong>movies</strong>, and <strong>community news</strong>.</p>
      
      <p>We currently operate in <strong>Canberra</strong> and are expanding soon to <strong>Sydney</strong> and other major cities. Stay tuned and be a part of the growing Nepali-Australian experience!</p>
      
      <p>Visit our site regularly for updates or follow us on social media to never miss what's happening near you.</p>
    `,
    category: '',
    contactEmail: 'info@whatshappeningaustralia.com',
    contactPhone: '', // Add if available
    ticketUrl: '', // Not required unless linking to a feature
  },
  // {
  //   id: "3",
  //   title: "Dashain Festival",
  //   description:
  //     "The biggest festival in Nepali culture. Come celebrate with traditional rituals, food, and entertainment.",
  //   date: "October 12, 2025",
  //   venue: "Belconnen Community Centre",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "festival",
  // },
  // {
  //   id: "4",
  //   title: "Sajan Raj Vaidiya Live Concert",
  //   description: "Popular Nepali singer Sajan Raj Vaidiya is coming to Canberra for a live performance.",
  //   date: "February 14, 2025",
  //   venue: "The Base Canberra, Belconnen",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "concert",
  // },
  // {
  //   id: "5",
  //   title: "Nepali Language Workshop",
  //   description: "Learn basic Nepali language skills in this interactive workshop for beginners.",
  //   date: "June 5, 2025",
  //   venue: "ANU Cultural Centre",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "education",
  // },
  // {
  //   id: "6",
  //   title: "Tihar Cultural Night",
  //   description: "Celebrate the festival of lights with traditional dances, music, and delicious Nepali cuisine.",
  //   date: "November 15, 2025",
  //   venue: "Canberra Theatre Centre",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "festival",
  // },
  // {
  //   id: "7",
  //   title: "Nepali Film Festival",
  //   description: "A showcase of the best contemporary Nepali films, with discussions and Q&A sessions with filmmakers.",
  //   date: "August 22-24, 2025",
  //   venue: "Palace Electric Cinema, NewActon",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "entertainment",
  // },
];

export function getEvents(): Event[] {
  return events;
}

export function getEventById(id: string): Event | undefined {
  return events.find((event) => event.id === id);
}

export function getUniqueCities(): string[] {
  const cities = events.map((event) => event.city);
  return [...new Set(cities)].sort();
}

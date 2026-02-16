import type { Confession } from '../types';

const confessions: Confession[] = [
  {
    id: '1',
    content:
      "I've been meaning to say this for a while now, but every time I try, the words just don't feel enough. The truth is, I've developed feelings for you that go beyond friendship. Every moment spent with you feels special, and I can't help but wonder if you might feel the same. I care about you more than I know how to express, and I just wanted to be honest with you about how I feel.",
    date: 'May 10, 2025',
    tags: ['friendship', 'feelings'],
    likes: 42,
  },
  {
    id: '2',
    content:
      "As a Nepali student who moved to Canberra last year, I've been struggling with homesickness more than I let on. I miss the mountains, the food, and most of all, my family. Sometimes I feel like I'm living two separate lives - one here and one back home. I'm grateful for the opportunities here, but some days are really hard.",
    date: 'April 28, 2025',
    tags: ['student', 'homesick'],
    likes: 56,
  },
  {
    id: '3',
    content:
      "I secretly learned to cook all my mom's Nepali recipes before moving to Australia for university. Now I host dinner parties for my Australian friends and they think I'm some kind of cooking genius. Little do they know I'm on video call with my mom before every dinner party getting last-minute tips!",
    date: 'April 15, 2025',
    tags: ['cooking', 'university'],
    likes: 89,
  },
  {
    id: '4',
    content:
      "I've been in Canberra for 5 years now, and I still haven't told my parents back in Nepal that I changed my major from Engineering to Arts. They're so proud telling everyone their son is becoming an engineer in Australia. I'm graduating next month and I don't know how to break it to them.",
    date: 'March 30, 2025',
    tags: ['family', 'education'],
    likes: 37,
  },
  {
    id: '5',
    content:
      "To the Nepali guy who works at the coffee shop near ANU - your smile brightens my day every morning. I've been ordering the same coffee for months just to see you, even though I don't even like lattes that much. Maybe one day I'll have the courage to ask you out.",
    date: 'March 22, 2025',
    tags: ['crush', 'coffee'],
    likes: 124,
  },
];

export function getConfessions(): Confession[] {
  return confessions;
}

export function getConfessionById(id: string): Confession | undefined {
  return confessions.find((confession) => confession.id === id);
}

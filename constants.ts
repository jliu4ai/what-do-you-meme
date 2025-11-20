
import { MemeImage, ThemePack } from "./types";

// 1. Define Themes
export const THEME_PACKS: ThemePack[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    description: 'The classics. Cats, weird stock photos, and chaos.',
    price: 0,
    coverImage: '🤡',
    imageIds: [] // Populated dynamically below
  },
  {
    id: 'work',
    name: 'Corporate Life',
    description: 'Emails, meetings, and silent screaming.',
    price: 499, // $4.99
    coverImage: '💼',
    imageIds: []
  },
  {
    id: 'animals',
    name: 'Party Animals',
    description: 'Cute but psycho pets.',
    price: 299,
    coverImage: '🐾',
    imageIds: []
  },
  {
    id: 'tech',
    name: 'Silicon Valley',
    description: 'Bugs, crypto, and broken wifi.',
    price: 399,
    coverImage: '💻',
    imageIds: []
  }
];

// 2. Helper to assign themes
const assign = (id: string, url: string, themeId: string): MemeImage => ({ id, url, themeId });

// 3. Image Database
export const MEME_IMAGES: MemeImage[] = [
  // STARTER
  assign('1', 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=800&q=80', 'starter'),
  assign('2', 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=800&q=80', 'starter'),
  assign('3', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80', 'starter'),
  assign('4', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80', 'tech'),
  assign('5', 'https://images.unsplash.com/photo-1566492031773-4fbc7527e053?auto=format&fit=crop&w=800&q=80', 'starter'),
  assign('6', 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=800&q=80', 'starter'),
  assign('7', 'https://images.unsplash.com/photo-1524481905007-ea072534b820?auto=format&fit=crop&w=800&q=80', 'starter'),
  assign('8', 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80', 'animals'),
  assign('9', 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?auto=format&fit=crop&w=800&q=80', 'animals'),
  assign('10', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80', 'starter'),
  // WORK
  assign('11', 'https://images.unsplash.com/photo-1503023345313-0f0261c96ed0?auto=format&fit=crop&w=800&q=80', 'work'),
  assign('13', 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80', 'work'),
  assign('15', 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=800&q=80', 'work'),
  assign('16', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80', 'work'),
  assign('29', 'https://images.unsplash.com/photo-1516139008210-96e45dccd83b?auto=format&fit=crop&w=800&q=80', 'work'),
  assign('30', 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=800&q=80', 'work'),
  assign('34', 'https://images.unsplash.com/photo-1485965120184-e224f723d879?auto=format&fit=crop&w=800&q=80', 'work'),
  assign('38', 'https://images.unsplash.com/photo-1495366691023-cc4eadcc2d7e?auto=format&fit=crop&w=800&q=80', 'work'),
  assign('42', 'https://images.unsplash.com/photo-1498036882173-b41c28a8ba34?auto=format&fit=crop&w=800&q=80', 'work'),
  // TECH
  assign('20', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80', 'tech'),
  assign('28', 'https://images.unsplash.com/photo-1611564227353-b652761309af?auto=format&fit=crop&w=800&q=80', 'tech'),
  assign('36', 'https://images.unsplash.com/photo-1521038199265-bc482db0f923?auto=format&fit=crop&w=800&q=80', 'tech'),
  assign('48', 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=800&q=80', 'tech'),
  // ANIMALS
  assign('18', 'https://images.unsplash.com/photo-1504199367641-aba8151af406?auto=format&fit=crop&w=800&q=80', 'animals'),
  assign('23', 'https://images.unsplash.com/photo-1516574187841-69202d57e200?auto=format&fit=crop&w=800&q=80', 'animals'),
  assign('25', 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&w=800&q=80', 'animals'),
  assign('26', 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=800&q=80', 'animals'),
  assign('32', 'https://images.unsplash.com/photo-1529778873920-4da4926a7071?auto=format&fit=crop&w=800&q=80', 'animals'),
  assign('33', 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=800&q=80', 'animals'),
  assign('44', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80', 'animals'),
  assign('47', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80', 'animals'),
];

// Populate Theme Packs
MEME_IMAGES.forEach(img => {
  const pack = THEME_PACKS.find(p => p.id === img.themeId);
  if (pack) {
    pack.imageIds.push(img.id);
  }
});

export const FALLBACK_CAPTIONS = [
  "When the wifi goes out for 1 minute.",
  "Me trying to explain crypto to my grandma.",
  "My face when I see the waiter coming with food.",
  "When you realize it's only Tuesday.",
  "That moment you send a risky text.",
  "Trying to act normal after tripping in public.",
  "When the code compiles on the first try.",
  "Me looking at my bank account.",
];

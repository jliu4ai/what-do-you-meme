
import { User, Room, MemeImage } from "../types";
import { MEME_IMAGES, THEME_PACKS } from "../constants";

// --- SIMULATED DATABASE ---
let CURRENT_USER: User | null = null;
let ROOMS: Record<string, Room> = {};

const INITIAL_USER: User = {
  id: 'user_123',
  name: 'Meme Lord',
  email: 'player@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MemeLord',
  coins: 100,
  unlockedThemes: ['starter']
};

// --- PERSISTENCE HELPERS ---
const loadData = () => {
  try {
    // Load User
    const savedUser = localStorage.getItem('meme_user');
    if (savedUser) {
      CURRENT_USER = JSON.parse(savedUser);
    }
    // Load Rooms (Critical for Invite Links to work in demo)
    const savedRooms = localStorage.getItem('meme_rooms');
    if (savedRooms) {
      ROOMS = JSON.parse(savedRooms);
    }
  } catch (e) {
    console.error("Failed to restore data", e);
  }
};

const saveData = () => {
  if (CURRENT_USER) {
    localStorage.setItem('meme_user', JSON.stringify(CURRENT_USER));
  }
  // Persist rooms so other tabs can see them
  localStorage.setItem('meme_rooms', JSON.stringify(ROOMS));
};

// Initialize
loadData();

// Helper to decode Google JWT (Client-side only for demo)
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// --- AUTH SERVICE ---
export const authService = {
  // Called when "Continue with Google" provides a credential
  loginWithGoogle: async (credential: string): Promise<User> => {
    const payload = parseJwt(credential);
    
    if (payload) {
        // Create or Update User based on Google Data
        CURRENT_USER = {
            id: payload.sub || `google_${Date.now()}`,
            name: payload.name || 'Anonymous',
            email: payload.email || '',
            avatar: payload.picture || INITIAL_USER.avatar,
            coins: CURRENT_USER?.coins || 100, // Preserve coins if re-login
            unlockedThemes: CURRENT_USER?.unlockedThemes || ['starter']
        };
        saveData();
        return CURRENT_USER;
    }
    throw new Error("Invalid Google Token");
  },

  // Fallback Mock Login
  loginMock: async (): Promise<User> => {
    await new Promise(r => setTimeout(r, 800)); // Simulate network
    
    if (!CURRENT_USER) {
       CURRENT_USER = { ...INITIAL_USER };
    }
    saveData();
    return CURRENT_USER!;
  },

  logout: async () => {
    CURRENT_USER = null;
    localStorage.removeItem('meme_user');
    // Note: We don't clear rooms on logout so game persists
  },

  getCurrentUser: () => CURRENT_USER
};

// --- SHOP / STRIPE SERVICE ---
export const shopService = {
  buyTheme: async (themeId: string): Promise<boolean> => {
    if (!CURRENT_USER) return false;
    
    await new Promise(r => setTimeout(r, 1500)); // Simulate Stripe processing
    
    const pack = THEME_PACKS.find(p => p.id === themeId);
    if (!pack) return false;

    // Simulate successful payment logic
    if (!CURRENT_USER.unlockedThemes.includes(themeId)) {
      CURRENT_USER.unlockedThemes.push(themeId);
      saveData();
      return true;
    }
    return true;
  }
};

// --- MULTIPLAYER ROOM SERVICE ---
export const roomService = {
  createRoom: async (themeId: string): Promise<Room> => {
    await new Promise(r => setTimeout(r, 600));
    if (!CURRENT_USER) throw new Error("Not logged in");

    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newRoom: Room = {
      id: roomId,
      code: roomId,
      hostId: CURRENT_USER.id,
      players: [{
        id: CURRENT_USER.id,
        name: CURRENT_USER.name,
        avatar: CURRENT_USER.avatar,
        score: 0,
        isHost: true,
        isReady: false,
        currentCard: null
      }],
      status: 'LOBBY',
      currentRound: 1,
      maxRounds: 5,
      currentImage: null,
      themeId: themeId,
      roundCaptions: []
    };

    ROOMS[roomId] = newRoom;
    saveData(); // Save to LS
    return newRoom;
  },

  joinRoom: async (code: string): Promise<Room | null> => {
    loadData(); // Refresh data from LS in case another tab updated it
    await new Promise(r => setTimeout(r, 600));
    if (!CURRENT_USER) throw new Error("Not logged in");

    const room = ROOMS[code];
    if (!room) return null;

    // Don't join if already in
    if (!room.players.find(p => p.id === CURRENT_USER!.id)) {
       room.players.push({
        id: CURRENT_USER.id,
        name: CURRENT_USER.name,
        avatar: CURRENT_USER.avatar,
        score: 0,
        isHost: false,
        isReady: false,
        currentCard: null
      });
      saveData(); // Update LS
    }
    
    return room;
  },

  // POLLING FUNCTION
  getRoom: async (roomId: string): Promise<Room | null> => {
    loadData(); // Always fetch fresh data from LS
    return ROOMS[roomId] || null;
  },

  startGame: async (roomId: string) => {
    loadData();
    const room = ROOMS[roomId];
    if (room) {
      room.status = 'PLAYING';
      room.currentImage = getRandomImage(room.themeId);
      saveData();
    }
  },

  submitCard: async (roomId: string, playerId: string, text: string) => {
    loadData();
    const room = ROOMS[roomId];
    if (!room) return;
    
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.currentCard = { id: Math.random().toString(), text, ownerId: playerId };
      room.roundCaptions.push(player.currentCard);
    }

    // If all players submitted, move to voting
    const allSubmitted = room.players.every(p => p.currentCard !== null);
    if (allSubmitted) {
      room.status = 'VOTING';
    }
    saveData();
  },

  vote: async (roomId: string, cardId: string) => {
    loadData();
    const room = ROOMS[roomId];
    if (!room) return;

    // Find who owns the card
    const winnerCard = room.roundCaptions.find(c => c.id === cardId);
    if (winnerCard && winnerCard.ownerId) {
      const winner = room.players.find(p => p.id === winnerCard.ownerId);
      if (winner) winner.score += 1;
    }

    // Next round logic
    if (room.currentRound >= room.maxRounds) {
      room.status = 'LEADERBOARD';
    } else {
      room.currentRound++;
      room.status = 'PLAYING';
      room.currentImage = getRandomImage(room.themeId);
      room.roundCaptions = [];
      room.players.forEach(p => p.currentCard = null);
    }
    saveData();
  }
};

const getRandomImage = (themeId: string): MemeImage => {
    const pack = THEME_PACKS.find(p => p.id === themeId);
    const validIds = pack ? pack.imageIds : MEME_IMAGES.map(m => m.id);
    const images = MEME_IMAGES.filter(m => validIds.includes(m.id));
    return images[Math.floor(Math.random() * images.length)];
};

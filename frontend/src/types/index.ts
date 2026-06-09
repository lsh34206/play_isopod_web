export interface User {
  _id: string;
  username: string;
  email: string;
}

export interface Isopod {
  _id: string;
  name: string;
  species: 'armadillidium' | 'porcellio' | 'cubaris';
  level: number;
  grade: 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';
  exp: number;
  expToNextLevel: number;
  health: number;
  hunger: number;
  humidity: number;
  temperature: number;
  happiness: number;
  size: number;
  color: string;
  pattern: 'normal' | 'spotted' | 'striped' | 'albino' | 'melanistic';
  isAlive: boolean;
  canBreed: boolean;
  breedCount: number;
  sellPrice: number;
  owner: string;
  createdAt: string;
  lastFedAt: string;
}

export interface GameState {
  _id: string;
  userId: string;
  coins: number;
  gems: number;
  totalIsopods: number;
  maxIsopods: number;
  feedStock: number;
  moistureSpray: number;
  heater: number;
  cooler: number;
  totalEarned: number;
  totalSold: number;
  achievements: { id: string; name: string; description: string; unlockedAt: string }[];
  loginStreak: number;
  lastLogin: string;
}

export interface RankingEntry {
  rank: number;
  userId: string;
  username: string;
  totalIsopods: number;
  highestGrade: string;
  totalValue: number;
  topIsopodName: string;
  totalEarned: number;
}

export interface BreedingSession {
  _id: string;
  parent1Id: Isopod;
  parent2Id: Isopod;
  startTime: string;
  endTime: string;
  isComplete: boolean;
  offspring: Isopod[];
}

export interface MarketListing {
  _id: string;
  isopodId: Isopod;
  sellerId: User;
  price: number;
  listedAt: string;
  status: 'listed' | 'sold' | 'cancelled';
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'coins' | 'gems';
  type: 'food' | 'spray' | 'heater' | 'cooler' | 'slot' | 'gem';
  amount: number;
  icon: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

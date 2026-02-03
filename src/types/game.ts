import { Id } from '../../convex/_generated/dataModel'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythic' | 'unique'

export interface OwnedCreature {
  id: string                      // crypto.randomUUID()
  creatureId: Id<'creatures'>     // Convex creature._id
  stage: 'infant' | 'adult'
  growthProgress: number          // 0-100
  location: 'biome' | 'terrarium'
  biomeId: Id<'biomes'>
  fedAt?: number                  // Last feed timestamp (ms)
  acquiredAt: number              // When creature was obtained
}

export interface GameState {
  gold: number
  ownedCreatures: OwnedCreature[]
  lastOnline: number              // For offline income calculation
}

export type GameScreen =
  | 'landing'
  | 'hub'
  | 'shop'
  | 'biomes'
  | 'biome-detail'
  | 'terrarium'
  | 'settings'

export type GameAction =
  | { type: 'SET_GOLD'; amount: number }
  | { type: 'ADD_GOLD'; amount: number }
  | { type: 'SPEND_GOLD'; amount: number }
  | { type: 'ADD_CREATURE'; creature: OwnedCreature }
  | { type: 'UPDATE_CREATURE'; id: string; updates: Partial<OwnedCreature> }
  | { type: 'REMOVE_CREATURE'; id: string }
  | { type: 'FEED_CREATURE'; id: string }
  | { type: 'MOVE_TO_TERRARIUM'; id: string }
  | { type: 'UPDATE_GROWTH'; deltaMs: number }
  | { type: 'COLLECT_INCOME'; deltaMs: number }
  | { type: 'UPDATE_LAST_ONLINE' }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_STATE'; state: GameState }

export const INITIAL_GOLD = 500
export const FEED_COOLDOWN_MS = 30 * 1000 // 30 seconds
export const FEED_GROWTH_AMOUNT = 5 // 5% growth per feed
export const BASE_GROWTH_PER_MINUTE = 1 // 1% per minute base growth

// Rarity affects growth speed: rarer = slower
export const RARITY_GROWTH_MULTIPLIER: Record<Rarity, number> = {
  common: 1.0,
  uncommon: 0.8,
  rare: 0.6,
  legendary: 0.4,
  mythic: 0.25,
  unique: 0.2,
}

// Rarity affects pack drop rates (weights)
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 50,
  uncommon: 30,
  rare: 15,
  legendary: 4,
  mythic: 1,
  unique: 0, // Unique creatures cannot be obtained from packs
}

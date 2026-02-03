import { GameState, INITIAL_GOLD } from '../types/game'

const STORAGE_KEY = 'plantz_game_state'

export function getDefaultGameState(): GameState {
  return {
    gold: INITIAL_GOLD,
    ownedCreatures: [],
    lastOnline: Date.now(),
  }
}

export function saveGameState(state: GameState): void {
  try {
    const json = JSON.stringify(state)
    localStorage.setItem(STORAGE_KEY, json)
  } catch (error) {
    console.error('[Storage] Failed to save game state:', error)
  }
}

export function loadGameState(): GameState {
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    if (!json) {
      return getDefaultGameState()
    }
    const parsed = JSON.parse(json) as GameState
    // Validate required fields exist
    if (typeof parsed.gold !== 'number' || !Array.isArray(parsed.ownedCreatures)) {
      console.warn('[Storage] Invalid game state, using default')
      return getDefaultGameState()
    }
    return parsed
  } catch (error) {
    console.error('[Storage] Failed to load game state:', error)
    return getDefaultGameState()
  }
}

export function clearGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('[Storage] Failed to clear game state:', error)
  }
}

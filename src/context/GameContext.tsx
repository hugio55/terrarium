import { createContext, useContext, useReducer, useEffect, useCallback, useState, ReactNode } from 'react'
import {
  GameState,
  GameAction,
  GameScreen,
  OwnedCreature,
  FEED_COOLDOWN_MS,
  FEED_GROWTH_AMOUNT,
  BASE_GROWTH_PER_MINUTE,
  Rarity,
} from '../types/game'
import { saveGameState, loadGameState, getDefaultGameState, clearGameState } from '../utils/storage'

interface GameContextType {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  currentScreen: GameScreen
  setCurrentScreen: (screen: GameScreen) => void
  selectedBiomeId: string | null
  setSelectedBiomeId: (id: string | null) => void
  // Helper functions
  canFeed: (creature: OwnedCreature) => boolean
  getCreatureRarity: (chartCode?: string) => Rarity
  calculateIncomePerMinute: () => number
}

const GameContext = createContext<GameContextType | null>(null)

// Get rarity from chart code column (A-J common, K-P uncommon, etc.)
function getColumnRarity(col: string): Rarity {
  const idx = col.charCodeAt(0) - 65 // A=0, B=1, etc.
  if (idx <= 9) return 'common'      // A-J (0-9)
  if (idx <= 15) return 'uncommon'   // K-P (10-15)
  if (idx <= 20) return 'rare'       // Q-U (16-20)
  if (idx <= 23) return 'legendary'  // V-X (21-23)
  if (idx === 24) return 'mythic'    // Y (24)
  return 'unique'                     // Z (25)
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GOLD':
      return { ...state, gold: Math.max(0, action.amount) }

    case 'ADD_GOLD':
      return { ...state, gold: state.gold + action.amount }

    case 'SPEND_GOLD':
      if (state.gold < action.amount) return state
      return { ...state, gold: state.gold - action.amount }

    case 'ADD_CREATURE':
      return {
        ...state,
        ownedCreatures: [...state.ownedCreatures, action.creature],
      }

    case 'UPDATE_CREATURE':
      return {
        ...state,
        ownedCreatures: state.ownedCreatures.map(c =>
          c.id === action.id ? { ...c, ...action.updates } : c
        ),
      }

    case 'REMOVE_CREATURE':
      return {
        ...state,
        ownedCreatures: state.ownedCreatures.filter(c => c.id !== action.id),
      }

    case 'FEED_CREATURE': {
      const now = Date.now()
      return {
        ...state,
        ownedCreatures: state.ownedCreatures.map(c => {
          if (c.id !== action.id) return c
          // Check cooldown
          if (c.fedAt && now - c.fedAt < FEED_COOLDOWN_MS) return c
          // Add growth and set fed timestamp
          const newProgress = Math.min(100, c.growthProgress + FEED_GROWTH_AMOUNT)
          return {
            ...c,
            growthProgress: newProgress,
            fedAt: now,
            // Auto-promote to adult at 100%
            stage: newProgress >= 100 ? 'adult' : c.stage,
          }
        }),
      }
    }

    case 'MOVE_TO_TERRARIUM':
      return {
        ...state,
        ownedCreatures: state.ownedCreatures.map(c =>
          c.id === action.id && c.stage === 'adult'
            ? { ...c, location: 'terrarium' as const }
            : c
        ),
      }

    case 'UPDATE_GROWTH': {
      // Passive growth for all infant creatures in biomes
      const minutesElapsed = action.deltaMs / (1000 * 60)
      return {
        ...state,
        ownedCreatures: state.ownedCreatures.map(c => {
          if (c.stage !== 'infant' || c.location !== 'biome') return c
          // Growth is affected by rarity (rarer = slower)
          // Note: We'd need chartCode here, but we'll use a default for now
          const growthAmount = BASE_GROWTH_PER_MINUTE * minutesElapsed
          const newProgress = Math.min(100, c.growthProgress + growthAmount)
          return {
            ...c,
            growthProgress: newProgress,
            stage: newProgress >= 100 ? 'adult' : c.stage,
          }
        }),
      }
    }

    case 'COLLECT_INCOME': {
      // Only terrarium creatures generate income
      // We'll calculate actual income in the component using creature data
      return state
    }

    case 'UPDATE_LAST_ONLINE':
      return { ...state, lastOnline: Date.now() }

    case 'RESET_GAME':
      clearGameState()
      return getDefaultGameState()

    case 'LOAD_STATE':
      return action.state

    default:
      return state
  }
}

interface GameProviderProps {
  children: ReactNode
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, getDefaultGameState(), () => loadGameState())
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('landing')
  const [selectedBiomeId, setSelectedBiomeId] = useState<string | null>(null)

  // Auto-save on state changes
  useEffect(() => {
    saveGameState(state)
  }, [state])

  // Calculate offline income/growth on mount
  useEffect(() => {
    const now = Date.now()
    const offlineTime = now - state.lastOnline

    if (offlineTime > 60000) { // More than 1 minute offline
      // Update growth for time passed
      dispatch({ type: 'UPDATE_GROWTH', deltaMs: offlineTime })
    }

    // Update last online
    dispatch({ type: 'UPDATE_LAST_ONLINE' })
  }, [])

  // Growth tick every minute
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'UPDATE_GROWTH', deltaMs: 60000 }) // 1 minute
      dispatch({ type: 'UPDATE_LAST_ONLINE' })
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const canFeed = useCallback((creature: OwnedCreature): boolean => {
    if (creature.stage !== 'infant') return false
    if (!creature.fedAt) return true
    return Date.now() - creature.fedAt >= FEED_COOLDOWN_MS
  }, [])

  const getCreatureRarity = useCallback((chartCode?: string): Rarity => {
    if (!chartCode) return 'common'
    return getColumnRarity(chartCode.charAt(0))
  }, [])

  const calculateIncomePerMinute = useCallback((): number => {
    // This will be called with creature data from Convex
    // Returns total gold per minute from all terrarium creatures
    return 0 // Placeholder - actual calculation happens in components with creature data
  }, [])

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        currentScreen,
        setCurrentScreen,
        selectedBiomeId,
        setSelectedBiomeId,
        canFeed,
        getCreatureRarity,
        calculateIncomePerMinute,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

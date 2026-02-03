import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useGame } from '../context/GameContext'
import { OwnedCreature, RARITY_WEIGHTS, Rarity } from '../types/game'
import { Id } from '../../convex/_generated/dataModel'

// Get rarity from chart code column
function getColumnRarity(col: string): Rarity {
  const idx = col.charCodeAt(0) - 65
  if (idx <= 9) return 'common'
  if (idx <= 15) return 'uncommon'
  if (idx <= 20) return 'rare'
  if (idx <= 23) return 'legendary'
  if (idx === 24) return 'mythic'
  return 'unique'
}

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#ffffff',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  legendary: '#f97316',
  mythic: '#ec4899',
  unique: '#a855f7',
}

interface BiomePackProps {
  biomeId: Id<'biomes'>
  biomeName: string
  biomeColor: string
  creatures: Array<{
    _id: Id<'creatures'>
    name: string
    goldValue: number
    chartCode?: string
    imageUrl?: string
  }>
  gold: number
  onPurchase: (biomeId: Id<'biomes'>, cost: number) => void
}

function BiomePack({ biomeId, biomeName, biomeColor, creatures, gold, onPurchase }: BiomePackProps) {
  // Calculate pack cost: 50% of average goldValue
  const avgGoldValue = creatures.length > 0
    ? creatures.reduce((sum, c) => sum + c.goldValue, 0) / creatures.length
    : 100
  const packCost = Math.round(avgGoldValue * 0.5)

  // Count by rarity
  const rarityCount = creatures.reduce((acc, c) => {
    const rarity = c.chartCode ? getColumnRarity(c.chartCode.charAt(0)) : 'common'
    acc[rarity] = (acc[rarity] || 0) + 1
    return acc
  }, {} as Record<Rarity, number>)

  const canAfford = gold >= packCost

  return (
    <div style={{
      backgroundColor: 'rgba(26, 26, 46, 0.9)',
      border: `2px solid ${biomeColor}60`,
      borderRadius: '16px',
      padding: '24px',
      width: '300px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          backgroundColor: biomeColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
        }}>
          🌿
        </div>
        <div>
          <h3 style={{
            margin: 0,
            color: biomeColor,
            fontSize: '20px',
            fontWeight: 'bold',
          }}>
            {biomeName} Pack
          </h3>
          <p style={{
            margin: 0,
            color: '#888',
            fontSize: '12px',
          }}>
            {creatures.length} creature{creatures.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {/* Rarity Distribution */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        {(['common', 'uncommon', 'rare', 'legendary', 'mythic'] as Rarity[]).map(rarity => {
          const count = rarityCount[rarity] || 0
          if (count === 0) return null
          return (
            <div key={rarity} style={{
              padding: '4px 8px',
              backgroundColor: `${RARITY_COLORS[rarity]}20`,
              border: `1px solid ${RARITY_COLORS[rarity]}40`,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <span style={{ color: RARITY_COLORS[rarity], fontSize: '12px', fontWeight: 'bold' }}>
                {count}
              </span>
              <span style={{ color: '#888', fontSize: '10px', textTransform: 'capitalize' }}>
                {rarity}
              </span>
            </div>
          )
        })}
      </div>

      {/* Preview - Show some creature images */}
      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
      }}>
        {creatures.slice(0, 4).map((creature) => (
          <div key={creature._id} style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            backgroundColor: '#0f0f1a',
            border: '1px solid #333',
            overflow: 'hidden',
          }}>
            {creature.imageUrl ? (
              <img
                src={creature.imageUrl}
                alt={creature.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#555',
                fontSize: '10px',
              }}>
                ?
              </div>
            )}
          </div>
        ))}
        {creatures.length > 4 && (
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            backgroundColor: '#0f0f1a',
            border: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#888',
            fontSize: '12px',
          }}>
            +{creatures.length - 4}
          </div>
        )}
      </div>

      {/* Purchase Button */}
      <button
        onClick={() => canAfford && onPurchase(biomeId, packCost)}
        disabled={!canAfford || creatures.length === 0}
        style={{
          padding: '14px 24px',
          backgroundColor: canAfford && creatures.length > 0 ? '#ffd700' : '#555',
          color: canAfford && creatures.length > 0 ? '#1a1a2e' : '#888',
          border: 'none',
          borderRadius: '8px',
          cursor: canAfford && creatures.length > 0 ? 'pointer' : 'not-allowed',
          fontWeight: 'bold',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s',
        }}
      >
        <span>💰</span>
        <span>{packCost.toLocaleString()}</span>
      </button>

      {!canAfford && creatures.length > 0 && (
        <p style={{
          margin: 0,
          color: '#ef4444',
          fontSize: '12px',
          textAlign: 'center',
        }}>
          Need {(packCost - gold).toLocaleString()} more gold
        </p>
      )}
    </div>
  )
}

interface ShopScreenProps {
  onShowAdmin: () => void
}

export function ShopScreen({ onShowAdmin }: ShopScreenProps) {
  const { state, dispatch, setCurrentScreen } = useGame()
  const biomes = useQuery(api.biomes.list)
  const creatures = useQuery(api.creatures.list)

  const handlePurchase = (biomeId: Id<'biomes'>, cost: number) => {
    if (state.gold < cost) return

    // Get creatures for this biome
    const biomeCreatures = creatures?.filter(c => c.biomeId === biomeId) || []
    if (biomeCreatures.length === 0) return

    // Weighted random selection by rarity
    const weightedCreatures: Array<{ creature: typeof biomeCreatures[0], weight: number }> = []

    for (const creature of biomeCreatures) {
      const rarity = creature.chartCode ? getColumnRarity(creature.chartCode.charAt(0)) : 'common'
      const weight = RARITY_WEIGHTS[rarity]
      if (weight > 0) {
        weightedCreatures.push({ creature, weight })
      }
    }

    if (weightedCreatures.length === 0) return

    // Select random creature based on weights
    const totalWeight = weightedCreatures.reduce((sum, c) => sum + c.weight, 0)
    let random = Math.random() * totalWeight
    let selectedCreature = weightedCreatures[0].creature

    for (const { creature, weight } of weightedCreatures) {
      random -= weight
      if (random <= 0) {
        selectedCreature = creature
        break
      }
    }

    // Create owned creature
    const newCreature: OwnedCreature = {
      id: crypto.randomUUID(),
      creatureId: selectedCreature._id,
      stage: 'infant',
      growthProgress: 0,
      location: 'biome',
      biomeId: biomeId,
      acquiredAt: Date.now(),
    }

    // Dispatch actions
    dispatch({ type: 'SPEND_GOLD', amount: cost })
    dispatch({ type: 'ADD_CREATURE', creature: newCreature })

    // Show notification
    const rarity = selectedCreature.chartCode
      ? getColumnRarity(selectedCreature.chartCode.charAt(0))
      : 'common'
    alert(`You got a ${rarity} ${selectedCreature.name}!`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a12',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      overflow: 'auto',
    }}>
      {/* Background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'url(/bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.1,
        filter: 'blur(10px)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{
        width: '100%',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(10, 10, 18, 0.9)',
        backdropFilter: 'blur(8px)',
      }}>
        <button
          onClick={() => setCurrentScreen('hub')}
          style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          Back
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 16px',
          backgroundColor: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '8px',
        }}>
          <span style={{ fontSize: '20px' }}>💰</span>
          <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '18px' }}>
            {state.gold.toLocaleString()}
          </span>
        </div>

        <button
          onClick={onShowAdmin}
          style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(74, 222, 128, 0.1)',
            color: '#4ade80',
            border: '1px solid rgba(74, 222, 128, 0.3)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          Admin
        </button>
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '48px',
        fontWeight: '400',
        color: '#f97316',
        letterSpacing: '8px',
        marginTop: '40px',
        marginBottom: '20px',
        textTransform: 'uppercase',
        textShadow: '0 0 40px rgba(249, 115, 22, 0.3)',
        zIndex: 10,
      }}>
        Shop
      </h1>

      <p style={{
        color: '#888',
        fontSize: '16px',
        marginBottom: '40px',
        zIndex: 10,
      }}>
        Buy creature packs to grow your collection
      </p>

      {/* Biome Packs Grid */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '24px',
        justifyContent: 'center',
        padding: '0 20px 40px',
        zIndex: 10,
      }}>
        {biomes?.map(biome => {
          const biomeCreatures = creatures?.filter(c => c.biomeId === biome._id) || []
          return (
            <BiomePack
              key={biome._id}
              biomeId={biome._id}
              biomeName={biome.name}
              biomeColor={biome.color || '#4a7c59'}
              creatures={biomeCreatures}
              gold={state.gold}
              onPurchase={handlePurchase}
            />
          )
        })}
      </div>

      {(!biomes || biomes.length === 0) && (
        <p style={{
          color: '#666',
          fontSize: '16px',
          zIndex: 10,
        }}>
          No biomes available. Add biomes in the Admin panel.
        </p>
      )}

      {/* Google Fonts import */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&display=swap"
        rel="stylesheet"
      />
    </div>
  )
}

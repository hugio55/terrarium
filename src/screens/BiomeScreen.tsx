import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useGame } from '../context/GameContext'
import { OwnedCreature, FEED_COOLDOWN_MS, Rarity } from '../types/game'
import { Id } from '../../convex/_generated/dataModel'

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#ffffff',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  legendary: '#f97316',
  mythic: '#ec4899',
  unique: '#a855f7',
}

function getColumnRarity(col: string): Rarity {
  const idx = col.charCodeAt(0) - 65
  if (idx <= 9) return 'common'
  if (idx <= 15) return 'uncommon'
  if (idx <= 20) return 'rare'
  if (idx <= 23) return 'legendary'
  if (idx === 24) return 'mythic'
  return 'unique'
}

interface InfantCreatureProps {
  owned: OwnedCreature
  creatureData: {
    _id: Id<'creatures'>
    name: string
    chartCode?: string
    imageUrl?: string
    goldPerMinute: number
  }
  canFeed: boolean
  onFeed: () => void
  onMoveToTerrarium: () => void
}

function InfantCreature({ owned, creatureData, canFeed, onFeed, onMoveToTerrarium }: InfantCreatureProps) {
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const rarity = creatureData.chartCode ? getColumnRarity(creatureData.chartCode.charAt(0)) : 'common'
  const rarityColor = RARITY_COLORS[rarity]

  // Update cooldown timer
  useEffect(() => {
    const updateCooldown = () => {
      if (owned.fedAt) {
        const remaining = Math.max(0, FEED_COOLDOWN_MS - (Date.now() - owned.fedAt))
        setCooldownRemaining(remaining)
      } else {
        setCooldownRemaining(0)
      }
    }

    updateCooldown()
    const interval = setInterval(updateCooldown, 1000)
    return () => clearInterval(interval)
  }, [owned.fedAt])

  const isAdult = owned.stage === 'adult'
  const progressPercent = Math.min(100, owned.growthProgress)

  return (
    <div style={{
      backgroundColor: 'rgba(26, 26, 46, 0.9)',
      border: `2px solid ${rarityColor}40`,
      borderRadius: '16px',
      padding: '20px',
      width: '220px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
    }}>
      {/* Creature Image */}
      <div style={{
        width: '100px',
        height: '100px',
        borderRadius: '12px',
        backgroundColor: '#0f0f1a',
        border: `2px solid ${rarityColor}60`,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {creatureData.imageUrl ? (
          <img
            src={creatureData.imageUrl}
            alt={creatureData.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: isAdult ? 'none' : 'grayscale(30%)',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#555',
            fontSize: '32px',
          }}>
            ?
          </div>
        )}
        {isAdult && (
          <div style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            backgroundColor: '#4ade80',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#1a1a2e',
          }}>
            READY
          </div>
        )}
      </div>

      {/* Name */}
      <h3 style={{
        margin: 0,
        color: '#fff',
        fontSize: '16px',
        fontWeight: 'bold',
        textAlign: 'center',
      }}>
        {creatureData.name}
      </h3>

      {/* Rarity */}
      <span style={{
        color: rarityColor,
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'capitalize',
      }}>
        {rarity}
      </span>

      {/* Progress Bar */}
      {!isAdult && (
        <div style={{
          width: '100%',
          height: '20px',
          backgroundColor: '#0f0f1a',
          borderRadius: '10px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            backgroundColor: progressPercent >= 100 ? '#4ade80' : '#6366f1',
            transition: 'width 0.3s ease',
          }} />
          <span style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 'bold',
          }}>
            {Math.floor(progressPercent)}%
          </span>
        </div>
      )}

      {/* Actions */}
      {isAdult ? (
        <button
          onClick={onMoveToTerrarium}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#4ade80',
            color: '#1a1a2e',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'all 0.2s',
          }}
        >
          Move to Terrarium
        </button>
      ) : (
        <button
          onClick={onFeed}
          disabled={!canFeed}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: canFeed ? '#ffd700' : '#333',
            color: canFeed ? '#1a1a2e' : '#666',
            border: 'none',
            borderRadius: '8px',
            cursor: canFeed ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'all 0.2s',
          }}
        >
          {cooldownRemaining > 0
            ? `Feed (${Math.ceil(cooldownRemaining / 1000)}s)`
            : 'Feed (+5%)'
          }
        </button>
      )}

      {/* Income preview */}
      <span style={{
        color: '#ffd700',
        fontSize: '11px',
      }}>
        💰 {creatureData.goldPerMinute}/min when adult
      </span>
    </div>
  )
}

interface BiomeListProps {
  onSelectBiome: (biomeId: Id<'biomes'>) => void
}

function BiomeList({ onSelectBiome }: BiomeListProps) {
  const { state } = useGame()
  const biomes = useQuery(api.biomes.list)

  // Count creatures per biome
  const creaturesByBiome = state.ownedCreatures.reduce((acc, c) => {
    if (c.location === 'biome') {
      acc[c.biomeId] = (acc[c.biomeId] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  // Count adults ready per biome
  const adultsByBiome = state.ownedCreatures.reduce((acc, c) => {
    if (c.location === 'biome' && c.stage === 'adult') {
      acc[c.biomeId] = (acc[c.biomeId] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '20px',
      justifyContent: 'center',
      padding: '20px',
    }}>
      {biomes?.map(biome => {
        const count = creaturesByBiome[biome._id] || 0
        const adultCount = adultsByBiome[biome._id] || 0

        return (
          <button
            key={biome._id}
            onClick={() => onSelectBiome(biome._id)}
            style={{
              width: '200px',
              height: '120px',
              backgroundColor: 'rgba(26, 26, 46, 0.9)',
              border: `2px solid ${biome.color || '#4a7c59'}60`,
              borderRadius: '12px',
              cursor: 'pointer',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              position: 'relative',
              transition: 'all 0.2s',
            }}
          >
            {/* Badge for ready creatures */}
            {adultCount > 0 && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#4ade80',
                color: '#1a1a2e',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
              }}>
                {adultCount}
              </div>
            )}

            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: biome.color || '#4a7c59',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              🌿
            </div>

            <h3 style={{
              margin: 0,
              color: biome.color || '#4a7c59',
              fontSize: '16px',
              fontWeight: 'bold',
            }}>
              {biome.name}
            </h3>

            <span style={{
              color: count > 0 ? '#fff' : '#666',
              fontSize: '12px',
            }}>
              {count} creature{count !== 1 ? 's' : ''}
            </span>
          </button>
        )
      })}

      {(!biomes || biomes.length === 0) && (
        <p style={{ color: '#666' }}>No biomes available</p>
      )}
    </div>
  )
}

interface BiomeDetailProps {
  biomeId: Id<'biomes'>
  onBack: () => void
}

function BiomeDetail({ biomeId, onBack }: BiomeDetailProps) {
  const { state, dispatch, canFeed } = useGame()
  const biomes = useQuery(api.biomes.list)
  const creatures = useQuery(api.creatures.list)

  const biome = biomes?.find(b => b._id === biomeId)
  const biomeCreatures = state.ownedCreatures.filter(
    c => c.biomeId === biomeId && c.location === 'biome'
  )

  const handleFeed = (creatureId: string) => {
    dispatch({ type: 'FEED_CREATURE', id: creatureId })
  }

  const handleMoveToTerrarium = (creatureId: string) => {
    dispatch({ type: 'MOVE_TO_TERRARIUM', id: creatureId })
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
    }}>
      {/* Biome Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '40px',
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ← All Biomes
        </button>

        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          backgroundColor: biome?.color || '#4a7c59',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
        }}>
          🌿
        </div>

        <h2 style={{
          margin: 0,
          color: biome?.color || '#4a7c59',
          fontSize: '32px',
          fontWeight: 'bold',
        }}>
          {biome?.name || 'Unknown Biome'}
        </h2>
      </div>

      {/* Creatures Grid */}
      {biomeCreatures.length > 0 ? (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'center',
          padding: '0 20px 40px',
        }}>
          {biomeCreatures.map(owned => {
            const creatureData = creatures?.find(c => c._id === owned.creatureId)
            if (!creatureData) return null

            return (
              <InfantCreature
                key={owned.id}
                owned={owned}
                creatureData={creatureData}
                canFeed={canFeed(owned)}
                onFeed={() => handleFeed(owned.id)}
                onMoveToTerrarium={() => handleMoveToTerrarium(owned.id)}
              />
            )
          })}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
        }}>
          <p style={{ color: '#666', fontSize: '18px', marginBottom: '8px' }}>
            No creatures in this biome yet
          </p>
          <p style={{ color: '#555', fontSize: '14px' }}>
            Buy packs from the Shop to get started
          </p>
        </div>
      )}
    </div>
  )
}

interface BiomeScreenProps {
  onShowAdmin: () => void
}

export function BiomeScreen({ onShowAdmin }: BiomeScreenProps) {
  const { state, setCurrentScreen, selectedBiomeId, setSelectedBiomeId } = useGame()

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
          onClick={() => {
            if (selectedBiomeId) {
              setSelectedBiomeId(null)
            } else {
              setCurrentScreen('hub')
            }
          }}
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
      {!selectedBiomeId && (
        <>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '48px',
            fontWeight: '400',
            color: '#4ade80',
            letterSpacing: '8px',
            marginTop: '40px',
            marginBottom: '20px',
            textTransform: 'uppercase',
            textShadow: '0 0 40px rgba(74, 222, 128, 0.3)',
            zIndex: 10,
          }}>
            Biomes
          </h1>

          <p style={{
            color: '#888',
            fontSize: '16px',
            marginBottom: '40px',
            zIndex: 10,
          }}>
            Select a biome to view and raise your creatures
          </p>
        </>
      )}

      {/* Content */}
      <div style={{ zIndex: 10, width: '100%' }}>
        {selectedBiomeId ? (
          <BiomeDetail
            biomeId={selectedBiomeId as Id<'biomes'>}
            onBack={() => setSelectedBiomeId(null)}
          />
        ) : (
          <BiomeList onSelectBiome={(id) => setSelectedBiomeId(id)} />
        )}
      </div>

      {/* Google Fonts import */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&display=swap"
        rel="stylesheet"
      />
    </div>
  )
}

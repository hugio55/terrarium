import { useGame } from '../context/GameContext'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

interface NavigationTileProps {
  title: string
  icon: string
  description: string
  onClick: () => void
  badge?: number
  color?: string
}

function NavigationTile({ title, icon, description, onClick, badge, color = '#4ade80' }: NavigationTileProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        width: '280px',
        height: '180px',
        backgroundColor: 'rgba(26, 26, 46, 0.9)',
        border: `2px solid ${color}40`,
        borderRadius: '16px',
        cursor: 'pointer',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        transition: 'all 0.2s ease',
        boxShadow: `0 4px 20px ${color}20`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = `0 8px 30px ${color}40`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${color}40`
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = `0 4px 20px ${color}20`
      }}
    >
      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          backgroundColor: '#ef4444',
          color: '#fff',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {badge > 99 ? '99+' : badge}
        </div>
      )}

      {/* Icon */}
      <span style={{ fontSize: '48px' }}>{icon}</span>

      {/* Title */}
      <h3 style={{
        margin: 0,
        color: color,
        fontSize: '24px',
        fontWeight: 'bold',
        letterSpacing: '2px',
      }}>
        {title}
      </h3>

      {/* Description */}
      <p style={{
        margin: 0,
        color: '#888',
        fontSize: '12px',
        textAlign: 'center',
      }}>
        {description}
      </p>
    </button>
  )
}

interface GoldDisplayProps {
  gold: number
  incomePerMinute?: number
}

function GoldDisplay({ gold, incomePerMinute }: GoldDisplayProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 24px',
      backgroundColor: 'rgba(255, 215, 0, 0.1)',
      border: '2px solid rgba(255, 215, 0, 0.3)',
      borderRadius: '12px',
    }}>
      <span style={{ fontSize: '32px' }}>💰</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{
          color: '#ffd700',
          fontWeight: 'bold',
          fontSize: '28px',
          lineHeight: 1,
        }}>
          {gold.toLocaleString()}
        </span>
        {incomePerMinute !== undefined && incomePerMinute > 0 && (
          <span style={{
            color: '#4ade80',
            fontSize: '12px',
          }}>
            +{incomePerMinute}/min
          </span>
        )}
      </div>
    </div>
  )
}

interface NavigationHubProps {
  onShowAdmin: () => void
}

export function NavigationHub({ onShowAdmin }: NavigationHubProps) {
  const { state, setCurrentScreen } = useGame()
  const creatures = useQuery(api.creatures.list)

  // Count creatures by location
  const biomeCreatures = state.ownedCreatures.filter(c => c.location === 'biome')
  const terrariumCreatures = state.ownedCreatures.filter(c => c.location === 'terrarium')
  const adultInBiome = biomeCreatures.filter(c => c.stage === 'adult').length

  // Calculate income per minute from terrarium creatures
  const incomePerMinute = terrariumCreatures.reduce((total, owned) => {
    const creatureData = creatures?.find(c => c._id === owned.creatureId)
    return total + (creatureData?.goldPerMinute || 0)
  }, 0)

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a12',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background */}
      <div style={{
        position: 'absolute',
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
      }}>
        {/* Back to Landing */}
        <button
          onClick={() => setCurrentScreen('landing')}
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

        {/* Gold Display */}
        <GoldDisplay gold={state.gold} incomePerMinute={incomePerMinute} />

        {/* Admin Button */}
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
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(74, 222, 128, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(74, 222, 128, 0.1)'
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
        color: '#e8e8e8',
        letterSpacing: '8px',
        marginTop: '40px',
        marginBottom: '60px',
        textTransform: 'uppercase',
        textShadow: '0 0 40px rgba(74, 124, 89, 0.3)',
        zIndex: 10,
      }}>
        Chillarium
      </h1>

      {/* Navigation Tiles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '24px',
        zIndex: 10,
      }}>
        <NavigationTile
          title="Shop"
          icon="🛒"
          description="Buy creature packs"
          onClick={() => setCurrentScreen('shop')}
          color="#f97316"
        />

        <NavigationTile
          title="Biomes"
          icon="🌿"
          description="Raise your creatures"
          onClick={() => setCurrentScreen('biomes')}
          badge={adultInBiome}
          color="#4ade80"
        />

        <NavigationTile
          title="Terrarium"
          icon="🏠"
          description="View your collection"
          onClick={() => setCurrentScreen('terrarium')}
          badge={terrariumCreatures.length}
          color="#60a5fa"
        />

        <NavigationTile
          title="Settings"
          icon="⚙️"
          description="Game options"
          onClick={() => setCurrentScreen('settings')}
          color="#9ca3af"
        />
      </div>

      {/* Stats Summary */}
      <div style={{
        marginTop: '60px',
        padding: '20px 40px',
        backgroundColor: 'rgba(26, 26, 46, 0.8)',
        borderRadius: '12px',
        display: 'flex',
        gap: '40px',
        zIndex: 10,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Growing</div>
          <div style={{ color: '#4ade80', fontSize: '24px', fontWeight: 'bold' }}>
            {biomeCreatures.filter(c => c.stage === 'infant').length}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Ready</div>
          <div style={{ color: '#f97316', fontSize: '24px', fontWeight: 'bold' }}>
            {adultInBiome}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>In Terrarium</div>
          <div style={{ color: '#60a5fa', fontSize: '24px', fontWeight: 'bold' }}>
            {terrariumCreatures.length}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Total</div>
          <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
            {state.ownedCreatures.length}
          </div>
        </div>
      </div>

      {/* Google Fonts import */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&display=swap"
        rel="stylesheet"
      />
    </div>
  )
}

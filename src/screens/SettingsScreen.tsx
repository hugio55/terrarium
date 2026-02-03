import { useState } from 'react'
import { useGame } from '../context/GameContext'

interface SettingsScreenProps {
  onShowAdmin: () => void
}

export function SettingsScreen({ onShowAdmin }: SettingsScreenProps) {
  const { state, dispatch, setCurrentScreen } = useGame()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [muteMusic, setMuteMusic] = useState(false)
  const [blastIt, setBlastIt] = useState(false)

  const handleReset = () => {
    dispatch({ type: 'RESET_GAME' })
    setShowResetConfirm(false)
    setCurrentScreen('landing')
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
        color: '#9ca3af',
        letterSpacing: '8px',
        marginTop: '40px',
        marginBottom: '60px',
        textTransform: 'uppercase',
        textShadow: '0 0 40px rgba(156, 163, 175, 0.3)',
        zIndex: 10,
      }}>
        Settings
      </h1>

      {/* Settings Card */}
      <div style={{
        backgroundColor: 'rgba(26, 26, 46, 0.9)',
        border: '2px solid rgba(156, 163, 175, 0.3)',
        borderRadius: '16px',
        padding: '32px',
        width: '400px',
        maxWidth: '90%',
        zIndex: 10,
      }}>
        {/* Game Stats */}
        <div style={{
          marginBottom: '32px',
          padding: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
        }}>
          <h3 style={{
            color: '#888',
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '16px',
          }}>
            Game Stats
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>Gold</span>
              <span style={{ color: '#ffd700', fontWeight: 'bold' }}>
                {state.gold.toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>Total Creatures</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>
                {state.ownedCreatures.length}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>In Biomes</span>
              <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
                {state.ownedCreatures.filter(c => c.location === 'biome').length}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>In Terrarium</span>
              <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>
                {state.ownedCreatures.filter(c => c.location === 'terrarium').length}
              </span>
            </div>
          </div>
        </div>

        {/* Sound Settings */}
        <div style={{
          marginBottom: '32px',
          padding: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
        }}>
          <h3 style={{
            color: '#888',
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '16px',
          }}>
            Sound
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={muteMusic}
                onChange={(e) => {
                  setMuteMusic(e.target.checked)
                  if (e.target.checked) setBlastIt(false)
                }}
                style={{
                  width: '20px',
                  height: '20px',
                  accentColor: '#ef4444',
                  cursor: 'pointer',
                }}
              />
              <span style={{ color: '#fff', fontSize: '14px' }}>
                Oh my god, wtf is this music, stfu.
              </span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={blastIt}
                onChange={(e) => {
                  setBlastIt(e.target.checked)
                  if (e.target.checked) setMuteMusic(false)
                }}
                style={{
                  width: '20px',
                  height: '20px',
                  accentColor: '#4ade80',
                  cursor: 'pointer',
                }}
              />
              <span style={{ color: '#fff', fontSize: '14px' }}>
                Holy shit, this soundtrack SLAPS. BLAST IT
              </span>
            </label>
          </div>
        </div>

        {/* Reset Button */}
        <div>
          <h3 style={{
            color: '#888',
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '16px',
          }}>
            Danger Zone
          </h3>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                border: '2px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'all 0.2s',
              }}
            >
              Reset Game
            </button>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <p style={{
                color: '#ef4444',
                fontSize: '14px',
                textAlign: 'center',
                margin: 0,
              }}>
                Are you sure? This will delete all progress!
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  Yes, Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Version Info */}
      <p style={{
        marginTop: '40px',
        color: '#444',
        fontSize: '12px',
        zIndex: 10,
      }}>
        Chillarium v0.1.0
      </p>

      {/* Google Fonts import */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&display=swap"
        rel="stylesheet"
      />
    </div>
  )
}

import { useState } from 'react'
import { Admin } from './components/Admin'

function App() {
  const [showAdmin, setShowAdmin] = useState(false)

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a12',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow effect */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(74, 124, 89, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Admin Button */}
      <button
        onClick={() => setShowAdmin(true)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '10px 20px',
          backgroundColor: 'rgba(74, 222, 128, 0.1)',
          color: '#4ade80',
          border: '1px solid rgba(74, 222, 128, 0.3)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '14px',
          zIndex: 100,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(74, 222, 128, 0.2)'
          e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(74, 222, 128, 0.1)'
          e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.3)'
        }}
      >
        Admin
      </button>

      {/* Admin Panel */}
      {showAdmin && <Admin onClose={() => setShowAdmin(false)} />}

      {/* Title */}
      <h1 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '72px',
        fontWeight: '400',
        color: '#e8e8e8',
        letterSpacing: '12px',
        marginBottom: '8px',
        textTransform: 'uppercase',
        textShadow: '0 0 40px rgba(74, 124, 89, 0.3)',
      }}>
        Terrarium
      </h1>

      {/* Subtitle */}
      <p style={{
        fontFamily: "'Georgia', serif",
        fontSize: '16px',
        color: '#666',
        letterSpacing: '4px',
        marginBottom: '60px',
        textTransform: 'uppercase',
      }}>
        By Harald Studios
      </p>

      {/* Terrarium Visual */}
      <div style={{
        position: 'relative',
        width: '320px',
        height: '380px',
      }}>
        {/* Glass dome */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '280px',
          height: '300px',
          borderRadius: '50% 50% 10% 10%',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.05) 100%)',
          border: '2px solid rgba(255,255,255,0.1)',
          boxShadow: `
            inset 0 0 60px rgba(74, 124, 89, 0.1),
            0 0 40px rgba(74, 124, 89, 0.1),
            inset -20px -20px 60px rgba(255,255,255,0.02)
          `,
          overflow: 'hidden',
        }}>
          {/* Glass reflection */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '30px',
            width: '80px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%)',
            transform: 'rotate(-20deg)',
          }} />

          {/* Dirt/soil layer */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '80px',
            background: 'linear-gradient(to bottom, #3d2817 0%, #2a1a0f 100%)',
            borderRadius: '0 0 10% 10%',
          }}>
            {/* Soil texture dots */}
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: '#4a3020',
                left: `${15 + (i % 6) * 15}%`,
                top: `${20 + Math.floor(i / 6) * 30}%`,
              }} />
            ))}
          </div>

          {/* Moss layer */}
          <div style={{
            position: 'absolute',
            bottom: '70px',
            left: '20px',
            right: '20px',
            height: '25px',
            background: 'linear-gradient(to bottom, #4a7c59 0%, #3d5c45 100%)',
            borderRadius: '50% 50% 0 0',
          }} />

          {/* Plant 1 - Fern left */}
          <div style={{
            position: 'absolute',
            bottom: '85px',
            left: '50px',
            width: '40px',
            height: '80px',
          }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                bottom: '0',
                left: '50%',
                width: '3px',
                height: `${30 + i * 10}px`,
                backgroundColor: '#5a9c6a',
                transformOrigin: 'bottom center',
                transform: `translateX(-50%) rotate(${-30 + i * 15}deg)`,
                borderRadius: '2px',
              }} />
            ))}
          </div>

          {/* Plant 2 - Center succulent */}
          <div style={{
            position: 'absolute',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                bottom: '0',
                left: '50%',
                width: '12px',
                height: '35px',
                backgroundColor: i % 2 === 0 ? '#6aaa7a' : '#5a9a6a',
                transformOrigin: 'bottom center',
                transform: `translateX(-50%) rotate(${i * 45}deg)`,
                borderRadius: '50% 50% 0 0',
              }} />
            ))}
          </div>

          {/* Plant 3 - Right tall grass */}
          <div style={{
            position: 'absolute',
            bottom: '85px',
            right: '45px',
            width: '30px',
            height: '100px',
          }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                bottom: '0',
                left: '50%',
                width: '2px',
                height: `${50 + i * 12}px`,
                backgroundColor: '#7ab88a',
                transformOrigin: 'bottom center',
                transform: `translateX(-50%) rotate(${-10 + i * 7}deg)`,
                borderRadius: '2px',
              }} />
            ))}
          </div>

          {/* Small rocks */}
          <div style={{
            position: 'absolute',
            bottom: '75px',
            left: '80px',
            width: '15px',
            height: '10px',
            backgroundColor: '#555',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '73px',
            right: '70px',
            width: '12px',
            height: '8px',
            backgroundColor: '#666',
            borderRadius: '50%',
          }} />
        </div>

        {/* Wooden base */}
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '300px',
          height: '60px',
          background: 'linear-gradient(to bottom, #5c4033 0%, #3d2a22 50%, #2d1f18 100%)',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          {/* Wood grain lines */}
          <div style={{
            position: 'absolute',
            top: '15px',
            left: '20px',
            right: '20px',
            height: '2px',
            backgroundColor: 'rgba(0,0,0,0.2)',
          }} />
          <div style={{
            position: 'absolute',
            top: '35px',
            left: '40px',
            right: '40px',
            height: '1px',
            backgroundColor: 'rgba(0,0,0,0.15)',
          }} />
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

export default App

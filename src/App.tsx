import { useState, useEffect, useRef } from 'react'
import { Admin } from './components/Admin'

type GameScreen = 'landing' | 'game'

// Trail particle type
type TrailParticle = {
  id: number
  x: number
  y: number
  spawnTime: number
  isExplosion?: boolean
  angle?: number
}

// Single firefly with trail that follows its path and is attracted to mouse
function Firefly({
  direction,
  startY,
  duration,
  mousePosRef,
  isMouseInWindowRef,
  onCaught
}: {
  direction: 'left' | 'right'
  startY: number
  duration: number
  mousePosRef: React.MutableRefObject<{ x: number, y: number }>
  isMouseInWindowRef: React.MutableRefObject<boolean>
  onCaught: () => void
}) {
  const [particles, setParticles] = useState<TrailParticle[]>([])
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)
  const [opacity, setOpacity] = useState(1)
  const [renderTick, setRenderTick] = useState(0)
  const posRef = useRef({
    x: direction === 'left' ? -20 : (typeof window !== 'undefined' ? window.innerWidth + 20 : 1000),
    y: (startY / 100) * (typeof window !== 'undefined' ? window.innerHeight : 800)
  })
  const particleIdRef = useRef(0)
  const particleLifetime = 2500
  const explosionLifetime = 1500
  const wobbleRef = useRef(0)
  const movingRightRef = useRef(direction === 'left')

  useEffect(() => {
    if (!isVisible) return

    // Reduced speed by 2x for slower, floaty movement
    const speed = (window.innerWidth + 40) / (duration * 60) * 0.5
    let animationId: number

    const animate = () => {
      wobbleRef.current += 0.05
      const wobbleY = Math.sin(wobbleRef.current) * 18

      const prev = posRef.current
      const mousePos = mousePosRef.current
      const isMouseInWindow = isMouseInWindowRef.current
      let newX = prev.x
      let newY = prev.y

      if (isMouseInWindow) {
        const dx = mousePos.x - prev.x
        const dy = mousePos.y - prev.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        // Check if caught by mouse
        if (dist < 15 && !isFading) {
          // Spawn explosion particles
          const explosionParticles: TrailParticle[] = []
          for (let i = 0; i < 12; i++) {
            explosionParticles.push({
              id: particleIdRef.current++,
              x: prev.x,
              y: prev.y,
              spawnTime: Date.now(),
              isExplosion: true,
              angle: (i / 12) * Math.PI * 2,
            })
          }
          setParticles(p => [...p, ...explosionParticles])

          // Start fade out animation instead of instant disappear
          setIsFading(true)
          let fadeOpacity = 1
          const fadeInterval = setInterval(() => {
            fadeOpacity -= 0.05
            setOpacity(Math.max(0, fadeOpacity))
            if (fadeOpacity <= 0) {
              clearInterval(fadeInterval)
              setIsVisible(false)
              onCaught()
            }
          }, 50)
          return
        }

        if (dist > 5) {
          const attractSpeed = 1.5 // Reduced from 3 for slower, floaty movement
          newX = prev.x + (dx / dist) * attractSpeed
          newY = prev.y + (dy / dist) * attractSpeed + wobbleY * 0.1
          movingRightRef.current = dx > 0
        }
      } else {
        if (direction === 'left') {
          newX = prev.x + speed
          movingRightRef.current = true
        } else {
          newX = prev.x - speed
          movingRightRef.current = false
        }
        newY = (startY / 100) * window.innerHeight + wobbleY
      }

      posRef.current = { x: newX, y: newY }
      setRenderTick(t => t + 1)

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    // Spawn trail particles - increased density (25ms instead of 50ms)
    const spawnInterval = setInterval(() => {
      if (isVisible && !isFading) {
        setParticles(prev => [...prev, {
          id: particleIdRef.current++,
          x: posRef.current.x,
          y: posRef.current.y,
          spawnTime: Date.now(),
        }])
      }
    }, 25)

    // Clean up old particles
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      setParticles(prev => prev.filter(p => {
        const lifetime = p.isExplosion ? explosionLifetime : particleLifetime
        return now - p.spawnTime < lifetime
      }))
    }, 100)

    return () => {
      cancelAnimationFrame(animationId)
      clearInterval(spawnInterval)
      clearInterval(cleanupInterval)
    }
  }, [direction, duration, startY, isVisible, isFading, onCaught, mousePosRef, isMouseInWindowRef])

  const pos = posRef.current
  const movingRight = movingRightRef.current

  return (
    <>
      {/* Trail and explosion particles */}
      {particles.map(particle => {
        const age = Date.now() - particle.spawnTime

        if (particle.isExplosion) {
          // Explosion particle
          const progress = age / explosionLifetime
          const opacity = Math.max(0, 1 * (1 - progress))
          const dist = progress * 60
          const x = particle.x + Math.cos(particle.angle!) * dist
          const y = particle.y + Math.sin(particle.angle!) * dist
          const size = Math.max(1, 4 * (1 - progress * 0.7))
          const blur = progress * 3

          return (
            <div
              key={particle.id}
              style={{
                position: 'fixed',
                left: x,
                top: y,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                backgroundColor: `rgba(255, 255, 100, ${opacity})`,
                boxShadow: `0 0 ${8 - progress * 6}px ${4 - progress * 3}px rgba(255, 255, 100, ${opacity * 0.8})`,
                filter: `blur(${blur}px)`,
                pointerEvents: 'none',
                zIndex: 2,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )
        }

        // Normal trail particle
        const progress = age / particleLifetime
        const opacity = Math.max(0, 0.6 * (1 - progress))
        const blur = 1 + progress * 4
        const size = Math.max(1, 3 * (1 - progress * 0.5))
        const drift = movingRight ? -progress * 20 : progress * 20
        const verticalDrift = Math.sin(particle.id * 0.5) * progress * 8

        return (
          <div
            key={particle.id}
            style={{
              position: 'fixed',
              left: particle.x + drift,
              top: particle.y + verticalDrift,
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              backgroundColor: `rgba(255, 255, ${150 + progress * 50}, ${opacity})`,
              filter: `blur(${blur}px)`,
              pointerEvents: 'none',
              zIndex: 1,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )
      })}

      {/* Firefly */}
      {isVisible && (
        <div
          style={{
            position: 'fixed',
            left: pos.x,
            top: pos.y,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 1,
            opacity: opacity,
            transition: 'opacity 0.1s ease-out',
          }}
        >
          <div
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 150, 1)',
              animation: isFading ? 'none' : 'firefly-glow 1.5s ease-in-out infinite',
              boxShadow: `0 0 ${6 * opacity}px ${3 * opacity}px rgba(255, 255, 100, ${0.6 * opacity})`,
            }}
          />
        </div>
      )}
    </>
  )
}

// Lightning bug manager component
function LightningBug() {
  const [bugs, setBugs] = useState<Array<{
    id: number
    direction: 'left' | 'right'
    startY: number
    duration: number
  }>>([])
  const mousePosRef = useRef({ x: 0, y: 0 })
  const isMouseInWindowRef = useRef(false)

  // Track mouse position with refs (no re-renders)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseEnter = () => { isMouseInWindowRef.current = true }
    const handleMouseLeave = () => { isMouseInWindowRef.current = false }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseenter', handleMouseEnter)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseenter', handleMouseEnter)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  useEffect(() => {
    let bugId = 0

    const spawnBug = () => {
      const newBug = {
        id: bugId++,
        direction: Math.random() > 0.5 ? 'left' as const : 'right' as const,
        startY: 20 + Math.random() * 50,
        duration: 25 + Math.random() * 15, // Increased duration since they move slower now
      }

      setBugs(prev => [...prev, newBug])

      setTimeout(() => {
        setBugs(prev => prev.filter(b => b.id !== newBug.id))
      }, newBug.duration * 1000 + 500)
    }

    // Spawn more frequently (every 3-6 seconds instead of 8-15)
    const initialTimeout = setTimeout(spawnBug, 1000)
    const spawnInterval = 3000 + Math.random() * 3000
    const interval = setInterval(() => {
      spawnBug()
    }, spawnInterval)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [])

  const removeBug = (id: number) => {
    setBugs(prev => prev.filter(b => b.id !== id))
  }

  return (
    <>
      <style>{`
        @keyframes firefly-glow {
          0%, 100% { opacity: 0.4; box-shadow: 0 0 3px 1px rgba(255, 255, 100, 0.5); }
          20% { opacity: 1; box-shadow: 0 0 8px 4px rgba(255, 255, 100, 0.9), 0 0 12px 6px rgba(255, 255, 50, 0.5); }
          35% { opacity: 0.3; box-shadow: 0 0 3px 1px rgba(255, 255, 100, 0.4); }
          55% { opacity: 1; box-shadow: 0 0 10px 5px rgba(200, 255, 100, 1), 0 0 15px 8px rgba(200, 255, 50, 0.5); }
          70% { opacity: 0.4; box-shadow: 0 0 3px 1px rgba(255, 255, 100, 0.5); }
          85% { opacity: 0.9; box-shadow: 0 0 6px 3px rgba(255, 255, 100, 0.8); }
        }
      `}</style>
      {bugs.map(bug => (
        <Firefly
          key={bug.id}
          direction={bug.direction}
          startY={bug.startY}
          duration={bug.duration}
          mousePosRef={mousePosRef}
          isMouseInWindowRef={isMouseInWindowRef}
          onCaught={() => removeBug(bug.id)}
        />
      ))}
    </>
  )
}

function App() {
  const [showAdmin, setShowAdmin] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('landing')

  // Monster position state
  const [monsterPos, setMonsterPos] = useState({ x: 50, y: 45 })
  const [monsterTarget, setMonsterTarget] = useState({ x: 60, y: 50 })
  const [monsterStartPos, setMonsterStartPos] = useState({ x: 50, y: 45 })
  const [monsterFacingRight, setMonsterFacingRight] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  // Use refs for smooth animation values (avoids React state batching/stepping)
  const walkCycleRef = useRef(0)
  const speedFactorRef = useRef(0.15)

  // Force re-render for walk animation (triggered by position changes)
  const [, forceRender] = useState(0)

  // Refs to avoid stale closures in animation loop
  const targetRef = useRef(monsterTarget)
  const pausedRef = useRef(isPaused)
  const posRef = useRef(monsterPos)
  const startPosRef = useRef(monsterStartPos)

  useEffect(() => { targetRef.current = monsterTarget }, [monsterTarget])
  useEffect(() => { pausedRef.current = isPaused }, [isPaused])
  useEffect(() => { posRef.current = monsterPos }, [monsterPos])
  useEffect(() => { startPosRef.current = monsterStartPos }, [monsterStartPos])

  // Monster wandering effect with requestAnimationFrame for 60 FPS
  useEffect(() => {
    if (currentScreen !== 'game') return

    let animationId: number
    let lastTime = performance.now()

    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 16.67 // Normalize to 60fps
      lastTime = currentTime

      if (!pausedRef.current) {
        const prev = posRef.current
        const target = targetRef.current
        const dx = target.x - prev.x
        const dy = target.y - prev.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Check if reached target
        if (distance < 0.5) {
          // Don't abruptly set to 0 - let the decay handle smooth stop
          setIsPaused(true)

          // Pause for 1-2 seconds, then pick new target
          setTimeout(() => {
            const currentPos = posRef.current

            // Generate target with minimum distance requirement
            const minDistance = 15
            let newTarget = { x: 0, y: 0 }
            let attempts = 0

            do {
              // Calculate fence bounds with perspective (narrower at top, wider at bottom)
              // At y=30 (far/top): x range 38-62
              // At y=60 (near/bottom): x range 25-75
              const newY = 30 + Math.random() * 30 // y: 30-60
              const yFactor = (newY - 30) / 30 // 0 at top, 1 at bottom
              const minX = 38 - yFactor * 13 // 38 at top, 25 at bottom
              const maxX = 62 + yFactor * 13 // 62 at top, 75 at bottom
              const newX = minX + Math.random() * (maxX - minX)

              newTarget = { x: newX, y: newY }
              attempts++
            } while (
              Math.sqrt(Math.pow(newTarget.x - currentPos.x, 2) + Math.pow(newTarget.y - currentPos.y, 2)) < minDistance
              && attempts < 20
            )
            const newDx = newTarget.x - currentPos.x
            if (Math.abs(newDx) > 0.1) {
              setMonsterFacingRight(newDx > 0)
            }
            setMonsterStartPos({ ...currentPos }) // Save start position for acceleration
            setMonsterTarget(newTarget)
            setIsPaused(false)
          }, 1000 + Math.random() * 1000)
        } else {
          // Calculate distance traveled from start (for acceleration)
          const startPos = startPosRef.current
          const distFromStart = Math.sqrt(
            Math.pow(prev.x - startPos.x, 2) + Math.pow(prev.y - startPos.y, 2)
          )

          // Acceleration easing - smooth ramp up at start (starts at 15%, ramps to 100%)
          const accelDistance = 8
          const accelFactor = distFromStart > accelDistance
            ? 1.0
            : 0.15 + 0.85 * Math.pow(distFromStart / accelDistance, 0.5)

          // Deceleration easing - smooth slow down at end
          const decelDistance = 10
          const decelFactor = distance > decelDistance
            ? 1.0
            : Math.pow(distance / decelDistance, 0.5) // Smooth deceleration curve

          // Combine both: multiply for smooth accel AND decel
          const speedFactor = accelFactor * decelFactor

          // Movement speed with combined easing
          const baseSpeed = 0.12 * deltaTime
          const currentSpeed = baseSpeed * speedFactor

          // Normalize direction and apply speed
          const dirX = dx / distance
          const dirY = dy / distance

          if (Math.abs(dx) > 0.1) {
            setMonsterFacingRight(dx > 0)
          }

          // Update refs for smooth animation (no state batching delays)
          speedFactorRef.current = speedFactor
          // Use 2*PI modulo so sin wraps seamlessly (no jump at wrap point)
          walkCycleRef.current = (walkCycleRef.current + 0.25 * deltaTime * speedFactor) % (2 * Math.PI)

          setMonsterPos({
            x: prev.x + dirX * currentSpeed,
            y: prev.y + dirY * currentSpeed,
          })

          // Trigger re-render for walk animation
          forceRender(f => f + 1)
        }
      } else {
        // When paused, smoothly decay speed and walk cycle to zero
        speedFactorRef.current = speedFactorRef.current * 0.92
        walkCycleRef.current = (walkCycleRef.current + 0.25 * deltaTime * speedFactorRef.current) % (2 * Math.PI)

        // Keep rendering while animation fades out
        if (speedFactorRef.current > 0.005) {
          forceRender(f => f + 1)
        } else {
          speedFactorRef.current = 0 // Fully stopped
        }
      }

      animationId = requestAnimationFrame(gameLoop)
    }

    animationId = requestAnimationFrame(gameLoop)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [currentScreen])

  // Calculate walk animation transform - uses refs for smooth interpolation
  const getWalkTransform = () => {
    const flipX = monsterFacingRight ? -1 : 1

    // Walk intensity from ref (updates every frame, no state batching)
    const walkIntensity = Math.min(speedFactorRef.current * 0.12, 0.12)

    if (walkIntensity < 0.001) {
      return `translate(-50%, -50%) scaleX(${flipX})`
    }

    const squashStretch = Math.sin(walkCycleRef.current) * walkIntensity
    const scaleX = 1 + squashStretch
    const scaleY = 1 - squashStretch * 0.5
    return `translate(-50%, -50%) scaleX(${scaleX * flipX}) scaleY(${scaleY})`
  }

  // Game Screen
  if (currentScreen === 'game') {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100%',
        backgroundImage: 'url(/bg.png)',
        backgroundSize: '100% auto',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#2d5a3d',
        position: 'relative',
      }}>
        {/* Admin Button */}
        <button
          onClick={() => setShowAdmin(true)}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '10px 20px',
            backgroundColor: 'rgba(74, 222, 128, 0.2)',
            color: '#4ade80',
            border: '1px solid rgba(74, 222, 128, 0.4)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            zIndex: 100,
            backdropFilter: 'blur(4px)',
          }}
        >
          Admin
        </button>

        {/* Back Button */}
        <button
          onClick={() => setCurrentScreen('landing')}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            padding: '10px 20px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            zIndex: 100,
            backdropFilter: 'blur(4px)',
          }}
        >
          Back
        </button>

        {/* Monster Shadow (ellipse on ground) */}
        <div
          style={{
            position: 'absolute',
            left: `${monsterPos.x}%`,
            top: `${monsterPos.y + 5.5}%`,
            transform: 'translate(-50%, 0)',
            width: '80px',
            height: '20px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(3px)',
          }}
        />

        {/* Monster */}
        <img
          src="/monster.png"
          alt="Monster"
          style={{
            position: 'absolute',
            left: `${monsterPos.x}%`,
            top: `${monsterPos.y}%`,
            transform: getWalkTransform(),
            width: '120px',
            height: 'auto',
            pointerEvents: 'none',
          }}
        />

        {/* Admin Panel */}
        {showAdmin && <Admin onClose={() => setShowAdmin(false)} />}
      </div>
    )
  }

  // Landing Screen
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
      {/* Background image */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.15,
        filter: 'blur(10px)',
        pointerEvents: 'none',
      }} />

      {/* Floating particles */}
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-100vh) translateX(20px);
            opacity: 0;
          }
        }
      `}</style>
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${5 + (i * 4.7) % 90}%`,
            top: '100%',
            width: `${3 + (i % 4) * 2}px`,
            height: `${3 + (i % 4) * 2}px`,
            borderRadius: '50%',
            backgroundColor: 'rgba(74, 222, 128, 0.5)',
            boxShadow: '0 0 6px rgba(74, 222, 128, 0.3)',
            animation: `float-up ${15 + (i % 10) * 3}s linear infinite`,
            animationDelay: `${(i * 1.7) % 15}s`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Lightning bugs */}
      <LightningBug />

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
        Chillarium
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
        By Whoa whoa whoa, you cant just say that anymore Studios
      </p>

      {/* Terrarium Visual */}
      <div style={{
        position: 'relative',
        width: '320px',
        zIndex: 10,
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
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
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

      {/* Play Button */}
      <button
        onClick={() => setCurrentScreen('game')}
        style={{
          marginTop: '50px',
          padding: '16px 60px',
          fontSize: '24px',
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: '500',
          letterSpacing: '6px',
          textTransform: 'uppercase',
          color: '#0a0a12',
          backgroundColor: '#4ade80',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(74, 222, 128, 0.4)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#5eeb99'
          e.currentTarget.style.transform = 'scale(1.05)'
          e.currentTarget.style.boxShadow = '0 6px 30px rgba(74, 222, 128, 0.6)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#4ade80'
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(74, 222, 128, 0.4)'
        }}
      >
        Play
      </button>

      {/* Google Fonts import */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&display=swap"
        rel="stylesheet"
      />
    </div>
  )
}

export default App

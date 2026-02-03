import { useState, useEffect, useRef } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useGame } from '../context/GameContext'
import { Id } from '../../convex/_generated/dataModel'

interface WanderingCreatureProps {
  creatureId: Id<'creatures'>
  imageUrl?: string
  name: string
  goldPerMinute: number
  index: number
}

function WanderingCreature({ imageUrl, name, index }: WanderingCreatureProps) {
  // Stagger initial positions based on index
  const initialX = 35 + (index % 3) * 15
  const initialY = 35 + Math.floor(index / 3) * 10

  const [pos, setPos] = useState({ x: initialX, y: initialY })
  const [target, setTarget] = useState({ x: initialX + 10, y: initialY + 5 })
  const [startPos, setStartPos] = useState({ x: initialX, y: initialY })
  const [facingRight, setFacingRight] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const walkCycleRef = useRef(0)
  const speedFactorRef = useRef(0.15)
  const [, forceRender] = useState(0)

  const targetRef = useRef(target)
  const pausedRef = useRef(isPaused)
  const posRef = useRef(pos)
  const startPosRef = useRef(startPos)

  useEffect(() => { targetRef.current = target }, [target])
  useEffect(() => { pausedRef.current = isPaused }, [isPaused])
  useEffect(() => { posRef.current = pos }, [pos])
  useEffect(() => { startPosRef.current = startPos }, [startPos])

  useEffect(() => {
    let animationId: number
    let lastTime = performance.now()

    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 16.67
      lastTime = currentTime

      if (!pausedRef.current) {
        const prev = posRef.current
        const tgt = targetRef.current
        const dx = tgt.x - prev.x
        const dy = tgt.y - prev.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < 0.5) {
          setIsPaused(true)

          setTimeout(() => {
            const currentPos = posRef.current
            const minDistance = 15
            let newTarget = { x: 0, y: 0 }
            let attempts = 0

            do {
              const newY = 30 + Math.random() * 30
              const yFactor = (newY - 30) / 30
              const minX = 38 - yFactor * 13
              const maxX = 62 + yFactor * 13
              const newX = minX + Math.random() * (maxX - minX)

              newTarget = { x: newX, y: newY }
              attempts++
            } while (
              Math.sqrt(Math.pow(newTarget.x - currentPos.x, 2) + Math.pow(newTarget.y - currentPos.y, 2)) < minDistance
              && attempts < 20
            )

            const newDx = newTarget.x - currentPos.x
            if (Math.abs(newDx) > 0.1) {
              setFacingRight(newDx > 0)
            }
            setStartPos({ ...currentPos })
            setTarget(newTarget)
            setIsPaused(false)
          }, 1000 + Math.random() * 1000)
        } else {
          const sPos = startPosRef.current
          const distFromStart = Math.sqrt(
            Math.pow(prev.x - sPos.x, 2) + Math.pow(prev.y - sPos.y, 2)
          )

          const accelDistance = 8
          const accelFactor = distFromStart > accelDistance
            ? 1.0
            : 0.15 + 0.85 * Math.pow(distFromStart / accelDistance, 0.5)

          const decelDistance = 10
          const decelFactor = distance > decelDistance
            ? 1.0
            : Math.pow(distance / decelDistance, 0.5)

          const speedFactor = accelFactor * decelFactor
          const baseSpeed = 0.12 * deltaTime
          const currentSpeed = baseSpeed * speedFactor

          const dirX = dx / distance
          const dirY = dy / distance

          if (Math.abs(dx) > 0.1) {
            setFacingRight(dx > 0)
          }

          speedFactorRef.current = speedFactor
          walkCycleRef.current = (walkCycleRef.current + 0.25 * deltaTime * speedFactor) % (2 * Math.PI)

          setPos({
            x: prev.x + dirX * currentSpeed,
            y: prev.y + dirY * currentSpeed,
          })

          forceRender(f => f + 1)
        }
      } else {
        speedFactorRef.current = speedFactorRef.current * 0.92
        walkCycleRef.current = (walkCycleRef.current + 0.25 * deltaTime * speedFactorRef.current) % (2 * Math.PI)

        if (speedFactorRef.current > 0.005) {
          forceRender(f => f + 1)
        } else {
          speedFactorRef.current = 0
        }
      }

      animationId = requestAnimationFrame(gameLoop)
    }

    animationId = requestAnimationFrame(gameLoop)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  const getWalkTransform = () => {
    const flipX = facingRight ? -1 : 1
    const walkIntensity = Math.min(speedFactorRef.current * 0.12, 0.12)

    if (walkIntensity < 0.001) {
      return `translate(-50%, -50%) scaleX(${flipX})`
    }

    const squashStretch = Math.sin(walkCycleRef.current) * walkIntensity
    const scaleX = 1 + squashStretch
    const scaleY = 1 - squashStretch * 0.5
    return `translate(-50%, -50%) scaleX(${scaleX * flipX}) scaleY(${scaleY})`
  }

  return (
    <>
      {/* Shadow */}
      <div
        style={{
          position: 'absolute',
          left: `${pos.x}%`,
          top: `${pos.y + 5.5}%`,
          transform: 'translate(-50%, 0)',
          width: '80px',
          height: '20px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(3px)',
        }}
      />

      {/* Creature */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          style={{
            position: 'absolute',
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: getWalkTransform(),
            width: '120px',
            height: 'auto',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: getWalkTransform(),
            width: '80px',
            height: '80px',
            backgroundColor: '#4ade80',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1a1a2e',
            fontWeight: 'bold',
            fontSize: '12px',
            textAlign: 'center',
            padding: '8px',
          }}
        >
          {name}
        </div>
      )}
    </>
  )
}

interface TerrariumScreenProps {
  onShowAdmin: () => void
}

export function TerrariumScreen({ onShowAdmin }: TerrariumScreenProps) {
  const { state, dispatch, setCurrentScreen } = useGame()
  const creatures = useQuery(api.creatures.list)

  // Get creatures in terrarium
  const terrariumCreatures = state.ownedCreatures.filter(c => c.location === 'terrarium')

  // Calculate total income per minute
  const incomePerMinute = terrariumCreatures.reduce((total, owned) => {
    const creatureData = creatures?.find(c => c._id === owned.creatureId)
    return total + (creatureData?.goldPerMinute || 0)
  }, 0)

  // Income tick every 10 seconds (1/6 of per-minute income)
  useEffect(() => {
    if (incomePerMinute <= 0) return

    const interval = setInterval(() => {
      const incomePerTick = Math.ceil(incomePerMinute / 6)
      dispatch({ type: 'ADD_GOLD', amount: incomePerTick })
    }, 10000)

    return () => clearInterval(interval)
  }, [incomePerMinute, dispatch])

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
      {/* Header Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 100,
      }}>
        {/* Back Button */}
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

        {/* Gold Display */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '8px',
        }}>
          <span style={{ fontSize: '20px' }}>💰</span>
          <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '18px' }}>
            {state.gold.toLocaleString()}
          </span>
          {incomePerMinute > 0 && (
            <span style={{ color: '#4ade80', fontSize: '12px' }}>
              (+{incomePerMinute}/min)
            </span>
          )}
        </div>

        {/* Admin Button */}
        <button
          onClick={onShowAdmin}
          style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(74, 222, 128, 0.2)',
            color: '#4ade80',
            border: '1px solid rgba(74, 222, 128, 0.4)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          Admin
        </button>
      </div>

      {/* Creatures */}
      {terrariumCreatures.length > 0 ? (
        terrariumCreatures.map((owned, index) => {
          const creatureData = creatures?.find(c => c._id === owned.creatureId)
          if (!creatureData) return null

          return (
            <WanderingCreature
              key={owned.id}
              creatureId={owned.creatureId}
              imageUrl={creatureData.imageUrl}
              name={creatureData.name}
              goldPerMinute={creatureData.goldPerMinute}
              index={index}
            />
          )
        })
      ) : (
        /* Empty state - show placeholder monster */
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#fff',
        }}>
          <img
            src="/monster.png"
            alt="Monster"
            style={{
              width: '120px',
              height: 'auto',
              opacity: 0.3,
              marginBottom: '20px',
            }}
          />
          <p style={{ fontSize: '18px', opacity: 0.7 }}>
            No creatures yet!
          </p>
          <p style={{ fontSize: '14px', opacity: 0.5 }}>
            Buy packs in the Shop and raise creatures in Biomes
          </p>
        </div>
      )}

      {/* Creature count display */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 24px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '14px',
      }}>
        {terrariumCreatures.length} creature{terrariumCreatures.length !== 1 ? 's' : ''} in terrarium
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { Stage, Container, Graphics, Text } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { Plant, PlantData } from './components/Plant'
import { Shop } from './components/Shop'
import { Admin } from './components/Admin'
import { PLANT_TYPES } from './data/plantTypes'

interface GameState {
  gold: number
  plants: PlantData[]
  nextPlantId: number
}

function App() {
  const [showAdmin, setShowAdmin] = useState(false)
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('plantz-save')
    if (saved) {
      return JSON.parse(saved)
    }
    return {
      gold: 100,
      plants: [],
      nextPlantId: 1,
    }
  })

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem('plantz-save', JSON.stringify(gameState))
    }, 5000)
    return () => clearInterval(interval)
  }, [gameState])

  // Passive income from mature plants
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => {
        let goldEarned = 0
        const updatedPlants = prev.plants.map(plant => {
          if (plant.growth >= 100) {
            goldEarned += PLANT_TYPES[plant.type].income
          }
          return plant
        })
        if (goldEarned > 0) {
          return { ...prev, gold: prev.gold + goldEarned, plants: updatedPlants }
        }
        return prev
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Growth tick
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        plants: prev.plants.map(plant => ({
          ...plant,
          growth: Math.min(100, plant.growth + PLANT_TYPES[plant.type].growthRate),
        })),
      }))
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const buyPlant = useCallback((typeId: string) => {
    const plantType = PLANT_TYPES[typeId]
    if (gameState.gold >= plantType.cost) {
      const gridSize = 120
      const cols = Math.floor(800 / gridSize)
      const plantIndex = gameState.plants.length
      const col = plantIndex % cols
      const row = Math.floor(plantIndex / cols)

      setGameState(prev => ({
        ...prev,
        gold: prev.gold - plantType.cost,
        plants: [...prev.plants, {
          id: prev.nextPlantId,
          type: typeId,
          x: 100 + col * gridSize,
          y: 200 + row * gridSize,
          growth: 0,
        }],
        nextPlantId: prev.nextPlantId + 1,
      }))
    }
  }, [gameState.gold, gameState.plants.length])

  const sellPlant = useCallback((plantId: number) => {
    setGameState(prev => {
      const plant = prev.plants.find(p => p.id === plantId)
      if (!plant) return prev

      const plantType = PLANT_TYPES[plant.type]
      const sellValue = Math.floor(plantType.cost * 0.5 * (plant.growth / 100))

      return {
        ...prev,
        gold: prev.gold + sellValue,
        plants: prev.plants.filter(p => p.id !== plantId),
      }
    })
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Admin Button */}
      <button
        onClick={() => setShowAdmin(true)}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          padding: '8px 16px',
          backgroundColor: '#4ade80',
          color: '#1a1a2e',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold',
          zIndex: 100,
        }}
      >
        Admin
      </button>

      {/* Admin Panel */}
      {showAdmin && <Admin onClose={() => setShowAdmin(false)} />}

      <Stage
        width={900}
        height={700}
        options={{
          background: 0x1a1a2e,
          antialias: true,
        }}
      >
        <Container>
          {/* Background gradient */}
          <Graphics
            draw={g => {
              g.clear()
              g.beginFill(0x1a1a2e)
              g.drawRect(0, 0, 900, 700)
              g.endFill()

              // Ground
              g.beginFill(0x2d4a3e)
              g.drawRect(0, 500, 900, 200)
              g.endFill()

              // Grass line
              g.beginFill(0x4a7c59)
              g.drawRect(0, 490, 900, 20)
              g.endFill()
            }}
          />

          {/* Title */}
          <Text
            text="PLANTZ"
            x={450}
            y={30}
            anchor={0.5}
            style={new PIXI.TextStyle({
              fontFamily: 'Arial Black',
              fontSize: 48,
              fill: ['#7fff7f', '#4a7c59'],
              stroke: '#1a1a2e',
              strokeThickness: 4,
              letterSpacing: 8,
            })}
          />

          {/* Gold display */}
          <Text
            text={`Gold: ${gameState.gold}`}
            x={450}
            y={80}
            anchor={0.5}
            style={new PIXI.TextStyle({
              fontFamily: 'Arial',
              fontSize: 24,
              fill: '#ffd700',
            })}
          />

          {/* Credits */}
          <Text
            text="by Wheels, Emilio & Disruptor"
            x={450}
            y={680}
            anchor={0.5}
            style={new PIXI.TextStyle({
              fontFamily: 'Arial',
              fontSize: 14,
              fill: '#666666',
            })}
          />

          {/* Plants */}
          {gameState.plants.map(plant => (
            <Plant
              key={plant.id}
              data={plant}
              onSell={() => sellPlant(plant.id)}
            />
          ))}
        </Container>
      </Stage>

      <Shop
        gold={gameState.gold}
        onBuy={buyPlant}
      />
    </div>
  )
}

export default App

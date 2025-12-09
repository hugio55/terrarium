import { Container, Graphics, Text } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { useCallback, useState } from 'react'
import { PLANT_TYPES } from '../data/plantTypes'

export interface PlantData {
  id: number
  type: string
  x: number
  y: number
  growth: number // 0-100
}

interface PlantProps {
  data: PlantData
  onSell: () => void
}

export function Plant({ data, onSell }: PlantProps) {
  const [hovered, setHovered] = useState(false)
  const plantType = PLANT_TYPES[data.type]
  const growthScale = data.growth / 100
  const currentHeight = plantType.maxHeight * growthScale
  const isMature = data.growth >= 100

  const drawPlant = useCallback((g: PIXI.Graphics) => {
    g.clear()

    // Pot
    g.beginFill(0x8b4513)
    g.drawRect(-15, 0, 30, 20)
    g.endFill()
    g.beginFill(0xa0522d)
    g.drawRect(-18, -5, 36, 8)
    g.endFill()

    // Soil
    g.beginFill(0x3d2817)
    g.drawRect(-12, -8, 24, 6)
    g.endFill()

    if (growthScale > 0.05) {
      // Stem
      g.beginFill(plantType.color)
      const stemWidth = 4 + growthScale * 4
      g.drawRect(-stemWidth / 2, -8 - currentHeight, stemWidth, currentHeight)
      g.endFill()

      // Leaves based on growth
      if (growthScale > 0.2) {
        g.beginFill(plantType.leafColor)
        const leafSize = 8 + growthScale * 12

        // Left leaf
        g.drawEllipse(-leafSize, -8 - currentHeight * 0.5, leafSize, leafSize * 0.4)
        // Right leaf
        g.drawEllipse(leafSize, -8 - currentHeight * 0.6, leafSize, leafSize * 0.4)

        if (growthScale > 0.5) {
          // More leaves
          g.drawEllipse(-leafSize * 0.7, -8 - currentHeight * 0.8, leafSize * 0.8, leafSize * 0.3)
          g.drawEllipse(leafSize * 0.7, -8 - currentHeight * 0.9, leafSize * 0.8, leafSize * 0.3)
        }

        // Top bloom/crown
        if (isMature) {
          g.beginFill(0xffd700)
          g.drawCircle(0, -8 - currentHeight - 5, 6)
          g.endFill()
        }

        g.endFill()
      }
    }

    // Hover highlight
    if (hovered) {
      g.lineStyle(2, 0xffffff, 0.5)
      g.drawRect(-25, -8 - currentHeight - 15, 50, currentHeight + 45)
      g.lineStyle(0)
    }
  }, [growthScale, currentHeight, plantType.color, plantType.leafColor, isMature, hovered])

  return (
    <Container x={data.x} y={data.y}>
      <Graphics
        draw={drawPlant}
        eventMode="static"
        cursor="pointer"
        onpointerover={() => setHovered(true)}
        onpointerout={() => setHovered(false)}
        onclick={onSell}
      />

      {/* Growth bar */}
      <Graphics
        draw={g => {
          g.clear()
          // Background
          g.beginFill(0x333333)
          g.drawRect(-20, 25, 40, 6)
          g.endFill()
          // Fill
          g.beginFill(isMature ? 0xffd700 : 0x4a7c59)
          g.drawRect(-20, 25, 40 * growthScale, 6)
          g.endFill()
        }}
      />

      {/* Plant name on hover */}
      {hovered && (
        <Text
          text={`${plantType.name}${isMature ? ' (Earning!)' : ''}\nClick to sell`}
          y={-currentHeight - 30}
          anchor={0.5}
          style={new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 12,
            fill: '#ffffff',
            align: 'center',
          })}
        />
      )}
    </Container>
  )
}

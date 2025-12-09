export interface PlantType {
  id: string
  name: string
  cost: number
  income: number // gold per second when mature
  growthRate: number // % per tick
  color: number
  leafColor: number
  maxHeight: number
  description: string
}

export const PLANT_TYPES: Record<string, PlantType> = {
  sprout: {
    id: 'sprout',
    name: 'Sprout',
    cost: 10,
    income: 1,
    growthRate: 0.5,
    color: 0x4a7c59,
    leafColor: 0x7fff7f,
    maxHeight: 40,
    description: 'A humble beginning. Earns 1 gold/sec.',
  },
  fern: {
    id: 'fern',
    name: 'Fern',
    cost: 50,
    income: 5,
    growthRate: 0.3,
    color: 0x2d5a3e,
    leafColor: 0x5faf5f,
    maxHeight: 60,
    description: 'Elegant fronds. Earns 5 gold/sec.',
  },
  succulent: {
    id: 'succulent',
    name: 'Succulent',
    cost: 150,
    income: 12,
    growthRate: 0.2,
    color: 0x7fbf7f,
    leafColor: 0xafffaf,
    maxHeight: 35,
    description: 'Stores value like water. Earns 12 gold/sec.',
  },
  cactus: {
    id: 'cactus',
    name: 'Cactus',
    cost: 400,
    income: 30,
    growthRate: 0.15,
    color: 0x3d8b3d,
    leafColor: 0x90ee90,
    maxHeight: 80,
    description: 'Desert gold. Earns 30 gold/sec.',
  },
  bonsai: {
    id: 'bonsai',
    name: 'Bonsai',
    cost: 1000,
    income: 80,
    growthRate: 0.1,
    color: 0x5d4037,
    leafColor: 0x228b22,
    maxHeight: 70,
    description: 'Ancient wisdom. Earns 80 gold/sec.',
  },
  crystal_flower: {
    id: 'crystal_flower',
    name: 'Crystal Flower',
    cost: 3000,
    income: 200,
    growthRate: 0.08,
    color: 0x9370db,
    leafColor: 0xe6e6fa,
    maxHeight: 55,
    description: 'Magical blooms. Earns 200 gold/sec.',
  },
}

export const PLANT_TYPE_LIST = Object.values(PLANT_TYPES)

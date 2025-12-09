import { PLANT_TYPE_LIST } from '../data/plantTypes'

interface ShopProps {
  gold: number
  onBuy: (typeId: string) => void
}

export function Shop({ gold, onBuy }: ShopProps) {
  return (
    <div style={{
      width: '280px',
      background: 'linear-gradient(180deg, #1a2a1a 0%, #0f1a0f 100%)',
      borderLeft: '2px solid #4a7c59',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      overflowY: 'auto',
    }}>
      <h2 style={{
        color: '#7fff7f',
        textAlign: 'center',
        margin: '0 0 10px 0',
        fontSize: '24px',
        textShadow: '0 0 10px #4a7c59',
      }}>
        SHOP
      </h2>

      {PLANT_TYPE_LIST.map(plant => {
        const canAfford = gold >= plant.cost

        return (
          <div
            key={plant.id}
            onClick={() => canAfford && onBuy(plant.id)}
            style={{
              background: canAfford
                ? 'linear-gradient(180deg, #2d4a3e 0%, #1a2a1a 100%)'
                : '#1a1a1a',
              border: `1px solid ${canAfford ? '#4a7c59' : '#333'}`,
              borderRadius: '8px',
              padding: '12px',
              cursor: canAfford ? 'pointer' : 'not-allowed',
              opacity: canAfford ? 1 : 0.5,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              if (canAfford) {
                e.currentTarget.style.transform = 'scale(1.02)'
                e.currentTarget.style.boxShadow = '0 0 15px #4a7c5955'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
            }}>
              <span style={{
                color: '#7fff7f',
                fontWeight: 'bold',
                fontSize: '16px',
              }}>
                {plant.name}
              </span>
              <span style={{
                color: '#ffd700',
                fontWeight: 'bold',
              }}>
                {plant.cost}g
              </span>
            </div>

            <p style={{
              color: '#aaa',
              fontSize: '12px',
              margin: 0,
            }}>
              {plant.description}
            </p>

            <div style={{
              marginTop: '8px',
              fontSize: '11px',
              color: '#888',
            }}>
              Income: <span style={{ color: '#ffd700' }}>{plant.income}/sec</span>
            </div>
          </div>
        )
      })}

      <div style={{
        marginTop: 'auto',
        padding: '15px',
        background: '#0a0f0a',
        borderRadius: '8px',
        textAlign: 'center',
      }}>
        <div style={{ color: '#666', fontSize: '12px', marginBottom: '5px' }}>
          Tips:
        </div>
        <div style={{ color: '#888', fontSize: '11px' }}>
          Plants grow over time.<br />
          Mature plants earn gold!<br />
          Click plants to sell them.
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Admin } from './components/Admin'
import { useGame } from './context/GameContext'
import { LandingScreen } from './screens/LandingScreen'
import { NavigationHub } from './screens/NavigationHub'
import { ShopScreen } from './screens/ShopScreen'
import { BiomeScreen } from './screens/BiomeScreen'
import { TerrariumScreen } from './screens/TerrariumScreen'
import { SettingsScreen } from './screens/SettingsScreen'

function App() {
  const [showAdmin, setShowAdmin] = useState(false)
  const { currentScreen } = useGame()

  const handleShowAdmin = () => setShowAdmin(true)

  return (
    <>
      {/* Screen Router */}
      {currentScreen === 'landing' && (
        <LandingScreen onShowAdmin={handleShowAdmin} />
      )}

      {currentScreen === 'hub' && (
        <NavigationHub onShowAdmin={handleShowAdmin} />
      )}

      {currentScreen === 'shop' && (
        <ShopScreen onShowAdmin={handleShowAdmin} />
      )}

      {(currentScreen === 'biomes' || currentScreen === 'biome-detail') && (
        <BiomeScreen onShowAdmin={handleShowAdmin} />
      )}

      {currentScreen === 'terrarium' && (
        <TerrariumScreen onShowAdmin={handleShowAdmin} />
      )}

      {currentScreen === 'settings' && (
        <SettingsScreen onShowAdmin={handleShowAdmin} />
      )}

      {/* Admin Panel (Modal) */}
      {showAdmin && <Admin onClose={() => setShowAdmin(false)} />}
    </>
  )
}

export default App

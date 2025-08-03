import './App.css'
import { useEffect, useRef, useState } from 'react'
import { Menu } from './pages/Menu'
import { Preloader } from './pages/Preloader'
import { IntermediatePage } from './pages/IntermediatePage'
import { gameManager } from './core/GameManager'
import { unscheduleDelay } from './pages/Scheduler'
import { Canvas } from './pages/Canvas'

export function App() {
  const [loading, setLoading] = useState(true);
  const [showIntermediate, setShowIntermediate] = useState(false);
  
  useEffect(() => {
    gameManager.on("preloaded", () => setLoading(false));
    gameManager.on("restart", () => setLoading(true));
    gameManager.on("show-intermediate-page", () => setShowIntermediate(true));
    
    return () => {
      gameManager.reset();
      unscheduleDelay();
    }
  }, [gameManager.restartCount])

  const handleConfirmRestart = () => {
    gameManager.confirmRestart();
  };
  
  const handleCancelRestart = () => {
    setShowIntermediate(false);
  };

  return (
    <>
      <Canvas />
      {loading && <Preloader />}
      {!loading && <Menu />}
      {showIntermediate && (
        <IntermediatePage 
          onConfirm={handleConfirmRestart}
          onCancel={handleCancelRestart}
        />
      )}
    </>
  )
}

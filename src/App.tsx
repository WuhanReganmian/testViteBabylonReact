import { useEffect, useLayoutEffect, useState } from 'react'
import Game from './utils/babylonjsUtil/App'
import styles from './assets/css/App.module.sass'

function App() {

  useLayoutEffect(() => {
    const game = new Game();
    return () => {
      game.remove();
    }
  }, [])

  return (
    <canvas id="renderCanvas" touch-action="none" className={styles.app}></canvas>
  )
}

export default App

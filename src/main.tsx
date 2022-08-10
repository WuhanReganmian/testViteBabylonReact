import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './assets/css/index.css'
import 'babylonjs'
import 'babylonjs-loaders'
import 'babylonjs-inspector'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />
)

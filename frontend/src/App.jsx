/**
 * Shadow Nox Main App Component
 */

import { Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </div>
  )
}

export default App


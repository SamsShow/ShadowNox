/**
 * Shadow Nox Main App Component
 */

import { Routes, Route } from 'react-router-dom'
import Landing from './components/Landing'
import Dashboard from './components/Dashboard'
import ContractTester from './components/ContractTester'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/test-contracts" element={<ContractTester />} />
    </Routes>
  )
}

export default App


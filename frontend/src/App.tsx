// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/LoginPage'
import CalendarPage from './pages/CalendarPage'
import RegisterPage from './pages/RegisterPage'

function App() {
	return (
		<BrowserRouter>
		<Routes>
			<Route path="/" element={<Login />} />
			<Route path="/register" element={<RegisterPage />} />
			<Route path="/calendar" element={<CalendarPage />} />
		</Routes>
		</BrowserRouter>
	)
}

export default App

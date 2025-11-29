import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Auth/LoginPage'
import SignupPage from './pages/Auth/SignupPage'
import VerifyEmailPage from './pages/Auth/VerifyEmailPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import TimetablePage from './pages/Timetable/TimetablePage'
import RoomListPage from './pages/Rooms/RoomListPage'
import RoomDetailPage from './pages/Rooms/RoomDetailPage'
import PublicEventsPage from './pages/Events/PublicEventsPage'
import EventDetailPage from './pages/Events/EventDetailPage'
import CalendarSettingsPage from './pages/Settings/CalendarSettingsPage'
import AdminPage from './pages/Admin/AdminPage'
import Layout from './components/layout/Layout'
import { useAuthStore } from './hooks/useAuthStore'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthStore()
  const isAuthenticated = !!accessToken
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="timetable" element={<TimetablePage />} />
          <Route path="rooms" element={<RoomListPage />} />
          <Route path="rooms/:roomId" element={<RoomDetailPage />} />
          <Route path="events" element={<PublicEventsPage />} />
          <Route path="events/:eventId" element={<EventDetailPage />} />
          <Route path="settings/calendar" element={<CalendarSettingsPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App


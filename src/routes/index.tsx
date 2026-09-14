import { Routes, Route, useNavigate, Navigate } from "react-router"
import LandingPage from "@/features/landing/pages/LandingPage"
import LoginPage from "@/features/auth/pages/LoginPage"
import DashboardApp from "@/features/dashboard/pages/DashboardApp"
import { CallPage } from "@/features/telemedicine/CallPage"
import { authService } from "@/services/authService"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export function AppRouter() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      navigate("/")
    }
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage
            onLoginClick={() => navigate("/login")}
            onSplitComplete={() => navigate("/dashboard")}
          />
        }
      />
      <Route
        path="/login"
        element={
          <LoginPage
            onLogin={() => navigate("/dashboard")}
            onBack={() => navigate("/")}
          />
        }
      />
      <Route
        path="/call/:roomId"
        element={<CallPage />}
      />
      <Route
        path="/telemedicine/call/:roomId"
        element={<CallPage />}
      />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardApp onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

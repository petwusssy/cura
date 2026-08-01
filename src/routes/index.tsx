import { Routes, Route, useNavigate } from "react-router"
import LandingPage from "@/features/landing/pages/LandingPage"
import LoginPage from "@/features/auth/pages/LoginPage"
import DashboardApp from "@/features/dashboard/pages/DashboardApp"
import { authService } from "@/services/authService"

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
        path="/dashboard/*"
        element={
          <DashboardApp onLogout={handleLogout} />
        }
      />
    </Routes>
  )
}

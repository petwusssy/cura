import { Routes, Route, useNavigate } from "react-router"
import LandingPage from "@/features/landing/pages/LandingPage"
import LoginPage from "@/features/auth/pages/LoginPage"
import DashboardApp from "@/features/dashboard/pages/DashboardApp"

export function AppRouter() {
  const navigate = useNavigate()

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
          <DashboardApp onLogout={() => navigate("/")} />
        }
      />
    </Routes>
  )
}

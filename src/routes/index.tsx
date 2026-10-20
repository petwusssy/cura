import { lazy, Suspense } from "react"
import { Routes, Route, useNavigate, Navigate } from "react-router"
import { authService } from "@/services/authService"

const LandingPage = lazy(() => import("@/features/landing/pages/LandingPage"))
const DashboardApp = lazy(() => import("@/features/dashboard/pages/DashboardApp"))
const CallPage = lazy(() => import("@/features/telemedicine/CallPage").then(m => ({ default: m.CallPage })))

function RouteFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-bg-base" aria-busy="true">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E5AA8] border-t-transparent" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />
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
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          path="/"
          element={
            <LandingPage
              initialStage="idle"
              onLoginClick={() => navigate("/login")}
              onSplitComplete={() => navigate("/dashboard")}
            />
          }
        />
        <Route
          path="/login"
          element={
            <LandingPage
              initialStage="form"
              onBackToHome={() => navigate("/")}
              onSplitComplete={() => navigate("/dashboard")}
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
    </Suspense>
  )
}

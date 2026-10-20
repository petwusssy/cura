import { Component, ErrorInfo, ReactNode, lazy, Suspense } from "react"
import { Routes, Route, useNavigate, Navigate } from "react-router"
import { authService } from "@/services/authService"

const LandingPage = lazy(() => import("@/features/landing/pages/LandingPage"))
const DashboardApp = lazy(() => import("@/features/dashboard/pages/DashboardApp"))
const CallPage = lazy(() => import("@/features/telemedicine/CallPage").then(m => ({ default: m.CallPage })))

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[#F4F9FD] px-4 text-center">
          <div className="max-w-md rounded-2xl bg-white p-8 shadow-xl border border-sky-100">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-[#1B3A6B]">Something went wrong</h2>
            <p className="mb-6 text-sm text-slate-500">An unexpected error occurred while loading this view.</p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="w-full rounded-xl bg-[#1E5AA8] py-3 text-sm font-semibold text-white shadow-md hover:bg-[#154687] transition-all cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <AppErrorBoundary>
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
    </AppErrorBoundary>
  )
}

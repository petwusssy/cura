import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronRight,
  User,
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react"
import uaLogo from "@/assets/images/ua-logo.png"
import curaLogo from "@/assets/images/cura-logo.png"
import campusBg from "@/features/landing/assets/uafacade.jpg"
import { authService } from "@/services/authService"
import { loginLimiter, MAX_LOGIN_ATTEMPTS } from "@/utils/loginLimiter"

interface Props {
  onLoginClick: () => void
  onSplitComplete: () => void
}

type Stage = "idle" | "form" | "splitting"

export default function LandingPage({ onLoginClick, onSplitComplete }: Props) {
  const [stage, setStage] = useState<Stage>("idle")
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [limitState, setLimitState] = useState(() => loginLimiter.getLimitState())
  const [isUaHovered, setIsUaHovered] = useState(false)

  useEffect(() => {
    if (stage === "splitting") {
      const timer = setTimeout(() => {
        onSplitComplete()
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [stage, onSplitComplete])

  useEffect(() => {
    if (!limitState.isLocked || limitState.lockoutRemainingSeconds <= 0) return

    const interval = setInterval(() => {
      setLimitState((prev) => {
        if (prev.lockoutRemainingSeconds <= 1) {
          clearInterval(interval)
          setErrorMessage(null)
          return loginLimiter.getLimitState(username.trim())
        }
        return {
          ...prev,
          lockoutRemainingSeconds: prev.lockoutRemainingSeconds - 1,
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [limitState.isLocked, limitState.lockoutRemainingSeconds, username])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (limitState.isLocked) {
      setErrorMessage(null)
      return
    }

    if (!username.trim() || !password) {
      setErrorMessage("Please enter both username and password.")
      return
    }
    setLoading(true)
    setErrorMessage(null)
    try {
      await authService.login(username.trim(), password)
      loginLimiter.recordSuccess(username.trim())
      setStage("splitting")
    } catch (err: any) {
      console.error("Login failed:", err)
      const newLimitState = loginLimiter.recordFailure(err, username.trim())
      setLimitState(newLimitState)
      if (newLimitState.isLocked) {
        setErrorMessage(null)
      } else {
        setErrorMessage(newLimitState.message || "Invalid username or password. Access denied.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex w-full h-full min-h-screen overflow-hidden bg-[#001e50]">
      {/* ── BACKGROUND IMAGE WITH OVERLAY (Base layer) ── */}
      <div className="absolute inset-0 z-0">
        <img
          src={campusBg}
          alt="University of the Assumption campus"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Animated Color-shifting Overlay Layers (Blue -> Red -> Yellow) */}
        <div className="absolute inset-0 overlay-cycle-blue" />
        <div className="absolute inset-0 overlay-cycle-red" />
        <div className="absolute inset-0 overlay-cycle-yellow" />

        {/* Ambient Vignette & Contrast Depth Gradients */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0, 0, 0, 0.45) 0%, transparent 35%, rgba(0, 0, 0, 0.55) 100%), linear-gradient(105deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.2) 65%, transparent 100%)",
          }}
        />
      </div>

      {/* ── MAIN CONTENT CONTAINER (Split Layout) ── */}
      <div className="relative z-10 flex w-full h-full min-h-screen">
        {/* ── LEFT WHITE BOARD / PANEL (Straight edge, takes ~58% width) ── */}
        <div className="w-full lg:w-1/2 h-full min-h-screen bg-white relative z-20 flex flex-col justify-between items-center px-6 sm:px-12 lg:px-16 pt-6 sm:pt-8 lg:pt-10 pb-6 sm:pb-8 shadow-2xl border-r border-slate-200/50 overflow-y-auto">
          {/* Top Section: Clean minimal spacer on desktop; interactive title on mobile */}
          <div className="w-full flex items-center justify-center lg:justify-start">
            {/* Mobile-only University title that reveals small UA logo on tap/hover */}
            <div
              className="inline-flex items-center gap-2.5 cursor-pointer select-none py-1.5 px-3 rounded-xl active:bg-slate-100 lg:hidden"
              onClick={() => setIsUaHovered((prev) => !prev)}
              onMouseEnter={() => setIsUaHovered(true)}
              onMouseLeave={() => setIsUaHovered(false)}
            >
              <div className="flex flex-col text-center filter drop-shadow-sm">
                <span
                  className="font-extrabold text-[15px] sm:text-[18px] tracking-wider leading-none whitespace-nowrap animated-gradient-text-ryb"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  UNIVERSITY OF THE
                </span>
                <span
                  className="font-extrabold text-[15px] sm:text-[18px] tracking-wider leading-tight mt-1 whitespace-nowrap animated-gradient-text-ryb"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  ASSUMPTION
                </span>
              </div>
              <AnimatePresence>
                {isUaHovered && (
                  <motion.img
                    src={uaLogo}
                    alt="UA Logo"
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="w-9 h-9 object-contain drop-shadow-sm ml-1"
                  />
                )}
              </AnimatePresence>
            </div>
            {/* Desktop spacer to keep top clean and balanced with footer */}
            <div className="hidden lg:block h-10" />
          </div>

          {/* Middle: Content Board (Slides smoothly between Idle and Form, Dead-center) */}
          <div className="my-auto py-6 w-full max-w-xl mx-auto flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {stage === "idle" && (
                <motion.div
                  key="idle-content"
                  initial={{ opacity: 0, x: -35 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -35 }}
                  transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                  className="flex flex-col items-center text-center mx-auto w-full"
                >
                  {/* Centered CURA Logo above CURA text */}
                  <img
                    src={curaLogo}
                    alt="CURA"
                    className="object-contain w-24 h-24 sm:w-28 sm:h-28 lg:w-[124px] lg:h-[124px] mb-3"
                    style={{ filter: "drop-shadow(0 8px 22px rgba(27, 108, 168, 0.22))" }}
                  />

                  <h1
                    className="leading-none mb-4 text-[#001e50]"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: "clamp(5rem, 10vw, 7.8rem)",
                      fontWeight: 900,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    CURA
                  </h1>


                  <p
                    className="text-[10px] sm:text-[11.5px] font-semibold tracking-widest uppercase mb-3.5 text-[#001e50]/75 max-w-md mx-auto leading-relaxed"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      letterSpacing: "0.12em",
                    }}
                  >
                    Centralized University Healthcare Records and Administration
                  </p>

                  <p
                    className="font-bold mb-8 text-[#001e50]/90 text-sm sm:text-base tracking-wide"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    Compassion. Care. Connected.
                  </p>

                  <motion.button
                    onClick={() => setStage("form")}
                    className="group inline-flex items-center gap-3 px-8 py-3.5 rounded-xl font-semibold text-sm bg-[#1b6ca8] text-white hover:bg-[#ffb81c] hover:text-[#001e50] transition-colors duration-300 shadow-md hover:shadow-lg"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Login to CURA</span>
                    <ChevronRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </motion.button>
                </motion.div>
              )}

              {(stage === "form" || stage === "splitting") && (
                <motion.div
                  key="form-content"
                  initial={{ opacity: 0, x: 35 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 35 }}
                  transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                  className="w-full max-w-md mx-auto"
                >

                  <div className="mb-6 text-center">
                    <h2
                      className="text-[#001e50] font-bold text-2xl mb-1.5"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Welcome Back
                    </h2>
                    <p
                      className="text-[#001e50]/70 text-xs sm:text-sm"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      Sign in to your CURA account.
                    </p>
                  </div>

                  <div className="w-full rounded-2xl p-6 sm:p-7 bg-[#F0F7FA] border border-[#a8cde5]/50 shadow-sm">
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                      {/* Username */}
                      <div>
                        <label
                          className="block text-[#001e50]/80 font-bold mb-1.5 uppercase text-[10px] tracking-wider"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          Username
                        </label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#001e50]/40">
                            <User size={15} />
                          </div>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => {
                              const val = e.target.value
                              setUsername(val)
                              if (errorMessage) setErrorMessage(null)
                              setLimitState(loginLimiter.getLimitState(val.trim()))
                            }}
                            placeholder="Enter your username"
                            className="w-full pl-10 pr-4 py-3 rounded-xl text-[#001e50] text-sm bg-white border border-[#a8cde5] focus:border-[#1b6ca8] focus:ring-2 focus:ring-[#1b6ca8]/15 outline-none transition-all placeholder-[#001e50]/30 shadow-sm"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label
                          className="block text-[#001e50]/80 font-bold mb-1.5 uppercase text-[10px] tracking-wider"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          Password
                        </label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#001e50]/40">
                            <Lock size={15} />
                          </div>
                          <input
                            type={showPassword ? "text" : "password"}
                            disabled={limitState.isLocked}
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value)
                              if (errorMessage) setErrorMessage(null)
                            }}
                            placeholder="Enter your password"
                            className="w-full pl-10 pr-10 py-3 rounded-xl text-[#001e50] text-sm bg-white border border-[#a8cde5] focus:border-[#1b6ca8] focus:ring-2 focus:ring-[#1b6ca8]/15 outline-none transition-all placeholder-[#001e50]/30 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          />
                          <button
                            type="button"
                            disabled={limitState.isLocked}
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#001e50]/40 hover:text-[#001e50]/80 transition-colors"
                          >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      {/* Lockout or Error message */}
                      {limitState.isLocked ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex items-center justify-between shadow-sm"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="text-amber-600 shrink-0" size={17} />
                            <span className="font-bold text-amber-800">Account Temporarily Locked</span>
                          </div>
                          <span className="font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                            {loginLimiter.formatTime(limitState.lockoutRemainingSeconds)}
                          </span>
                        </motion.div>
                      ) : errorMessage ? (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 shadow-sm ${
                            limitState.attemptsRemaining <= 1
                              ? "bg-red-50 border border-red-200 text-red-800"
                              : "bg-amber-50 border border-amber-200 text-amber-800"
                          }`}
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          <AlertTriangle
                            className={
                              limitState.attemptsRemaining <= 1
                                ? "text-red-600 shrink-0 mt-0.5"
                                : "text-amber-600 shrink-0 mt-0.5"
                            }
                            size={16}
                          />
                          <div className="flex-1 space-y-1">
                            <p className="font-bold text-xs leading-snug">
                              {limitState.attemptsRemaining <= 1 ? "Authentication Warning" : "Incorrect Credentials"}
                            </p>
                            <p className="text-[11px] leading-relaxed text-black/75">
                              {errorMessage}
                            </p>
                            {limitState.attemptsRemaining < MAX_LOGIN_ATTEMPTS && (
                              <div className="flex items-center justify-between pt-1.5 border-t border-black/10">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-black/50">
                                  Attempts remaining:
                                </span>
                                <div className="flex gap-1.5 items-center">
                                  {Array.from({ length: MAX_LOGIN_ATTEMPTS }).map((_, idx) => (
                                    <span
                                      key={idx}
                                      className={`w-2 h-2 rounded-full transition-all ${
                                        idx < limitState.attemptsRemaining
                                          ? limitState.attemptsRemaining <= 1
                                            ? "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]"
                                            : "bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)]"
                                          : "bg-black/15"
                                      }`}
                                    />
                                  ))}
                                  <span className="text-[10px] font-bold text-black/60 ml-1">
                                    ({limitState.attemptsRemaining} of {MAX_LOGIN_ATTEMPTS})
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ) : null}

                      {/* Submit Button */}
                      <motion.button
                        type="submit"
                        disabled={loading || limitState.isLocked}
                        className={`mt-2 w-full py-3.5 rounded-xl font-bold text-sm transition-colors duration-300 disabled:cursor-not-allowed shadow-md ${
                          limitState.isLocked
                            ? "bg-amber-700/40 text-white cursor-not-allowed"
                            : loading
                            ? "bg-[#1b6ca8]/50 text-white"
                            : "bg-[#1b6ca8] text-white hover:bg-[#ffb81c] hover:text-[#001e50]"
                        }`}
                        style={{ fontFamily: "'Inter', sans-serif" }}
                        whileHover={loading || limitState.isLocked ? {} : { scale: 1.01 }}
                        whileTap={loading || limitState.isLocked ? {} : { scale: 0.99 }}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.span
                              className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                            />
                            Signing in...
                          </span>
                        ) : limitState.isLocked ? (
                          <span className="flex items-center justify-center gap-2">
                            <Lock size={15} />
                            Locked ({loginLimiter.formatTime(limitState.lockoutRemainingSeconds)})
                          </span>
                        ) : (
                          "Login"
                        )}
                      </motion.button>
                    </form>
                  </div>

                  {/* Back button */}
                  <motion.button
                    onClick={() => {
                      setStage("idle")
                      setErrorMessage(null)
                    }}
                    className="inline-flex items-center gap-2 text-[#001e50]/60 hover:text-[#001e50] transition-colors text-xs font-semibold mt-4 px-1"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    whileHover={{ x: -2 }}
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Home</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer inside White Panel */}
          <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#001e50]/40 font-medium">
            <span>CURA System</span>
            <span>University of the Assumption</span>
          </div>
        </div>

        {/* ── RIGHT OVERLAY SECTION (Takes half width 50%) ── */}
        <div className="hidden lg:flex w-1/2 h-full min-h-screen relative flex-col justify-between pl-8 xl:pl-12 pr-8 lg:pr-12 xl:pr-16 pt-6 sm:pt-8 lg:pt-10 pb-8 lg:pb-12 xl:pb-16 z-10 pointer-events-none">
          {/* Top: UNIVERSITY OF THE ASSUMPTION in White with hover to reveal small UA logo */}
          <div className="flex items-center text-white pointer-events-auto h-[128px] lg:h-[154px]">
            <div
              className="relative inline-flex items-center gap-4 cursor-pointer select-none group py-2 px-3 -mx-3 rounded-2xl hover:bg-white/5 transition-all duration-200"
              onMouseEnter={() => setIsUaHovered(true)}
              onMouseLeave={() => setIsUaHovered(false)}
            >
              <div className="flex flex-col justify-center filter drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                <span
                  className="font-extrabold text-[22px] sm:text-[26px] lg:text-[28px] xl:text-[32px] tracking-wider leading-none whitespace-nowrap animated-gradient-text-ryb"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  UNIVERSITY OF THE
                </span>
                <span
                  className="font-extrabold text-[22px] sm:text-[26px] lg:text-[28px] xl:text-[32px] tracking-wider leading-tight mt-2 whitespace-nowrap animated-gradient-text-ryb"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  ASSUMPTION
                </span>
              </div>

              {/* Small UA Logo revealed when pointing/hovering on University text */}
              <AnimatePresence>
                {isUaHovered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.35, x: -10, rotate: -8 }}
                    animate={{ opacity: 1, scale: 1, x: 0, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.35, x: -8, rotate: 8 }}
                    transition={{ type: "spring", stiffness: 420, damping: 24 }}
                    className="shrink-0 flex items-center justify-center p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                  >
                    <img
                      src={uaLogo}
                      alt="University of the Assumption Logo"
                      className="w-11 h-11 lg:w-13 lg:h-13 xl:w-14 xl:h-14 object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom: UA Tagline */}
          <div className="max-w-md pointer-events-auto">
            <p
              className="text-white font-bold text-sm sm:text-base lg:text-lg leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              The First Catholic Archdiocesan <br />
              University in the Philippines and in Asia.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

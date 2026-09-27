import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, ArrowLeft, Lock, User, ShieldAlert, AlertTriangle } from "lucide-react"
import curaLogo from "@/assets/images/cura-logo.png"
import { authService } from "@/services/authService"
import { loginLimiter, MAX_LOGIN_ATTEMPTS } from "@/utils/loginLimiter"

interface Props {
  onLogin: () => void
  onBack: () => void
}

const ease = [0.25, 0.46, 0.45, 0.94] as const

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease },
  }),
}

export default function LoginPage({ onLogin, onBack }: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [limitState, setLimitState] = useState(() => loginLimiter.getLimitState())

  useEffect(() => {
    if (!limitState.isLocked || limitState.lockoutRemainingSeconds <= 0) return

    const interval = setInterval(() => {
      setLimitState((prev) => {
        if (prev.lockoutRemainingSeconds <= 1) {
          clearInterval(interval)
          setErrorMessage(null)
          return loginLimiter.getLimitState()
        }
        return {
          ...prev,
          lockoutRemainingSeconds: prev.lockoutRemainingSeconds - 1,
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [limitState.isLocked, limitState.lockoutRemainingSeconds])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (limitState.isLocked) {
      setErrorMessage(
        `Account is temporarily locked. Please wait ${loginLimiter.formatTime(
          limitState.lockoutRemainingSeconds
        )} before trying again.`
      )
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
      loginLimiter.recordSuccess()
      onLogin()
    } catch (error: any) {
      console.error("Login failed:", error)
      const newLimitState = loginLimiter.recordFailure(error)
      setLimitState(newLimitState)
      setErrorMessage(newLimitState.message || "Invalid username or password. Access denied.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex w-full h-full items-center justify-center"
      style={{ background: "linear-gradient(160deg, #0a1628 0%, #0d1f3c 50%, #091422 100%)" }}
    >
      {/* subtle grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Back button */}
      <motion.button
        onClick={onBack}
        className="absolute top-6 left-7 flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"
        style={{ fontFamily: "'Inter', sans-serif" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        whileHover={{ x: -2 }}
      >
        <ArrowLeft size={15} />
        <span>Back</span>
      </motion.button>

      <motion.div
        className="relative z-10 w-full max-w-sm px-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        {/* Logo */}
        <motion.div
          className="flex flex-col items-center mb-10"
          variants={fadeUp}
          custom={0}
          initial="hidden"
          animate="show"
        >
          <div className="relative mb-5">
            <div
              className="absolute inset-0 rounded-full blur-2xl"
              style={{ background: "rgba(56, 189, 248, 0.35)", transform: "scale(1.8)" }}
            />
            <img
              src={curaLogo}
              alt="CURA"
              className="relative h-20 w-20 object-contain transition-transform duration-300 hover:scale-105"
              style={{ filter: "drop-shadow(0 8px 24px rgba(56, 189, 248, 0.45))" }}
            />
          </div>
          <h1
            className="text-white text-2xl font-bold mb-1"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Welcome Back
          </h1>
          <p className="text-white/35 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
            Sign in to your CURA account
          </p>
        </motion.div>

        {/* Form card */}
        <motion.div
          className="rounded-2xl p-7"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          }}
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="show"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username */}
            <div>
              <label
                className="block text-white/50 text-xs font-medium mb-1.5 tracking-wide uppercase"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.12em" }}
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <User size={15} className="text-white/25" />
                </div>
                <input
                  type="text"
                  disabled={limitState.isLocked}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    if (errorMessage) setErrorMessage(null)
                  }}
                  placeholder="Enter your username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-white/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.09)",
                  }}
                  onFocus={(e) => {
                    if (limitState.isLocked) return
                    e.currentTarget.style.border = "1px solid rgba(27,108,168,0.7)"
                    e.currentTarget.style.background = "rgba(27,108,168,0.08)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.09)"
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)"
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-white/50 text-xs font-medium mb-1.5 tracking-wide uppercase"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.12em" }}
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock size={15} className="text-white/25" />
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
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-white text-sm placeholder-white/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.09)",
                  }}
                  onFocus={(e) => {
                    if (limitState.isLocked) return
                    e.currentTarget.style.border = "1px solid rgba(27,108,168,0.7)"
                    e.currentTarget.style.background = "rgba(27,108,168,0.08)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.09)"
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)"
                  }}
                />
                <button
                  type="button"
                  disabled={limitState.isLocked}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Lockout or Error banner */}
            {limitState.isLocked ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3 shadow-lg"
              >
                <ShieldAlert className="text-amber-400 shrink-0 mt-0.5" size={18} />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-300">Account Temporarily Locked</span>
                    <span className="font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded text-[11px]">
                      {loginLimiter.formatTime(limitState.lockoutRemainingSeconds)}
                    </span>
                  </div>
                  <p className="text-amber-200/80 text-[11px] leading-relaxed">
                    {errorMessage || `Too many failed login attempts. For security reasons, this account has been temporarily locked for 15 minutes.`}
                  </p>
                </div>
              </motion.div>
            ) : errorMessage ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-xl text-xs flex items-start gap-3 shadow-lg ${
                  limitState.attemptsRemaining <= 1
                    ? "bg-red-500/15 border border-red-500/30 text-red-200"
                    : "bg-amber-500/15 border border-amber-500/30 text-amber-200"
                }`}
              >
                <AlertTriangle
                  className={
                    limitState.attemptsRemaining <= 1
                      ? "text-red-400 shrink-0 mt-0.5"
                      : "text-amber-400 shrink-0 mt-0.5"
                  }
                  size={18}
                />
                <div className="flex-1 space-y-1">
                  <p className="font-bold text-xs leading-snug">
                    {limitState.attemptsRemaining <= 1 ? "Authentication Warning" : "Incorrect Credentials"}
                  </p>
                  <p className="text-[11px] leading-relaxed text-white/80">
                    {errorMessage}
                  </p>
                  {limitState.attemptsRemaining < MAX_LOGIN_ATTEMPTS && (
                    <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                      <span className="text-[10px] uppercase tracking-wider text-white/50">Attempts remaining:</span>
                      <div className="flex gap-1.5 items-center">
                        {Array.from({ length: MAX_LOGIN_ATTEMPTS }).map((_, idx) => (
                          <span
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx < limitState.attemptsRemaining
                                ? limitState.attemptsRemaining <= 1
                                  ? "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]"
                                  : "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                                : "bg-white/15"
                            }`}
                          />
                        ))}
                        <span className="text-[10px] font-bold text-white/70 ml-1">
                          ({limitState.attemptsRemaining} of {MAX_LOGIN_ATTEMPTS})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading || limitState.isLocked}
              className="relative mt-1 w-full py-3.5 rounded-xl text-white font-semibold text-sm overflow-hidden disabled:cursor-not-allowed"
              style={{
                fontFamily: "'Inter', sans-serif",
                background: limitState.isLocked
                  ? "rgba(180, 83, 9, 0.4)"
                  : loading
                  ? "rgba(27,108,168,0.5)"
                  : "linear-gradient(135deg, #1b6ca8 0%, #2d84cc 100%)",
                boxShadow:
                  loading || limitState.isLocked
                    ? "none"
                    : "0 4px 24px rgba(27, 108, 168, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
              whileHover={loading || limitState.isLocked ? {} : { scale: 1.02 }}
              whileTap={loading || limitState.isLocked ? {} : { scale: 0.98 }}
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
                <span className="flex items-center justify-center gap-2 text-amber-200">
                  <Lock size={15} />
                  Locked ({loginLimiter.formatTime(limitState.lockoutRemainingSeconds)})
                </span>
              ) : (
                "Login"
              )}
            </motion.button>
          </form>
        </motion.div>

        <motion.p
          className="text-center text-white/20 text-xs mt-6"
          style={{ fontFamily: "'Inter', sans-serif" }}
          variants={fadeUp}
          custom={2}
          initial="hidden"
          animate="show"
        >
          CURA · University of the Assumption · City of San Fernando, Pampanga
        </motion.p>
      </motion.div>
    </div>
  )
}

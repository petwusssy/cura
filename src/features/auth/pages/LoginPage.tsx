import { useState } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, ArrowLeft, Lock, User } from "lucide-react"
import curaLogo from "@/assets/images/cura-logo.png"
import { authService } from "@/services/authService"

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authService.login(username, password)
      onLogin()
    } catch (error) {
      console.error("Login failed:", error)
      // Displaying alert for simplicity, a toast would be better in a real app
      alert("Login failed. Please check your credentials.")
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
              style={{ background: "rgba(27, 108, 168, 0.5)", transform: "scale(1.6)" }}
            />
            <img src={curaLogo} alt="CURA" className="relative h-16 w-16 object-contain" />
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
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-white/20 outline-none transition-all"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.09)",
                  }}
                  onFocus={(e) => {
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-white text-sm placeholder-white/20 outline-none transition-all"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.09)",
                  }}
                  onFocus={(e) => {
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
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              className="relative mt-1 w-full py-3.5 rounded-xl text-white font-semibold text-sm overflow-hidden"
              style={{
                fontFamily: "'Inter', sans-serif",
                background: loading
                  ? "rgba(27,108,168,0.5)"
                  : "linear-gradient(135deg, #1b6ca8 0%, #2d84cc 100%)",
                boxShadow: loading ? "none" : "0 4px 24px rgba(27, 108, 168, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
              whileHover={loading ? {} : { scale: 1.02 }}
              whileTap={loading ? {} : { scale: 0.98 }}
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

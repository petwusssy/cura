import { useState, useEffect } from "react"
import { motion, AnimatePresence, useAnimation } from "framer-motion"
import {
  ChevronRight,
  User,
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
} from "lucide-react"
import uaLogo from "@/assets/images/ua-logo.png"
import campusBg from "@/features/landing/assets/uafacade.jpg"
import AnimatedMascot from "@/features/landing/components/AnimatedMascot"
import SpriteMascot from "@/features/landing/components/SpriteMascot"
import IdleMascot from "@/features/landing/components/IdleMascot"

interface Props {
  onLoginClick: () => void
  onSplitComplete: () => void
}

type Stage = "idle" | "form" | "splitting"

const ease = [0.32, 0.72, 0, 1] as const

export default function LandingPage({ onLoginClick, onSplitComplete }: Props) {
  const [stage, setStage] = useState<Stage>("idle")
  const blobControls = useAnimation()

  useEffect(() => {
    if (stage === "form" || stage === "idle") {
      blobControls.start({
        scale: [1, 3.5, 1],
        backgroundColor: stage === "idle" ? ["#082f6e", "#7aa0c0", "#ffffff"] : ["#ffffff", "#7aa0c0", "#082f6e"],
        transition: { duration: 0.8, times: [0, 0.5, 1], ease: "easeInOut" }
      })
    }
    if (stage === "splitting") {
      blobControls.start({
        scale: 6,
        transition: { duration: 0.8, ease: "easeInOut" }
      }).then(() => {
        onSplitComplete()
      })
    }
  }, [stage, blobControls, onSplitComplete])
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(null)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStage("splitting")
    }, 700)
  }


  const splitting = stage === "splitting"

  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {/* ── GLOBAL BACKGROUND ── */}
      <div className="absolute inset-0 z-0">
        {/* Campus background */}
        <img
          src={campusBg}
          alt="University of the Assumption campus"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Navy Blue Overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(0, 30, 80, 0.6)" }}
        />
      </div>

      {/* ── TOP LOGOS (FIXED WITH CROSSFADE) ── */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-12 z-30 pointer-events-none">
        <AnimatePresence>
          {(stage === "idle" || stage === "form") && (
            <motion.div
              key={stage}
              className="absolute top-0 left-0 flex items-center gap-2 lg:gap-3 w-max"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{ pointerEvents: "auto" }}
            >
              {/* UA Logo */}
              <img
                src={uaLogo}
                alt="University of the Assumption"
                className="object-contain w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32"
                style={{
                  filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.35))",
                }}
              />
              {/* UA Name */}
              <div
                className="flex flex-col justify-center text-left"
                style={{ color: stage === "idle" ? "#001e50" : "#ffffff" }}
              >
                <span className="font-extrabold text-[14px] sm:text-[20px] md:text-[26px] tracking-widest leading-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>UNIVERSITY OF THE</span>
                <span className="font-extrabold text-[14px] sm:text-[20px] md:text-[26px] tracking-widest leading-tight mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>ASSUMPTION</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── LEFT PANEL ── */}
      <motion.div
        className="relative z-10 flex flex-col justify-center w-full lg:w-1/2 h-full shrink-0"
        animate={{ x: stage === "idle" ? "0%" : (isDesktop ? "100%" : "0%") }}
        transition={{ duration: 0.8, ease }}
      >
        {/* Blobs (Large organic solid shapes without straight cuts) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden lg:overflow-visible" style={{ zIndex: -1 }}>
          {/* Light Blue Solid Blob */}
          <motion.div
            layout
            animate={blobControls}
            initial={{ backgroundColor: stage === "idle" ? "#ffffff" : "#082f6e" }}
            className="absolute w-[200vw] h-[200vw] lg:w-[990px] lg:h-[990px] rounded-full"
            style={{
              opacity: 1,
              top: isDesktop ? "-15%" : "calc(-100vw + 20vh)",
              left: isDesktop ? (stage !== "form" ? "-35%" : "auto") : "50%",
              right: isDesktop ? (stage === "form" ? "-35%" : "auto") : "auto",
              x: isDesktop ? 0 : "-50%",
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>

        {/* Content area */}
        <div className="relative z-10 px-6 sm:px-16 w-full h-full flex flex-col justify-center">

          <AnimatePresence mode="popLayout">
            {/* ── IDLE CONTENT ── */}
            {stage === "idle" && (
              <motion.div
                key="idle-content"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                className="mt-16 lg:mt-24"
              >
                <h1
                  className="leading-none mb-2 font-extrabold"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: "clamp(4rem, 12vw, 8.5rem)",
                    fontWeight: 800,
                    letterSpacing: "-0.01em",
                  }}
                >
                  <span className="text-[#001e50] transition-colors duration-500">C</span>
                  <span className="text-[#001e50] transition-colors duration-500">U</span>
                  <span className="text-[#001e50] transition-colors duration-500">R</span>
                  <span className="text-[#001e50] transition-colors duration-500">A</span>
                </h1>

                <p
                  className="text-[#001e50]/80 text-[10px] md:text-[11px] font-semibold tracking-widest uppercase mb-8 transition-colors duration-500"
                  style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.1em" }}
                >
                  Centralized University Healthcare Records and Administration
                </p>

                <p
                  className="text-[#001e50]/90 font-bold mb-12 transition-colors duration-500"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: "1.15rem",
                    letterSpacing: "0.01em",
                  }}
                >
                  Compassion. Care. Connected.
                </p>

                <motion.button
                  onClick={() => setStage("form")}
                  className="group flex items-center gap-3 px-8 py-3.5 rounded-xl font-semibold text-sm bg-[#1b6ca8] text-white hover:bg-[#ffb81c] hover:text-[#001e50] transition-colors duration-300"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span>Login to CURA</span>
                  <ChevronRight
                    size={16}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </motion.button>
              </motion.div>
            )}

            {/* ── FORM CONTENT ── */}
            {stage === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.3 } }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.3 } }}
                className="w-full h-full flex flex-col items-center justify-center px-6 lg:px-0 lg:pl-[20%]"
              >
                {/* Unified Mascot + Form Container */}
                <div className="relative flex flex-col items-center w-full max-w-[340px]">
                  
                  {/* Welcome Back Heading */}
                  <div className="mb-8 flex flex-col items-center text-center z-20 relative">
                    <h2
                      className="text-white lg:text-white font-extrabold mb-1 drop-shadow-md lg:drop-shadow-none"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "1.25rem",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Welcome Back
                    </h2>
                    <p
                      className="text-white/80 lg:text-white/70 text-xs font-medium"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      Sign in to your CURA account.
                    </p>
                  </div>

                  <div className="relative w-full">
                    {/* Mascot perched on the top-right edge of the card */}
                    <div className="absolute bottom-full right-0 lg:-right-6 translate-y-8 lg:translate-y-6 z-20 pointer-events-none -rotate-[4deg]">
                      <SpriteMascot focusedField={focusedField} className="w-[100px] lg:w-[140px] h-auto drop-shadow-[0_10px_10px_rgba(0,30,80,0.2)]" />
                    </div>

                    {/* Form card */}
                    <div
                      className="w-full rounded-[24px] p-6 sm:p-8 relative z-10 backdrop-blur-xl bg-white/20 lg:bg-[#F0F7FA] border border-white/40 lg:border-white shadow-[0_8px_32px_0_rgba(0,30,80,0.3)] lg:shadow-none"
                      style={{
                      }}
                    >
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    {/* Username */}
                    <div>
                      <label
                        className="block text-[#001e50]/70 font-bold mb-1.5 uppercase"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "10px",
                          letterSpacing: "0.12em",
                        }}
                      >
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          <User size={14} className="text-[#001e50]/40" />
                        </div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Enter your username"
                          className="w-full pl-10 pr-4 py-3.5 rounded-xl text-[#001e50] text-sm placeholder-[#001e50]/50 outline-none shadow-inner bg-white/80 lg:bg-white focus:bg-white transition-all"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            border: "1px solid rgba(168, 205, 229, 0.5)",
                            WebkitTextFillColor: "#001e50",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.border = "1px solid #1b6ca8"
                            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(27, 108, 168, 0.1)"
                            setFocusedField('username')
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.border = "1px solid #a8cde5"
                            e.currentTarget.style.boxShadow = "none"
                            setFocusedField(null)
                          }}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label
                        className="block text-[#001e50]/70 font-bold mb-1.5 uppercase"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "10px",
                          letterSpacing: "0.12em",
                        }}
                      >
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          <Lock size={14} className="text-[#001e50]/40" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full pl-10 pr-10 py-3.5 rounded-xl text-[#001e50] text-sm placeholder-[#001e50]/50 outline-none shadow-inner bg-white/80 lg:bg-white focus:bg-white transition-all"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            border: "1px solid rgba(168, 205, 229, 0.5)",
                            WebkitTextFillColor: "#001e50",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.border = "1px solid #1b6ca8"
                            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(27, 108, 168, 0.1)"
                            setFocusedField('password')
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.border = "1px solid #a8cde5"
                            e.currentTarget.style.boxShadow = "none"
                            setFocusedField(null)
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#001e50]/40 hover:text-[#001e50]/70 transition-colors"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={loading}
                      className={`relative mt-2 w-full py-3.5 rounded-xl font-bold text-sm transition-colors duration-300 ${
                        loading ? "bg-[#1b6ca8]/50 text-white" : "bg-[#1b6ca8] text-white hover:bg-[#ffb81c] hover:text-[#001e50]"
                      }`}
                      style={{
                        fontFamily: "'Inter', sans-serif",
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
                    </div>
                  </div>
                </div>

                {/* Back link */}
                <motion.button
                  onClick={() => setStage("idle")}
                  className="flex items-center gap-1.5 text-white/30 hover:text-white/55 transition-colors text-xs mt-4"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  whileHover={{ x: -2 }}
                >
                  <ArrowLeft size={12} />
                  Back
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── RIGHT PANEL (Empty Placeholder) ── */}
      <motion.div
        className="hidden lg:flex relative items-center justify-center w-1/2 h-full overflow-hidden shrink-0"
        animate={{ x: stage === "splitting" ? "-200%" : stage === "form" ? "-100%" : "0%" }}
        transition={{ duration: 0.8, ease }}
      />

      {/* ── UA TAGLINE (Centered in Empty Space, Avoids Blob) ── */}
      <motion.div
        layout
        className="absolute bottom-6 lg:bottom-12 z-20 flex flex-col px-6 lg:px-0 w-full lg:w-auto items-center lg:items-start text-center lg:text-left"
        style={{
          left: isDesktop ? (stage === "form" ? "auto" : "51%") : "0",
          right: isDesktop ? (stage === "form" ? "45%" : "auto") : "0",
        }}
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0 }}
            animate={{ opacity: stage === "splitting" ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-white/95 text-xs sm:text-sm md:text-base lg:text-[17px] font-bold leading-relaxed drop-shadow-md" style={{ fontFamily: "'Inter', sans-serif" }}>
              The First Catholic Archdiocesan <br />
              University in the Philippines and in Asia.
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

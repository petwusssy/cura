import { useEffect } from "react"
import { AppRouter } from "@/routes"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  useEffect(() => {
    try {
      const savedSize = localStorage.getItem('cura_font_size')
      if (savedSize === '14px' || savedSize === '16px' || savedSize === '18px') {
        document.documentElement.style.fontSize = savedSize
      }
    } catch {}
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} themes={['light', 'dark', 'ocean', 'system']}>
      <div className="relative w-full h-full overflow-hidden bg-bg-base text-text-base transition-colors duration-300">
        <AppRouter />
        <Toaster position="top-right" richColors closeButton />
      </div>
    </ThemeProvider>
  )
}


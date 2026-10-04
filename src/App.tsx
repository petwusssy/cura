import { AppRouter } from "@/routes"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem themes={['light', 'dark', 'ocean']}>
      <div className="relative w-full h-full overflow-hidden bg-bg-base text-text-base transition-colors duration-300">
        <AppRouter />
        <Toaster position="top-right" richColors />
      </div>
    </ThemeProvider>
  )
}


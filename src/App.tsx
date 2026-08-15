import { AppRouter } from "@/routes"
import { ThemeProvider } from "next-themes"

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem themes={['light', 'dark', 'ocean']}>
      <div className="relative w-full h-full overflow-hidden bg-bg-base text-text-base transition-colors duration-300">
        <AppRouter />
      </div>
    </ThemeProvider>
  )
}


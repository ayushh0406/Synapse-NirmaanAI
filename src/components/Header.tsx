import { Moon, Sun, Download, Settings, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';

interface HeaderProps {
  onSidebarToggle: () => void;
  isSidebarOpen: boolean;
  onBrandSettingsOpen: () => void;
}

export function Header({ onSidebarToggle, isSidebarOpen, onBrandSettingsOpen }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { setCurrentPrompt } = useStore();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogoClick = () => {
    setCurrentPrompt('');
  };

  return (
    <header className="border-b h-16 px-6 flex items-center justify-between bg-background">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          className="mr-2"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center neobrutalist-border">
            <span className="text-primary-foreground font-bold text-xl">☀</span>
          </div>
          <span className="font-bold text-2xl tracking-tight">NirmaanAI UI Generator</span>
        </button>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3"
      >
        <Button variant="outline" size="icon" className="neobrutalist-border w-10 h-10" onClick={onBrandSettingsOpen}>
          <Settings className="h-4 w-4" />
        </Button>
        {mounted && (
          <Button
            variant="outline"
            size="icon"
            className="neobrutalist-border w-10 h-10"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
        )}
      </motion.div>
    </header>
  );
}
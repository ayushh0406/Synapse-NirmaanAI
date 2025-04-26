import { FC } from 'react';
import { Button } from './ui/button';
import { 
  Home, 
  Settings, 
  History, 
  Palette, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onOpenBrandSettings: () => void;
}

export const Sidebar: FC<SidebarProps> = ({ 
  isOpen, 
  onToggle,
  onOpenBrandSettings
}) => {
  const { history } = useStore();

  return (
    <div className="h-full bg-card border-r border-border flex flex-col w-full">
      {/* Logo and app name */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center">
          <Sparkles className="h-5 w-5 text-primary mr-2" />
          <h1 className="text-lg font-bold">NirmaanAI</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">AI-powered UI generator</p>
      </div>

      {/* Navigation */}
      <nav className="p-2 flex-1">
        <Button variant="ghost" className="w-full justify-start mb-2">
          <Home className="mr-2 h-4 w-4" />
          Home
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start mb-2"
          onClick={onOpenBrandSettings}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Product Card Generator
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </nav>

      {/* History */}
      <div className="p-2 border-t border-border">
        <h2 className="text-sm font-semibold mb-2 flex items-center">
          <History className="mr-2 h-4 w-4" />
          Recent Generations
        </h2>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {history.length > 0 ? (
            history.slice(0, 5).map(item => (
              <div 
                key={item.id} 
                className="text-xs p-2 rounded hover:bg-secondary cursor-pointer truncate"
              >
                {item.prompt}
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground p-2">No history yet</p>
          )}
        </div>
      </div>
    </div>
  );
};
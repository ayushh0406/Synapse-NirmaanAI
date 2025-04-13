import { FC } from 'react';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';

export const Navbar: FC = () => {
  const { userSettings } = useStore();

  return (
    <div className="w-full h-14 border-b border-border p-6 flex items-center justify-between bg-background">
      <div className="flex items-center space-x-2">
        <div className="font-bold text-xl">NirmaanAI</div>
        <div className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
          Beta
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <ModeToggle />
        <Button variant="outline" size="sm">
          {userSettings.username || 'User'}
        </Button>
      </div>
    </div>
  );
};

import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Code, Layout, Palette } from 'lucide-react';
import Typewriter from 'typewriter-effect';

interface HeroSectionProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
}

export const HeroSection: FC<HeroSectionProps> = ({ prompt, setPrompt, onSubmit, isGenerating }) => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 p-8">
      {/* Animated background shapes */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div 
          className="absolute top-20 left-20 w-32 h-32 bg-primary/20 rounded-full"
          animate={{ 
            x: [0, 30, 0], 
            y: [0, -30, 0] 
          }}
          transition={{
            repeat: Infinity,
            duration: 8,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 right-32 w-40 h-40 bg-primary/10 rounded-full"
          animate={{ 
            x: [0, -40, 0], 
            y: [0, 20, 0] 
          }}
          transition={{
            repeat: Infinity,
            duration: 10,
            ease: "easeInOut"
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="inline-block neobrutalist-border bg-white dark:bg-black p-2 px-4 mb-4 rotate-[-1deg]">
          <span className="text-sm font-bold">⚡ AI-POWERED UI GENERATOR</span>
        </div>
        <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight min-h-[120px]">
          <Typewriter
            options={{
              strings: ['Transform Text into <span class="text-primary">Beautiful UI</span>'],
              autoStart: true,
              loop: false,
              delay: 50,
              deleteSpeed: 50, 
              cursor: '|',
              html: true,
              wrapperClassName: "typewriter-wrapper",
              cursorClassName: "typewriter-cursor",
              pauseFor: 5000,  // Keep the text visible for 5 seconds before looping
              onComplete: (typewriter) => {
                // Make sure the completed text stays visible
                return typewriter;
              }
            }}
          />
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Enter a description, and watch as AI generates a complete React application with Tailwind CSS styling in seconds.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-3xl mb-12"
      >
        <div className="neobrutalist-card p-4 rotate-[0.5deg]">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Create a landing page for a sneaker store with a hero section, product showcase, and newsletter signup..."
            className="w-full h-36 p-4 rounded-lg border-[3px] border-black dark:border-white bg-background focus:outline-none resize-none"
            disabled={isGenerating}
          />
          <div className="flex justify-end mt-4">
            <Button
              onClick={onSubmit}
              className="neobrutalist-button px-8 py-6 text-lg"
              disabled={isGenerating || !prompt.trim()}
              size="lg"
            >
              {isGenerating ? (
                'Generating...'
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" /> Generate UI
                </>
              )}
            </Button>
          </div>
          <div className="mt-4 text-sm text-muted-foreground text-left">
            <p>Try: "Create a pricing page with 3 tiers of pricing and a FAQ section" ✨</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl"
      >
        <FeatureBadge 
          title="Full React App" 
          description="Complete, working React application" 
          icon={<Code />}
          color="bg-blue-100 dark:bg-blue-900/30"
          rotation="-rotate-1"
        />
        <FeatureBadge 
          title="Tailwind CSS" 
          description="Modern, responsive styling" 
          icon={<Palette />}
          color="bg-green-100 dark:bg-green-900/30"
          rotation="rotate-1"
        />
        <FeatureBadge 
          title="Code Export" 
          description="Download your project" 
          icon={<Zap />}
          color="bg-yellow-100 dark:bg-yellow-900/30"
          rotation="-rotate-2"
        />
        <FeatureBadge 
          title="Live Preview" 
          description="See your UI in action" 
          icon={<Layout />}
          color="bg-purple-100 dark:bg-purple-900/30"
          rotation="rotate-2"
        />
      </motion.div>
    </div>
  );
};

interface FeatureBadgeProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  rotation: string;
}

const FeatureBadge: FC<FeatureBadgeProps> = ({ title, description, icon, color, rotation }) => (
  <div className={`neobrutalist-card ${color} ${rotation}`}>
    <div className="p-6 flex flex-col items-center text-center">
      <div className="p-3 bg-white dark:bg-black rounded-full border-2 border-black dark:border-white mb-3">
        {icon}
      </div>
      <h3 className="font-bold">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  </div>
);
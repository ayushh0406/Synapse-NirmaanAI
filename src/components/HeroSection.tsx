import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          <Typewriter
            options={{
              strings: ['Transform Text into <span class="text-primary">Beautiful UI</span>'],
              autoStart: true,
              loop: false,
              delay: 60,
              cursor: '|',
              html: true,
            }}
          />
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Enter a description, and watch as AI generates a complete React application with Tailwind CSS styling in seconds.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-3xl"
      >
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Create a landing page for a sneaker store with a hero section, product showcase, and newsletter signup..."
            className="w-full h-36 p-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none resize-none"
            disabled={isGenerating}
          />
          <Button
            onClick={onSubmit}
            className="absolute bottom-4 right-4 neobrutalist-button"
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              'Generating...'
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Generate
              </>
            )}
          </Button>
        </div>
        <div className="mt-4 text-sm text-muted-foreground text-left">
          <p>Try: "Create a pricing page with 3 tiers of pricing"</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <FeatureBadge title="Full React App" description="Complete, working React application" />
        <FeatureBadge title="Tailwind CSS" description="Modern, responsive styling" />
        <FeatureBadge title="Code Export" description="Download your project" />
        <FeatureBadge title="Live Preview" description="See your UI in action" />
      </motion.div>
    </div>
  );
};

interface FeatureBadgeProps {
  title: string;
  description: string;
}

const FeatureBadge: FC<FeatureBadgeProps> = ({ title, description }) => (
  <div className="flex flex-col items-center p-4 border border-border rounded-lg bg-card">
    <h3 className="font-semibold">{title}</h3>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);
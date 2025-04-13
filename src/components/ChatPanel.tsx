import { FC, useRef, useEffect, useState } from 'react';
import { Send, Clipboard, CheckCheck } from 'lucide-react';
import { Button } from './ui/button';
import { useStore, Message as MessageType, MessageType as MsgType } from '@/lib/store';
import { Avatar } from './ui/avatar';
import { AvatarFallback } from './ui/avatar';
import { cn } from '@/lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatPanelProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
}

export const ChatPanel: FC<ChatPanelProps> = ({ 
  prompt, 
  setPrompt, 
  onSubmit,
  isGenerating
}) => {
  const { getConversationMessages } = useStore();
  const messages = getConversationMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="neobrutalist-card bg-muted/30 p-8 rotate-1">
              <p className="font-bold">No messages yet</p>
              <p className="text-sm mt-2">Start by entering a prompt below</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <Message 
              key={message.id} 
              message={message} 
              onCopy={(content) => copyToClipboard(content, message.id)}
              isCopied={copiedId === message.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form 
        onSubmit={handleSubmit}
        className="p-3 border-t-[3px] border-black dark:border-white bg-background"
      >
        <div className="flex items-center">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask for UI changes or new components..."
            className="neobrutalist-input flex-1 text-sm"
            disabled={isGenerating}
          />
          <Button 
            type="submit" 
            className="ml-2 neobrutalist-button h-11" 
            disabled={isGenerating || !prompt.trim()}
          >
            <Send size={16} />
          </Button>
        </div>
        {isGenerating && (
          <div className="text-xs text-muted-foreground mt-1">
            Generating UI code...
          </div>
        )}
      </form>
    </div>
  );
};

interface MessageProps {
  message: MessageType;
  onCopy: (content: string) => void;
  isCopied: boolean;
}

const Message: FC<MessageProps> = ({ message, onCopy, isCopied }) => {
  const [showCode, setShowCode] = useState(false);
  
  // Format the timestamp
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Message styling based on role
  const messageStyles = message.role === 'user'
    ? 'bg-primary/10 border-[2px] border-black dark:border-white -rotate-0.5'
    : message.type === 'error'
      ? 'bg-destructive/10 border-[2px] border-black dark:border-white rotate-0.5'
      : 'bg-secondary/20 border-[2px] border-black dark:border-white rotate-0.5';
  
  // Render different content based on message type
  const renderContent = () => {
    // For code blocks
    if (message.type === 'code' && message.files && message.files.length > 0) {
      const file = message.files[0]; // Just show the first file by default
      
      return (
        <div className="w-full">
          <div className="flex justify-between items-center mb-1">
            <div className="text-sm font-mono font-bold">{file.path}</div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-6 neobrutalist-border py-0 px-2"
                onClick={() => setShowCode(!showCode)}
              >
                {showCode ? 'Hide Code' : 'Show Code'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 neobrutalist-border py-0 px-2"
                onClick={() => onCopy(file.content)}
              >
                {isCopied ? <CheckCheck size={14} /> : <Clipboard size={14} />}
              </Button>
            </div>
          </div>
          
          {showCode && (
            <div className="relative rounded-md overflow-hidden max-h-[300px] overflow-y-auto neobrutalist-border">
              <SyntaxHighlighter
                language={file.language}
                style={vscDarkPlus}
                customStyle={{ margin: 0, fontSize: '0.8rem' }}
              >
                {file.content}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      );
    }
    
    // For summary messages (default)
    return (
      <div className="text-sm text-left whitespace-pre-wrap">
        {message.content}
      </div>
    );
  };
  
  return (
    <div className={cn(
      "flex mb-6 gap-3",
      message.role === 'assistant' ? 'justify-start' : 'justify-start'
    )}>
      <Avatar className="mt-1 h-10 w-10 neobrutalist-border">
        <AvatarFallback className={message.role === 'user' ? 'bg-primary/20' : 'bg-secondary/20'}>
          {message.role === 'user' ? 'U' : 'AI'}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col max-w-[85%]">
        <div className="flex items-center gap-2 mb-1">
          <div className="font-bold text-sm">
            {message.role === 'user' ? 'You' : 'Assistant'}
          </div>
          <div className="text-xs text-muted-foreground">
            {formattedTime}
          </div>
        </div>
        <div className={cn(
          "p-3 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]",
          messageStyles
        )}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
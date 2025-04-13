import { FC, useRef, useEffect, useState } from 'react';
import { Send, X, ChevronDown, ChevronUp, Code, Clipboard, CheckCheck } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);
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
    <div className={cn(
      "flex flex-col h-full border-t border-border transition-height duration-300",
      isExpanded ? "h-[75vh]" : "h-full"
    )}>
      <div className="flex justify-between items-center p-2 border-b border-border bg-muted/30">
        <h2 className="text-base font-semibold">Chat</h2>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </Button>
        </div>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>No messages yet</p>
            <p className="text-sm">Start by entering a prompt below</p>
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
        className="p-3 border-t border-border bg-background"
      >
        <div className="flex items-center">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask for UI changes or new components..."
            className="flex-1 p-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isGenerating}
          />
          <Button 
            type="submit" 
            className="ml-2" 
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
  
  // Render different content based on message type
  const renderContent = () => {
    // For code blocks
    if (message.type === 'code' && message.files && message.files.length > 0) {
      const file = message.files[0]; // Just show the first file by default
      
      return (
        <div className="w-full">
          <div className="flex justify-between items-center mb-1">
            <div className="text-sm text-muted-foreground">{file.path}</div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowCode(!showCode)}
              >
                <Code size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onCopy(file.content)}
              >
                {isCopied ? <CheckCheck size={14} /> : <Clipboard size={14} />}
              </Button>
            </div>
          </div>
          
          {showCode && (
            <div className="relative rounded-md overflow-hidden max-h-[300px] overflow-y-auto">
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
      "flex mb-4 gap-2",
      message.role === 'assistant' ? 'justify-start' : 'justify-start'
    )}>
      <Avatar className="mt-1 h-8 w-8">
        <AvatarFallback className={message.role === 'user' ? 'bg-primary/20' : 'bg-secondary/20'}>
          {message.role === 'user' ? 'U' : 'AI'}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col max-w-[85%]">
        <div className="flex items-center gap-2">
          <div className="font-medium text-sm">
            {message.role === 'user' ? 'You' : 'Assistant'}
          </div>
          <div className="text-xs text-muted-foreground">
            {formattedTime}
          </div>
        </div>
        <div className={cn(
          "mt-1 p-3 rounded-lg",
          message.role === 'user' 
            ? 'bg-primary/10' 
            : message.type === 'error' 
              ? 'bg-destructive/10' 
              : 'bg-secondary/20'
        )}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
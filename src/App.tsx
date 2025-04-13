import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { HeroSection } from '@/components/HeroSection';
import { ChatPanel } from '@/components/ChatPanel';
import { PreviewPane } from '@/components/PreviewPane';
import { BrandSettings } from '@/components/BrandSettings';
import { FileExplorer } from '@/components/FileExplorer';
import { CodeEditor } from '@/components/CodeEditor';
import { useStore } from '@/lib/store';
import { generateUI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ThemeProvider } from 'next-themes';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Code, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBrandSettingsOpen, setIsBrandSettingsOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState("");
  const [showHero, setShowHero] = useState(true);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const {
    currentPrompt,
    setCurrentPrompt,
    setGeneratedCode,
    isGenerating,
    setIsGenerating,
    addToHistory,
    brandSettings,
    generatedFiles,
    setGeneratedFiles,
    
    // New conversation API
    createConversation,
    addMessageToConversation,
    updateConversationFiles,
    getCurrentConversation,
    currentConversationId,
    getConversationMessages
  } = useStore();
  const { toast } = useToast();

  const handlePromptSubmit = async () => {
    if (!currentPrompt.trim()) return;

    setIsGenerating(true);
    console.log("Starting generation with prompt:", currentPrompt);
    
    // Create a new conversation if we don't have one
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = createConversation(currentPrompt);
      console.log("Created new conversation:", conversationId);
    }
    
    // Add user message
    addMessageToConversation(conversationId, { 
      role: 'user', 
      content: currentPrompt,
      type: 'prompt'
    });

    try {
      // Get existing messages for context
      const conversationMessages = getConversationMessages();
      console.log("Using conversation context with", conversationMessages.length, "messages");
      
      // Generate UI with conversation context
      console.log("Calling generateUI...");
      const result = await generateUI(currentPrompt, brandSettings, conversationMessages);
      console.log("Generation complete:", result ? "Success" : "Failed");
      
      if (!result || !result.files || result.files.length === 0) {
        throw new Error("No files were generated");
      }
      
      // Set generated code and files
      setGeneratedCode(result.rawResponse);
      setGeneratedFiles(result.files);
      updateConversationFiles(conversationId, result.files);
      console.log("Updated files in store:", result.files.length, "files");
      
      // Add assistant's summary message
      addMessageToConversation(conversationId, {
        role: 'assistant',
        content: result.summary || "I've generated some UI code based on your request.",
        type: 'summary'
      });
      
      // Add code messages for each important file
      const mainFiles = result.files.filter(f => 
        f.path.includes('App.') || 
        f.path.endsWith('.jsx') || 
        f.path.endsWith('.tsx')
      ).slice(0, 3);
      
      if (mainFiles.length > 0) {
        addMessageToConversation(conversationId, {
          role: 'assistant',
          content: 'Here are the key files I generated:',
          type: 'code',
          files: mainFiles
        });
      }
      
      // Save to history
      addToHistory({
        prompt: currentPrompt,
        code: result.rawResponse,
        preview: '',
      });
      
      // Show success message
      toast({
        title: "UI Generated Successfully",
        description: `Created ${result.files.length} files`,
      });
      
      // Clear the prompt and hide hero section
      setCurrentPrompt('');
      setShowHero(false);
    } catch (error) {
      console.error('Error generating UI:', error);
      
      // Add error message
      addMessageToConversation(conversationId, {
        role: 'assistant',
        content: `Sorry, there was an error generating your UI: ${error.message || "Unknown error"}. Please try again.`,
        type: 'error'
      });
      
      // Show error toast
      toast({
        title: "Error",
        description: `Failed to generate UI: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleBrandSettings = () => {
    setIsBrandSettingsOpen(!isBrandSettingsOpen);
  };

  return (
    <ThemeProvider attribute="class">
      <div className="flex h-screen w-screen overflow-hidden">
        {/* Sliding Sidebar */}
        <div className={cn(
          "h-full transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-64" : "w-0"
        )}>
          {isSidebarOpen && (
            <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} onOpenBrandSettings={toggleBrandSettings} />
          )}
        </div>
        
        {/* Toggle sidebar button */}
        <button 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-background border border-border p-1 rounded-r-md z-20"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Main content */}
        <div className="flex flex-1 h-full overflow-hidden">
          {/* Navbar */}
          <div className="absolute top-0 left-0 right-0 z-10">
            <Navbar />
          </div>

          {showHero ? (
            <HeroSection 
              onSubmit={handlePromptSubmit} 
              prompt={currentPrompt} 
              setPrompt={setCurrentPrompt}
              isGenerating={isGenerating}
            />
          ) : (
            <div className="flex w-full h-full pt-14">
              {/* Chat section (left) */}
              <div className="w-1/3 h-full border-r border-border overflow-hidden">
                <ChatPanel 
                  onSubmit={handlePromptSubmit}
                  prompt={currentPrompt}
                  setPrompt={setCurrentPrompt}
                  isGenerating={isGenerating}
                />
              </div>
              
              {/* Code/Preview section (right) */}
              <div className="w-2/3 h-full flex flex-col">
                {/* Toggle between code and preview */}
                <div className="flex border-b border-border">
                  <Button 
                    variant={activeTab === 'code' ? 'default' : 'ghost'}
                    className="flex-1 rounded-none"
                    onClick={() => setActiveTab('code')}
                  >
                    <Code className="mr-2 h-4 w-4" /> Code
                  </Button>
                  <Button
                    variant={activeTab === 'preview' ? 'default' : 'ghost'}
                    className="flex-1 rounded-none"
                    onClick={() => setActiveTab('preview')}
                  >
                    <Play className="mr-2 h-4 w-4" /> Preview
                  </Button>
                </div>
                
                {/* Content area */}
                <div className="flex-1 overflow-hidden">
                  {activeTab === 'code' && (
                    <div className="flex h-full">
                      {/* File explorer */}
                      <div className="w-64 h-full overflow-y-auto border-r border-border">
                        <FileExplorer 
                          files={generatedFiles} 
                          currentFile={currentFile} 
                          onSelectFile={setCurrentFile} 
                        />
                      </div>
                      
                      {/* Code editor */}
                      <div className="flex-1 overflow-hidden">
                        <CodeEditor 
                          file={generatedFiles.find(f => f.path === currentFile) || null} 
                        />
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'preview' && (
                    <PreviewPane />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Brand Settings Modal */}
        {isBrandSettingsOpen && (
          <BrandSettings onClose={toggleBrandSettings} />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
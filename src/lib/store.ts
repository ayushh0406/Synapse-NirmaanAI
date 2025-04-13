import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BrandSettings {
  logo?: File;
  productImage?: File;
  font: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  code: string;
  preview: string;
  timestamp: number;
  brandSettings?: BrandSettings;
}

export interface UserSettings {
  username: string;
  email?: string;
  avatar?: string;
  editorTheme: 'light' | 'dark';
  defaultModel: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

export type MessageType = 'prompt' | 'summary' | 'code' | 'error';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: MessageType;
  timestamp: number;
  files?: GeneratedFile[];
}

export interface Conversation {
  id: string;
  messages: Message[];
  initialPrompt: string;
  latestFiles: GeneratedFile[];
  created: number;
  updated: number;
}

interface AppState {
  currentPrompt: string;
  generatedCode: string;
  isGenerating: boolean;
  history: HistoryItem[];
  brandSettings: BrandSettings;
  userSettings: UserSettings;
  messages: Message[];
  generatedFiles: GeneratedFile[];
  conversations: Conversation[];
  currentConversationId: string | null;
  
  // Actions
  setCurrentPrompt: (prompt: string) => void;
  setGeneratedCode: (code: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  setBrandSettings: (settings: Partial<BrandSettings>) => void;
  setUserSettings: (settings: Partial<UserSettings>) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setGeneratedFiles: (files: GeneratedFile[]) => void;
  
  // Conversation management
  createConversation: (initialPrompt: string) => string;
  addMessageToConversation: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateConversationFiles: (conversationId: string, files: GeneratedFile[]) => void;
  setCurrentConversation: (id: string | null) => void;
  getCurrentConversation: () => Conversation | null;
  getConversationMessages: () => Message[];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentPrompt: '',
      generatedCode: '',
      isGenerating: false,
      history: [],
      brandSettings: {
        font: 'Space Grotesk',
        primaryColor: '#FF6B00',
        secondaryColor: '#000000',
      },
      userSettings: {
        username: 'Guest User',
        editorTheme: 'light',
        defaultModel: 'meta-llama/llama-4-maverick-17b-128e-instruct',
      },
      messages: [],
      generatedFiles: [],
      conversations: [],
      currentConversationId: null,
      
      setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
      setGeneratedCode: (code) => set({ generatedCode: code }),
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      
      addToHistory: (item) =>
        set((state) => ({
          history: [
            {
              ...item,
              id: Math.random().toString(36).substring(7),
              timestamp: Date.now(),
            },
            ...state.history,
          ],
        })),
        
      setBrandSettings: (settings) =>
        set((state) => ({
          brandSettings: { ...state.brandSettings, ...settings },
        })),
        
      setUserSettings: (settings) =>
        set((state) => ({
          userSettings: { ...state.userSettings, ...settings },
        })),
        
      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages, 
            {
              ...message,
              id: Math.random().toString(36).substring(7),
              timestamp: Date.now(),
            }
          ],
        })),
        
      clearMessages: () => set({ messages: [] }),
      
      setGeneratedFiles: (files) => set({ generatedFiles: files }),
      
      // Conversation management
      createConversation: (initialPrompt) => {
        const id = Math.random().toString(36).substring(7);
        const now = Date.now();
        const newConversation = {
          id,
          messages: [],
          initialPrompt,
          latestFiles: [],
          created: now,
          updated: now
        };
        
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: id
        }));
        
        return id;
      },
      
      addMessageToConversation: (conversationId, message) => {
        set((state) => {
          const newMsg = {
            ...message,
            id: Math.random().toString(36).substring(7),
            timestamp: Date.now()
          };
          
          const updatedConversations = state.conversations.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                messages: [...conv.messages, newMsg],
                updated: Date.now()
              };
            }
            return conv;
          });
          
          return { 
            conversations: updatedConversations,
            // Also add to the global messages for backward compatibility
            messages: [...state.messages, newMsg]
          };
        });
      },
      
      updateConversationFiles: (conversationId, files) => {
        set((state) => {
          const updatedConversations = state.conversations.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                latestFiles: files,
                updated: Date.now()
              };
            }
            return conv;
          });
          
          return { 
            conversations: updatedConversations,
            // Update global files too
            generatedFiles: files
          };
        });
      },
      
      setCurrentConversation: (id) => set({ currentConversationId: id }),
      
      getCurrentConversation: () => {
        const { currentConversationId, conversations } = get();
        return conversations.find(c => c.id === currentConversationId) || null;
      },
      
      getConversationMessages: () => {
        const conversation = get().getCurrentConversation();
        return conversation ? conversation.messages : get().messages;
      }
    }),
    {
      name: 'synapse-storage',
      version: 1,
    }
  )
);
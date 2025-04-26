import { GeneratedFile } from './api';

export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageType = 'prompt' | 'summary' | 'code' | 'error';

export interface Message {
  role: MessageRole;
  content: string;
  type: MessageType;
  files?: GeneratedFile[];
  timestamp?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  files: GeneratedFile[];
  createdAt: number;
  updatedAt: number;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  code: string;
  preview: string;
  timestamp: number;
}
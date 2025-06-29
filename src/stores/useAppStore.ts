import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  capabilities: string[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'agent' | 'decision' | 'data' | 'output';
  agentId?: string;
  dependencies: string[];
  config: Record<string, any>;
}

export interface Framework {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  useCase: string;
  popularity: number;
  lastUpdated: string;
}

interface AppState {
  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;
  
  // Project
  projectName: string;
  setProjectName: (name: string) => void;
  
  // Framework
  selectedFramework: string;
  setSelectedFramework: (framework: string) => void;
  
  // Agents
  agents: Agent[];
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, agent: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  
  // Workflow
  workflowSteps: WorkflowStep[];
  setWorkflowSteps: (steps: WorkflowStep[]) => void;
  
  // Input mode
  inputMode: 'voice' | 'form';
  setInputMode: (mode: 'voice' | 'form') => void;
  
  // Voice
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  voiceTranscript: string;
  setVoiceTranscript: (transcript: string) => void;
  
  // RAG Data
  ragDataLastUpdated: string;
  setRagDataLastUpdated: (date: string) => void;
  
  // API Keys
  apiKeys: Record<string, string>;
  setApiKey: (service: string, key: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      isDarkMode: false,
      toggleTheme: () => set({ isDarkMode: !get().isDarkMode }),
      
      // Project
      projectName: '',
      setProjectName: (name: string) => set({ projectName: name }),
      
      // Framework
      selectedFramework: '',
      setSelectedFramework: (framework: string) => set({ selectedFramework: framework }),
      
      // Agents
      agents: [],
      addAgent: (agent: Agent) => set({ agents: [...get().agents, agent] }),
      updateAgent: (id: string, updates: Partial<Agent>) => 
        set({ 
          agents: get().agents.map(agent => 
            agent.id === id ? { ...agent, ...updates } : agent
          )
        }),
      removeAgent: (id: string) => 
        set({ agents: get().agents.filter(agent => agent.id !== id) }),
      
      // Workflow
      workflowSteps: [],
      setWorkflowSteps: (steps: WorkflowStep[]) => set({ workflowSteps: steps }),
      
      // Input mode
      inputMode: 'form',
      setInputMode: (mode: 'voice' | 'form') => set({ inputMode: mode }),
      
      // Voice
      isListening: false,
      setIsListening: (listening: boolean) => set({ isListening: listening }),
      voiceTranscript: '',
      setVoiceTranscript: (transcript: string) => set({ voiceTranscript: transcript }),
      
      // RAG Data
      ragDataLastUpdated: '',
      setRagDataLastUpdated: (date: string) => set({ ragDataLastUpdated: date }),
      
      // API Keys
      apiKeys: {},
      setApiKey: (service: string, key: string) => 
        set({ apiKeys: { ...get().apiKeys, [service]: key } }),
    }),
    {
      name: 'multiagent-app-storage',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        projectName: state.projectName,
        selectedFramework: state.selectedFramework,
        agents: state.agents,
        workflowSteps: state.workflowSteps,
        ragDataLastUpdated: state.ragDataLastUpdated,
        apiKeys: state.apiKeys,
      }),
    }
  )
);
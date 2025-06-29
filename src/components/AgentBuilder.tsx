import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Bot, Edit3, Save, X } from 'lucide-react';
import { useAppStore, Agent } from '../stores/useAppStore';
import { securityService } from '../services/security';

export const AgentBuilder: React.FC = () => {
  const { isDarkMode, agents, addAgent, updateAgent, removeAgent } = useAppStore();
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAgent, setNewAgent] = useState<Partial<Agent>>({
    name: '',
    role: '',
    description: '',
    capabilities: []
  });

  const handleAddAgent = async () => {
    if (!newAgent.name || !newAgent.role || !newAgent.description) return;

    const agent: Agent = {
      id: await securityService.generateSecureId(),
      name: newAgent.name,
      role: newAgent.role,
      description: newAgent.description,
      capabilities: newAgent.capabilities || []
    };

    addAgent(agent);
    setNewAgent({ name: '', role: '', description: '', capabilities: [] });
    setShowAddForm(false);
  };

  const handleUpdateAgent = (id: string, updates: Partial<Agent>) => {
    updateAgent(id, updates);
    setEditingAgent(null);
  };

  const handleAddCapability = (capabilities: string[], newCapability: string) => {
    if (newCapability.trim() && !capabilities.includes(newCapability.trim())) {
      return [...capabilities, newCapability.trim()];
    }
    return capabilities;
  };

  const handleRemoveCapability = (capabilities: string[], capability: string) => {
    return capabilities.filter(c => c !== capability);
  };

  const AgentCard: React.FC<{ agent: Agent }> = ({ agent }) => {
    const [editForm, setEditForm] = useState(agent);
    const [newCapability, setNewCapability] = useState('');
    const isEditing = editingAgent === agent.id;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`rounded-xl border transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' 
            : 'bg-white border-gray-200 hover:bg-gray-50'
        }`}
      >
        <div className="p-6">
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                placeholder="Agent Name"
              />
              
              <input
                type="text"
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                placeholder="Agent Role"
              />
              
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                rows={3}
                placeholder="Agent Description"
              />
              
              <div>
                <label className="block text-sm font-medium mb-2">Capabilities</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editForm.capabilities.map((capability, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 text-sm rounded-full cursor-pointer ${
                        isDarkMode 
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                          : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                      }`}
                      onClick={() => setEditForm({
                        ...editForm,
                        capabilities: handleRemoveCapability(editForm.capabilities, capability)
                      })}
                    >
                      {capability} ×
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCapability}
                    onChange={(e) => setNewCapability(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                    placeholder="Add capability"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        setEditForm({
                          ...editForm,
                          capabilities: handleAddCapability(editForm.capabilities, newCapability)
                        });
                        setNewCapability('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      setEditForm({
                        ...editForm,
                        capabilities: handleAddCapability(editForm.capabilities, newCapability)
                      });
                      setNewCapability('');
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleUpdateAgent(agent.id, editForm)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setEditingAgent(null)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                    isDarkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    isDarkMode ? 'bg-indigo-600' : 'bg-indigo-100'
                  }`}>
                    <Bot className={`w-5 h-5 ${
                      isDarkMode ? 'text-white' : 'text-indigo-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{agent.name}</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                      {agent.role}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingAgent(agent.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeAgent(agent.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-red-600/20 text-red-400 hover:text-red-300' 
                        : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {agent.description}
              </p>
              
              {agent.capabilities.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Capabilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {agent.capabilities.map((capability, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 text-sm rounded-full ${
                          isDarkMode 
                            ? 'bg-gray-700 text-gray-300' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Agent Configuration</h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Define your AI agents and their capabilities
          </p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Agent</span>
        </button>
      </div>

      {/* Add Agent Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`rounded-xl border p-6 ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}
          >
            <h3 className="text-lg font-bold mb-4">Create New Agent</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={newAgent.name || ''}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                className={`px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                placeholder="Agent Name"
              />
              
              <input
                type="text"
                value={newAgent.role || ''}
                onChange={(e) => setNewAgent({ ...newAgent, role: e.target.value })}
                className={`px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                placeholder="Agent Role"
              />
            </div>
            
            <textarea
              value={newAgent.description || ''}
              onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border mb-4 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              rows={3}
              placeholder="Agent Description"
            />
            
            <div className="flex space-x-2">
              <button
                onClick={handleAddAgent}
                disabled={!newAgent.name || !newAgent.role || !newAgent.description}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Agent
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewAgent({ name: '', role: '', description: '', capabilities: [] });
                }}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agents Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </AnimatePresence>
      </div>

      {agents.length === 0 && !showAddForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-center py-12 rounded-xl border-2 border-dashed ${
            isDarkMode ? 'border-gray-700' : 'border-gray-300'
          }`}
        >
          <Bot className={`w-12 h-12 mx-auto mb-4 ${
            isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <h3 className="text-lg font-semibold mb-2">No Agents Created</h3>
          <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Start building your multiagent system by creating your first agent
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create First Agent
          </button>
        </motion.div>
      )}
    </div>
  );
};
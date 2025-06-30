import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Cloud, 
  HardDrive, 
  Zap, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Download,
  Upload,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { dbService } from '../services/database';
import { scraperService } from '../services/scraper';

export const DataManagement: React.FC = () => {
  const { isDarkMode } = useAppStore();
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scrapingStatus, setScrapingStatus] = useState<any>({});
  const [connectionStatus, setConnectionStatus] = useState({
    supabase: 'checking',
    vectorDB: 'checking',
    indexedDB: 'checking',
  });

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Initialize database service
      await dbService.init();
      
      // Load all data
      await Promise.all([
        checkSystemHealth(),
        loadCacheStats(),
        loadScrapingStatus(),
      ]);
    } catch (error) {
      console.error('Failed to initialize data management:', error);
    }
  };

  const checkSystemHealth = async () => {
    try {
      setConnectionStatus({
        supabase: 'checking',
        vectorDB: 'checking',
        indexedDB: 'checking',
      });

      const health = await dbService.healthCheck();
      setHealthStatus(health);
      
      setConnectionStatus({
        supabase: health.supabase ? 'connected' : 'disconnected',
        vectorDB: health.vectorDB ? 'connected' : 'disconnected',
        indexedDB: health.indexedDB ? 'connected' : 'disconnected',
      });
    } catch (error) {
      console.error('Health check failed:', error);
      setConnectionStatus({
        supabase: 'error',
        vectorDB: 'error',
        indexedDB: 'error',
      });
    }
  };

  const loadCacheStats = async () => {
    try {
      const stats = await dbService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
      // Set default stats
      setCacheStats({
        size: 0,
        maxSize: 500 * 1024 * 1024,
        entryCount: 0,
        utilizationPercent: 0,
      });
    }
  };

  const loadScrapingStatus = async () => {
    const frameworks = ['crewai', 'autogen', 'google-adk'];
    const status: any = {};
    
    for (const framework of frameworks) {
      try {
        status[framework] = await scraperService.getScrapingStatus(framework);
      } catch (error) {
        console.error(`Failed to get status for ${framework}:`, error);
        status[framework] = { 
          lastUpdate: null, 
          itemCount: 0, 
          isStale: true,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    setScrapingStatus(status);
  };

  const handleRefreshData = async (framework?: string) => {
    setIsRefreshing(true);
    
    try {
      if (framework) {
        await scraperService.scrapeAndStoreFrameworkData(framework, true);
      } else {
        // Refresh all frameworks
        const frameworks = ['crewai', 'autogen', 'google-adk'];
        for (const fw of frameworks) {
          try {
            await scraperService.scrapeAndStoreFrameworkData(fw, true);
          } catch (error) {
            console.warn(`Failed to refresh ${fw}:`, error);
          }
        }
      }
      
      await loadScrapingStatus();
      await checkSystemHealth();
    } catch (error) {
      console.error('Data refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-5 h-5 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="w-5 h-5 text-red-500" />;
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string, service: string) => {
    switch (status) {
      case 'connected':
        return `${service} Connected`;
      case 'disconnected':
        return `${service} Disconnected (Using Fallback)`;
      case 'checking':
        return `Checking ${service}...`;
      case 'error':
        return `${service} Error`;
      default:
        return `${service} Unknown`;
    }
  };

  const StatusIndicator: React.FC<{ status: string; service: string }> = ({ status, service }) => (
    <div className="flex items-center space-x-2">
      {getStatusIcon(status)}
      <span className={`text-sm ${
        status === 'connected' ? 'text-green-600' : 
        status === 'disconnected' ? 'text-yellow-600' :
        status === 'error' ? 'text-red-600' : 'text-blue-600'
      }`}>
        {getStatusText(status, service)}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Data Management</h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Monitor and manage your data storage, caching, and vector embeddings
          </p>
        </div>
        
        <button
          onClick={() => handleRefreshData()}
          disabled={isRefreshing}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh All</span>
        </button>
      </div>

      {/* System Health Overview */}
      <div className={`rounded-xl p-6 border ${
        isDarkMode 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
          <Database className="w-5 h-5" />
          <span>System Health</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusIndicator 
            status={connectionStatus.supabase} 
            service="Supabase" 
          />
          <StatusIndicator 
            status={connectionStatus.indexedDB} 
            service="IndexedDB" 
          />
          <StatusIndicator 
            status={connectionStatus.vectorDB} 
            service="Vector DB" 
          />
        </div>

        {/* Connection Details */}
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
        }`}>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <strong>Note:</strong> If Supabase or Vector DB are disconnected, the system automatically 
            falls back to local storage (IndexedDB) and simplified embeddings. All functionality 
            remains available with mock data for development.
          </p>
        </div>
      </div>

      {/* Cache Statistics */}
      {cacheStats && (
        <div className={`rounded-xl p-6 border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
            <HardDrive className="w-5 h-5" />
            <span>Client-Side Cache (IndexedDB)</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <div className="text-2xl font-bold text-indigo-600">
                {formatBytes(cacheStats.size)}
              </div>
              <div className="text-sm text-gray-500">Used Space</div>
            </div>
            
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <div className="text-2xl font-bold text-emerald-600">
                {formatBytes(cacheStats.maxSize)}
              </div>
              <div className="text-sm text-gray-500">Max Space</div>
            </div>
            
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <div className="text-2xl font-bold text-amber-600">
                {cacheStats.entryCount}
              </div>
              <div className="text-sm text-gray-500">Cache Entries</div>
            </div>
            
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <div className="text-2xl font-bold text-purple-600">
                {cacheStats.utilizationPercent.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Utilization</div>
            </div>
          </div>
          
          {/* Cache utilization bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Cache Utilization</span>
              <span>{cacheStats.utilizationPercent.toFixed(1)}%</span>
            </div>
            <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(cacheStats.utilizationPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Framework Data Status */}
      <div className={`rounded-xl p-6 border ${
        isDarkMode 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
          <Cloud className="w-5 h-5" />
          <span>Framework Data</span>
        </h3>
        
        <div className="space-y-4">
          {Object.entries(scrapingStatus).map(([framework, status]: [string, any]) => (
            <motion.div
              key={framework}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700/30 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    status.error
                      ? 'bg-red-100 text-red-600'
                      : status.isStale 
                      ? 'bg-amber-100 text-amber-600' 
                      : 'bg-green-100 text-green-600'
                  }`}>
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold capitalize">{framework}</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {status.error ? (
                        `Error: ${status.error}`
                      ) : (
                        `${status.itemCount} items • Last updated: ${formatDate(status.lastUpdate)}`
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {status.error && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                      Error
                    </span>
                  )}
                  {status.isStale && !status.error && (
                    <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">
                      Stale
                    </span>
                  )}
                  <button
                    onClick={() => handleRefreshData(framework)}
                    disabled={isRefreshing}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-gray-600 text-gray-400 hover:text-white' 
                        : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Vector Database Status */}
      <div className={`rounded-xl p-6 border ${
        isDarkMode 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span>Vector Database & AI</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg ${
            isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold">Embeddings</span>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {connectionStatus.vectorDB === 'connected' 
                ? 'Vector embeddings for semantic search using ChromaDB.'
                : 'Using fallback text search and simple embeddings.'
              }
            </p>
          </div>
          
          <div className={`p-4 rounded-lg ${
            isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold">Google Gemini AI</span>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Free-tier AI model for embeddings and natural language processing.
            </p>
          </div>
        </div>
      </div>

      {/* Data Flow Diagram */}
      <div className={`rounded-xl p-6 border ${
        isDarkMode 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h3 className="text-lg font-bold mb-4">Data Architecture</h3>
        
        <div className="flex items-center justify-center space-x-8 py-8 overflow-x-auto">
          <div className="text-center flex-shrink-0">
            <div className={`p-4 rounded-full ${
              isDarkMode ? 'bg-indigo-600' : 'bg-indigo-100'
            } mb-2`}>
              <Download className={`w-6 h-6 ${
                isDarkMode ? 'text-white' : 'text-indigo-600'
              }`} />
            </div>
            <div className="text-sm font-semibold">GitHub Scraping</div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Raw Data Collection
            </div>
          </div>
          
          <div className="text-2xl text-gray-400">→</div>
          
          <div className="text-center flex-shrink-0">
            <div className={`p-4 rounded-full ${
              connectionStatus.supabase === 'connected'
                ? isDarkMode ? 'bg-emerald-600' : 'bg-emerald-100'
                : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
            } mb-2`}>
              <Cloud className={`w-6 h-6 ${
                connectionStatus.supabase === 'connected'
                  ? isDarkMode ? 'text-white' : 'text-emerald-600'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`} />
            </div>
            <div className="text-sm font-semibold">Supabase</div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {connectionStatus.supabase === 'connected' ? 'Compressed Storage' : 'Fallback Mode'}
            </div>
          </div>
          
          <div className="text-2xl text-gray-400">→</div>
          
          <div className="text-center flex-shrink-0">
            <div className={`p-4 rounded-full ${
              connectionStatus.vectorDB === 'connected'
                ? isDarkMode ? 'bg-purple-600' : 'bg-purple-100'
                : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
            } mb-2`}>
              <Zap className={`w-6 h-6 ${
                connectionStatus.vectorDB === 'connected'
                  ? isDarkMode ? 'text-white' : 'text-purple-600'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`} />
            </div>
            <div className="text-sm font-semibold">Vector DB</div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {connectionStatus.vectorDB === 'connected' ? 'Embeddings' : 'Text Search'}
            </div>
          </div>
          
          <div className="text-2xl text-gray-400">→</div>
          
          <div className="text-center flex-shrink-0">
            <div className={`p-4 rounded-full ${
              isDarkMode ? 'bg-amber-600' : 'bg-amber-100'
            } mb-2`}>
              <HardDrive className={`w-6 h-6 ${
                isDarkMode ? 'text-white' : 'text-amber-600'
              }`} />
            </div>
            <div className="text-sm font-semibold">IndexedDB</div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Client Cache
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
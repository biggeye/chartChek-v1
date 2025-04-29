// components/dev/DebugPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
// patient state
import { usePatientStore } from '~/store/patient/patientStore';
import { useFacilityStore } from '~/store/patient/facilityStore';
import { useEvaluationsStore } from '~/store/patient/evaluationsStore';
// chat state
import { useChatStore } from '~/store/chat/chatStore';
//doc state
import { useUserDocumentStore } from '~/store/doc/userDocumentStore';
import useTemplateStore from '~/store/doc/templateStore';
import { useProtocolStore } from '~/store/protocolStore';
// debug components


interface DebugSectionProps {
  title: string;
  data: any;
  isExpanded: boolean;
  onToggle: () => void;
}

interface FunctionInspectorProps {
  func: Function;
  setSelectedFunction: (func: Function) => void;
}

interface FunctionExecutorProps {
  func: Function;
  onClose: () => void;
}

export const FunctionInspector = ({ func, setSelectedFunction }: FunctionInspectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const funcName = func.name || 'anonymous';
  const funcString = func.toString();

  return (
    <div className="my-1">
      <div className="flex items-center">
        <div
          className="cursor-pointer text-blue-400 hover:text-blue-300 flex-grow"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▶'} [Function: {funcName}]
        </div>
        <button
          className="px-2 py-0.5 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white"
          onClick={() => setSelectedFunction(func)}
        >
          Execute
        </button>
      </div>

      {isExpanded && (
        <div className="ml-4 mt-1 p-2 bg-gray-800 rounded text-xs overflow-x-auto">
          <pre>{funcString}</pre>
        </div>
      )}
    </div>
  );
};

const FunctionExecutor = ({ func, onClose }: FunctionExecutorProps) => {
  const [args, setArgs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resultExpanded, setResultExpanded] = useState(true);
  const [selectedFunction, setSelectedFunction] = useState<Function | null>(null);
  const [showStateSelector, setShowStateSelector] = useState(false);
  const [selectedParamIndex, setSelectedParamIndex] = useState<number>(-1);
  const [checkedPaths, setCheckedPaths] = useState<Set<string>>(new Set());

  // Get all stores for state selection
  const facilityStore = useFacilityStore();
  const patientStore = usePatientStore();
  const userDocumentStore = useUserDocumentStore();
  const evaluationsStore = useEvaluationsStore();
  const templateStore = useTemplateStore();

  const chatStore = useChatStore();

  // Store references for easy access
  const storeMap = {
    facilityStore,
    patientStore,
    userDocumentStore,
    evaluationsStore,
    templateStore,

    chatStore
  };

  // Parse function signature to get parameter names
  const funcString = func.toString();
  const paramMatch = funcString.match(/\(([^)]*)\)/);
  const paramString = paramMatch?.[1] ?? '';
  const paramNames = paramString.split(',').map(p => p.trim()).filter(p => p);

  // Initialize args with empty strings for each parameter
  useEffect(() => {
    setArgs(paramNames.map(() => ''));
  }, [paramNames.join()]);

  const updateArg = (index: number, value: string) => {
    const newArgs = [...args];
    newArgs[index] = value;
    setArgs(newArgs);
  };

  const openStateSelector = (paramIndex: number) => {
    setSelectedParamIndex(paramIndex);
    setShowStateSelector(true);
  };

  const selectStateValue = (path: string) => {
    // Get the value from the store using the path
    try {
      const [storeName, ...propertyPath] = path.split('.');
      const store = storeMap[storeName as keyof typeof storeMap];
      
      if (!store) {
        throw new Error(`Store ${storeName} not found`);
      }
      
      // Navigate through the property path to get the value
      let value: any = store;
      for (const prop of propertyPath) {
        value = value[prop];
        if (value === undefined) {
          throw new Error(`Property ${prop} not found in path ${path}`);
        }
      }
      
      // Update the argument with the stringified value
      const stringValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      updateArg(selectedParamIndex, stringValue);
      
      // Close the state selector
      setShowStateSelector(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const executeFunction = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Parse JSON for each argument
      const parsedArgs = args.map(arg => {
        try {
          // Try to parse as JSON if it looks like an object/array
          if ((arg.startsWith('{') && arg.endsWith('}')) ||
            (arg.startsWith('[') && arg.endsWith(']'))) {
            return JSON.parse(arg);
          }
          // Try to convert to appropriate primitive type
          if (arg === 'true') return true;
          if (arg === 'false') return false;
          if (arg === 'null') return null;
          if (arg === 'undefined') return undefined;
          if (!isNaN(Number(arg))) return Number(arg);
          // Otherwise keep as string
          return arg;
        } catch {
          return arg; // If parsing fails, use the raw string
        }
      });

      // Execute the function with the parsed arguments
      const result = await Promise.resolve(func(...parsedArgs));
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCheck = (path: string) => {
    setCheckedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Recursive component to display store structure for selection
  const StateTreeSelector = ({ data, path = '', depth = 0 }: { data: any, path?: string, depth?: number }) => {
    const [expanded, setExpanded] = useState(depth < 1); // Auto-expand first level
    
    if (typeof data !== 'object' || data === null) {
      return (
        <div className="flex items-center py-1">
          <span className="text-yellow-300 ml-4">{path.split('.').pop()}: </span>
          <span className="text-blue-300 ml-2">{JSON.stringify(data)}</span>
          <button 
            className="ml-2 px-2 py-0.5 text-xs bg-green-600 hover:bg-green-700 rounded text-white"
            onClick={() => selectStateValue(path)}
          >
            Select
          </button>
        </div>
      );
    }
    
    if (typeof data === 'function') {
      return (
        <div className="flex items-center py-1">
          <span className="text-yellow-300 ml-4">{path.split('.').pop()}: </span>
          <span className="text-blue-300 ml-2">[Function: {data.name || 'anonymous'}]</span>
          <button 
            className="ml-2 px-2 py-0.5 text-xs bg-green-600 hover:bg-green-700 rounded text-white"
            onClick={() => selectStateValue(path)}
          >
            Select
          </button>
        </div>
      );
    }
    
    const entries = Object.entries(data);
    
    return (
      <div className="py-1">
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="mr-1">{expanded ? '▼' : '▶'}</span>
          <span className="text-yellow-300">{path ? path.split('.').pop() : 'Root'}</span>
          {path && (
            <button 
              className="ml-2 px-2 py-0.5 text-xs bg-green-600 hover:bg-green-700 rounded text-white"
              onClick={(e) => {
                e.stopPropagation();
                selectStateValue(path);
              }}
            >
              Select Object
            </button>
          )}
        </div>
        
        {expanded && (
          <div className="ml-4">
            {entries.map(([key, value]) => (
              <StateTreeSelector 
                key={key} 
                data={value} 
                path={path ? `${path}.${key}` : key}
                depth={depth + 1} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-2 bg-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-medium">
            Execute: <span className="text-blue-400">{func.name || 'anonymous'}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X size={16} />
          </button>
        </div>

        {showStateSelector ? (
          <div className="p-4 overflow-y-auto flex-1">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium">Select a value from state for parameter: <span className="text-blue-400">{paramNames[selectedParamIndex]}</span></h4>
              <button
                onClick={() => setShowStateSelector(false)}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                Cancel
              </button>
            </div>
            
            <div className="bg-gray-800 p-3 rounded overflow-y-auto max-h-[60vh]">
              {Object.entries(storeMap).map(([storeName, storeData]) => (
                <div key={storeName} className="mb-4">
                  <StateTreeSelector data={storeData} path={storeName} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-2 overflow-y-auto flex-1">
            <div className="space-y-4">
              {paramNames.length > 0 ? (
                paramNames.map((param, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-gray-400">
                        {param}
                      </label>
                      <button
                        onClick={() => openStateSelector(index)}
                        className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 rounded text-white"
                      >
                        Select from State
                      </button>
                    </div>
                    <textarea
                      value={args[index] || ''}
                      onChange={(e) => updateArg(index, e.target.value)}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm font-mono"
                      rows={3}
                      placeholder={`Enter value for ${param}`}
                    />
                  </div>
                ))
              ) : (
                <p className="text-gray-400">This function takes no arguments</p>
              )}

              <button
                onClick={executeFunction}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium disabled:opacity-50"
              >
                {isLoading ? 'Executing...' : 'Execute Function'}
              </button>

              {error && (
                <div className="p-1 bg-red-900 bg-opacity-30 border border-red-700 rounded">
                  <p className="text-red-400 font-medium">Error</p>
                  <pre className="text-xs mt-1 text-red-300 overflow-x-auto">{error}</pre>
                </div>
              )}

              {result !== null && (
                <div className="space-y-1">
                  <div
                    className="flex items-center cursor-pointer text-gray-400 hover:text-white"
                    onClick={() => setResultExpanded(!resultExpanded)}
                  >
                    <span className="mr-1">{resultExpanded ? '▼' : '▶'}</span>
                    <span className="font-medium">Result</span>
                  </div>

                  {resultExpanded && (
                    <div className="p-2 bg-gray-800 rounded">
                      <ObjectInspector 
                        data={result} 
                        setSelectedFunction={setSelectedFunction}
                        checkedPaths={checkedPaths}
                        onToggleCheck={handleToggleCheck}
                        currentPath=""
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ObjectInspectorProps {
  data: any;
  depth?: number;
  setSelectedFunction: (func: Function) => void;
  checkedPaths: Set<string>;
  onToggleCheck: (path: string) => void;
  currentPath?: string;
}

const ObjectInspector = ({ 
  data, 
  depth = 0,
  setSelectedFunction,
  checkedPaths,
  onToggleCheck,
  currentPath = ''
}: ObjectInspectorProps) => {
  const [expandedProps, setExpandedProps] = useState<Record<string, boolean>>({});

  const toggleProp = (prop: string) => {
    setExpandedProps((prev: Record<string, boolean>) => ({
      ...prev,
      [prop]: !prev[prop]
    }));
  };

  if (typeof data === 'function') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checkedPaths.has(currentPath)}
          onChange={() => onToggleCheck(currentPath)}
          className="rounded border-gray-600"
        />
        <FunctionInspector 
          func={data} 
          setSelectedFunction={setSelectedFunction} 
        />
      </div>
    );
  }

  if (typeof data !== 'object' || data === null) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checkedPaths.has(currentPath)}
          onChange={() => onToggleCheck(currentPath)}
          className="rounded border-gray-600"
        />
        <span>{JSON.stringify(data)}</span>
      </div>
    );
  }

  const isArray = Array.isArray(data);
  const entries = Object.entries(data);
    
  return (
    <div style={{ marginLeft: depth > 0 ? 16 : 0 }}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checkedPaths.has(currentPath)}
          onChange={() => onToggleCheck(currentPath)}
          className="rounded border-gray-600"
        />
        <span>{isArray ? '[' : '{'}</span>
      </div>
      {entries.length > 0 && (
        <div>
          {entries.map(([key, value]) => {
            const isObject = typeof value === 'object' && value !== null;
            const isFunction = typeof value === 'function';
            const isExpandable = isObject || isFunction;
            const isExpanded = expandedProps[key];
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            const isChecked = checkedPaths.has(newPath);

            return (
              <div key={key} className="my-1">
                <div className="flex items-center gap-2">
                  {isExpandable && (
                    <span
                      className="mr-1 cursor-pointer text-gray-400 hover:text-white"
                      onClick={() => toggleProp(key)}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  )}
                  {!isExpanded && (
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleCheck(newPath)}
                      className="rounded border-gray-600"
                    />
                  )}
                  <span className="text-yellow-300">{isArray ? '' : `"${key}": `}</span>
                  {isExpandable ? (
                    isExpanded ? (
                      <span></span>
                    ) : (
                      <span>
                        {isFunction
                          ? `[Function: ${value.name || 'anonymous'}]`
                          : isArray
                            ? `Array(${(value as any[]).length})`
                            : `Object {${Object.keys(value).length} keys}`}
                      </span>
                    )
                  ) : (
                    <span className={typeof value === 'string' ? 'text-green-300' : 'text-blue-300'}>
                      {JSON.stringify(value)}
                    </span>
                  )}
                </div>
                {isExpanded && isExpandable && (
                  <ObjectInspector 
                    data={value} 
                    depth={depth + 1} 
                    setSelectedFunction={setSelectedFunction}
                    checkedPaths={checkedPaths}
                    onToggleCheck={onToggleCheck}
                    currentPath={newPath}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
      <span>{isArray ? ']' : '}'}</span>
    </div>
  );
};

const DebugSection = ({ 
  title, 
  data, 
  isExpanded, 
  onToggle,
  setSelectedFunction,
  sectionKey
}: DebugSectionProps & { 
  setSelectedFunction: (func: Function) => void;
  sectionKey: string;
}) => {
  const [checkedPaths, setCheckedPaths] = useState<Set<string>>(new Set());

  const handleToggleCheck = (path: string) => {
    setCheckedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderCheckedItems = () => {
    if (checkedPaths.size === 0) return null;

    const getValueByPath = (obj: any, path: string) => {
      return path.split('.').reduce((acc, part) => acc?.[part], obj);
    };

    return (
      <div className="mt-2 p-2 bg-gray-800 rounded">
        {Array.from(checkedPaths).map(path => {
          const value = getValueByPath(data, path);
          return (
            <div key={path} className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                checked
                onChange={() => handleToggleCheck(path)}
                className="rounded border-gray-600"
              />
              <span className="text-yellow-300">{path}:</span>
              <span className="text-blue-300">
                {typeof value === 'function' 
                  ? `[Function: ${value.name || 'anonymous'}]`
                  : JSON.stringify(value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded overflow-hidden">
      <button
        className="w-full p-2 text-left font-medium flex justify-between items-center hover:bg-gray-700"
        onClick={onToggle}
      >
        {title}
        <span>{isExpanded ? '−' : '+'}</span>
      </button>

      {!isExpanded && renderCheckedItems()}

      {isExpanded && (
        <div className="p-2 text-xs font-mono bg-gray-950 overflow-x-auto">
          <ObjectInspector 
            data={data} 
            setSelectedFunction={setSelectedFunction}
            checkedPaths={checkedPaths}
            onToggleCheck={handleToggleCheck}
            currentPath=""
          />
        </div>
      )}
    </div>
  );
};

export const DebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'doc' | 'patient' | 'api' | 'protocol'>('chat');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    chatStore: false,
    patientStore: false,
    facilityStore: false,
    evaluationsStore: false,
    userDocumentStore: false,
    templateStore: false
  });
  const [selectedFunction, setSelectedFunction] = useState<Function | null>(null);
  
  // Get all the contexts and stores
  const facilityStore = useFacilityStore();
  const patientStore = usePatientStore();
  const userDocumentStore = useUserDocumentStore();
  const evaluationsStore = useEvaluationsStore();
  const templateStore = useTemplateStore();
  const chatStore = useChatStore();
  const protocolStore = useProtocolStore();

  const toggleSection = (section: string) => {
    setExpandedSections((prev: Record<string, boolean>) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'd') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;
  if (!isVisible) return null;

  return (
    <>
      {selectedFunction && (
        <FunctionExecutor
          func={selectedFunction}
          onClose={() => setSelectedFunction(null)}
        />
      )}
      <div className="fixed bottom-0 right-0 w-96 max-h-[80vh] bg-gray-900 text-white z-50 rounded-tl-lg shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-2 bg-gray-800">
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 rounded ${activeTab === 'chat' ? 'bg-indigo-600' : 'bg-gray-700'}`}
              onClick={() => setActiveTab('chat')}
            >
              chatState
            </button>
            <button
              className={`px-3 py-1 rounded ${activeTab === 'doc' ? 'bg-indigo-600' : 'bg-gray-700'}`}
              onClick={() => setActiveTab('doc')}
            >
              docState
            </button>
            <button
              className={`px-3 py-1 rounded ${activeTab === 'patient' ? 'bg-indigo-600' : 'bg-gray-700'}`}
              onClick={() => setActiveTab('patient')}
            >
              patientState
            </button>
            <button
              className={`px-3 py-1 rounded ${activeTab === 'api' ? 'bg-indigo-600' : 'bg-gray-700'}`}
              onClick={() => setActiveTab('api')}
            >
              api
            </button>
            <button
              className={`px-3 py-1 rounded ${activeTab === 'protocol' ? 'bg-indigo-600' : 'bg-gray-700'}`}
              onClick={() => setActiveTab('protocol')}
            >
              protocol
            </button>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-2 flex-1">
          {activeTab === 'chat' && (
            <div className="space-y-2">
              <DebugSection
                title="Chat State"
                data={chatStore}
                isExpanded={expandedSections['chatStore'] || false}
                onToggle={() => toggleSection('chatStore')}
                setSelectedFunction={setSelectedFunction}
                sectionKey="chatStore"
              />
            </div>
          )}

          {activeTab === 'patient' && (
            <div className="space-y-2">
              <DebugSection
                title="Patient State"
                data={patientStore}
                isExpanded={expandedSections['patientStore'] || false}
                onToggle={() => toggleSection('patientStore')}
                setSelectedFunction={setSelectedFunction}
                sectionKey="patientStore"
              />
              <DebugSection
                title="Facility State"
                data={facilityStore}
                isExpanded={expandedSections['facilityStore'] || false}
                onToggle={() => toggleSection('facilityStore')}
                setSelectedFunction={setSelectedFunction}
                sectionKey="facilityStore"
              />
              <DebugSection
                title="Evaluations State"
                data={evaluationsStore}
                isExpanded={expandedSections['evaluationsStore'] || false}
                onToggle={() => toggleSection('evaluationsStore')}
                setSelectedFunction={setSelectedFunction}
                sectionKey="evaluationsStore"
              />
            </div>
          )}

          {activeTab === 'doc' && (
            <div className="space-y-2">
              <DebugSection
                title="Document State"
                data={userDocumentStore}
                isExpanded={expandedSections['userDocumentStore'] || false}
                onToggle={() => toggleSection('userDocumentStore')}
                setSelectedFunction={setSelectedFunction}
                sectionKey="userDocumentStore"
              />
              <DebugSection
                title="Template State"
                data={templateStore}
                isExpanded={expandedSections['templateStore'] || false}
                onToggle={() => toggleSection('templateStore')}
                setSelectedFunction={setSelectedFunction}
                sectionKey="templateStore"
              />
            </div>
          )}
          {activeTab === 'api' && (
            <div className="space-y-2">
              {/* Remove ApiTester for now since it's not defined */}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DebugPanel;
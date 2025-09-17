import React, { useMemo, useState, useEffect } from 'react';
import type { Vehicle, User, Conversation, PlatformSettings, AuditLogEntry, VehicleData } from '../types';
import EditUserModal from './EditUserModal';
import EditVehicleModal from './EditVehicleModal';

interface AdminPanelProps {
    users: User[];
    currentUser: User;
    vehicles: Vehicle[];
    conversations: Conversation[];
    onToggleUserStatus: (email: string) => void;
    onDeleteUser: (email: string) => void;
    onAdminUpdateUser: (email: string, details: { name: string; mobile: string; role: User['role'] }) => void;
    onUpdateVehicle: (vehicle: Vehicle) => void;
    onDeleteVehicle: (vehicleId: number) => void;
    onToggleVehicleStatus: (vehicleId: number) => void;
    onToggleVehicleFeature: (vehicleId: number) => void;
    onResolveFlag: (type: 'vehicle' | 'conversation', id: number | string) => void;
    platformSettings: PlatformSettings;
    onUpdateSettings: (settings: PlatformSettings) => void;
    onSendBroadcast: (message: string) => void;
    auditLog: AuditLogEntry[];
    onExportUsers: () => void;
    onExportVehicles: () => void;
    onExportSales: () => void;
    vehicleData: VehicleData;
    onUpdateVehicleData: (newData: VehicleData) => void;
    onToggleVerifiedStatus: (email: string) => void;
}

type AdminView = 'analytics' | 'users' | 'listings' | 'moderation' | 'vehicleData' | 'auditLog' | 'settings';
type RoleFilter = 'all' | 'customer' | 'seller' | 'admin';
type SortConfig = {
    key: keyof User;
    direction: 'ascending' | 'descending';
};

// --- Sub-components ---

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode, onClick?: () => void }> = ({ title, value, icon, onClick }) => (
  <div className={`bg-white dark:bg-brand-gray-dark p-6 rounded-lg shadow-md flex items-center ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-transform' : ''}`} onClick={onClick}>
    <div className="bg-brand-blue-light p-3 rounded-full mr-4">{icon}</div>
    <div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  </div>
);

const TableContainer: React.FC<{ title: string; children: React.ReactNode; actions?: React.ReactNode }> = ({ title, children, actions }) => (
    <div className="bg-white dark:bg-brand-gray-dark p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
            {actions && <div className="w-full sm:w-auto">{actions}</div>}
        </div>
        <div className="overflow-x-auto">
            {children}
        </div>
    </div>
);

const SortableHeader: React.FC<{
    title: string;
    sortKey: keyof User;
    sortConfig: SortConfig | null;
    requestSort: (key: keyof User) => void;
}> = ({ title, sortKey, sortConfig, requestSort }) => {
    const isSorted = sortConfig?.key === sortKey;
    const direction = isSorted ? sortConfig.direction : undefined;

    return (
        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
            <button onClick={() => requestSort(sortKey)} className="flex items-center gap-1.5 group">
                <span className="group-hover:text-gray-800 dark:group-hover:text-gray-200">{title}</span>
                <span className="text-gray-400">
                    {isSorted ? (direction === 'ascending' ? '▲' : '▼') : '↕'}
                </span>
            </button>
        </th>
    );
};

const BarChart: React.FC<{ title: string; data: { label: string; value: number }[] }> = ({ title, data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="bg-white dark:bg-brand-gray-dark p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
            <div className="space-y-4">
                {data.map(({ label, value }) => (
                    <div key={label} className="grid grid-cols-[100px_1fr] items-center gap-4 text-sm">
                        <span className="font-medium text-gray-600 dark:text-gray-300 truncate text-right">{label}</span>
                        <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5">
                                <div
                                    className="bg-brand-blue h-5 rounded-full text-white text-xs flex items-center justify-end pr-2"
                                    style={{ width: `${(value / maxValue) * 100}%` }}
                                >
                                </div>
                            </div>
                            <span className="font-semibold text-gray-800 dark:text-gray-100">{value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Vehicle Data Editor Component ---
const VehicleDataEditor: React.FC<{ vehicleData: VehicleData, onUpdate: (newData: VehicleData) => void }> = ({ vehicleData, onUpdate }) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedMake, setSelectedMake] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);

    const [editingItem, setEditingItem] = useState<{ path: string[], value: string } | null>(null);
    const [addingAt, setAddingAt] = useState<{ path: string[], type: string } | null>(null);
    const [newItemValue, setNewItemValue] = useState('');
    const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
    const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

    useEffect(() => {
        if (selectedCategory && !vehicleData[selectedCategory]) setSelectedCategory(null);
        if (selectedMake && (!selectedCategory || !vehicleData[selectedCategory]?.[selectedMake])) setSelectedMake(null);
        if (selectedModel && (!selectedCategory || !selectedMake || !vehicleData[selectedCategory]?.[selectedMake]?.[selectedModel])) setSelectedModel(null);
    }, [vehicleData, selectedCategory, selectedMake, selectedModel]);

    const handleAction = (updater: (draft: VehicleData) => void) => {
        const draft = JSON.parse(JSON.stringify(vehicleData));
        updater(draft);
        onUpdate(draft);
    };

    const handleDelete = (path: string[]) => {
        if (!window.confirm(`Are you sure you want to delete "${path[path.length - 1]}"? This action cannot be undone.`)) return;
        handleAction(draft => {
            let parent: any = draft;
            for (let i = 0; i < path.length - 1; i++) parent = parent[path[i]];
            const key = path[path.length - 1];
            if (Array.isArray(parent)) parent.splice(parent.indexOf(key), 1);
            else delete parent[key];
        });
        if (path.length === 1 && path[0] === selectedCategory) setSelectedCategory(null);
        if (path.length === 2 && path[1] === selectedMake) setSelectedMake(null);
        if (path.length === 3 && path[2] === selectedModel) setSelectedModel(null);
    };

    const handleSaveEdit = () => {
        if (!editingItem || !editingItem.value.trim()) return setEditingItem(null);
        handleAction(draft => {
            let parent: any = draft;
            for (let i = 0; i < editingItem.path.length - 1; i++) parent = parent[editingItem.path[i]];
            const oldKey = editingItem.path[editingItem.path.length - 1];
            const newKey = editingItem.value.trim();
            if (oldKey === newKey) return;

            if (!Array.isArray(parent)) {
                 if (parent.hasOwnProperty(newKey)) {
                    alert(`"${newKey}" already exists.`);
                    return;
                }
                parent[newKey] = parent[oldKey];
                delete parent[oldKey];
            } else {
                const index = parent.indexOf(oldKey);
                 if (parent.includes(newKey)) {
                    alert(`"${newKey}" already exists.`);
                    return;
                }
                if (index > -1) parent[index] = newKey;
            }
        });
        setEditingItem(null);
    };

    const handleSaveNewItem = () => {
        if (!addingAt || !newItemValue.trim()) {
            setAddingAt(null);
            setNewItemValue('');
            return;
        }
        const newValue = newItemValue.trim();
        
        // Perform case-insensitive duplicate check first
        let parent: any = vehicleData;
        for (const key of addingAt.path) {
            parent = parent[key];
        }
    
        let isDuplicate = false;
        if (Array.isArray(parent)) {
            isDuplicate = parent.some(item => item.toLowerCase() === newValue.toLowerCase());
        } else {
            isDuplicate = Object.keys(parent).some(key => key.toLowerCase() === newValue.toLowerCase());
        }
    
        if (isDuplicate) {
            alert(`"${newValue}" already exists.`);
            return; // Stop execution
        }
    
        // If not a duplicate, proceed with adding
        handleAction(draft => {
            let draftParent: any = draft;
            for (const key of addingAt.path) {
                draftParent = draftParent[key];
            }
            if (Array.isArray(draftParent)) {
                draftParent.push(newValue);
            } else {
                draftParent[newValue] = addingAt.type === 'Model' ? [] : {};
            }
        });
    
        setAddingAt(null);
        setNewItemValue('');
    
        // Auto-select the newly added item to activate the next column
        if (addingAt.path.length === 0) {
            setSelectedCategory(newValue);
            setSelectedMake(null);
            setSelectedModel(null);
        } else if (addingAt.path.length === 1) {
            setSelectedMake(newValue);
            setSelectedModel(null);
        } else if (addingAt.path.length === 2) {
            setSelectedModel(newValue);
        }
    };

    const handleSelectCategory = (item: string | null) => {
        if (item === selectedCategory) {
            setSelectedCategory(null); setSelectedMake(null); setSelectedModel(null);
        } else {
            setSelectedCategory(item); setSelectedMake(null); setSelectedModel(null);
        }
    };
    const handleSelectMake = (item: string | null) => {
        if (item === selectedMake) {
            setSelectedMake(null); setSelectedModel(null);
        } else {
            setSelectedMake(item); setSelectedModel(null);
        }
    };
    const handleSelectModel = (item: string | null) => {
        setSelectedModel(item === selectedModel ? null : item);
    };

    // Drag and Drop handlers for Categories
    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, category: string) => {
        setDraggedCategory(category);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('opacity-50');
    };

    const handleDragOver = (e: React.DragEvent<HTMLLIElement>, targetCategory: string) => {
        e.preventDefault();
        if (draggedCategory && draggedCategory !== targetCategory) {
            setDragOverTarget(targetCategory);
        }
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLLIElement>) => {
        e.preventDefault();
        setDragOverTarget(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetCategory: string) => {
        e.preventDefault();
        if (!draggedCategory || draggedCategory === targetCategory) return;
        
        const currentKeys = Object.keys(vehicleData);
        const draggedIndex = currentKeys.indexOf(draggedCategory);
        currentKeys.splice(draggedIndex, 1);
        const targetIndex = currentKeys.indexOf(targetCategory);
        currentKeys.splice(targetIndex, 0, draggedCategory);

        const reorderedData: VehicleData = {};
        for (const key of currentKeys) {
            reorderedData[key] = vehicleData[key];
        }
        onUpdate(reorderedData);
        setDragOverTarget(null);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
        e.currentTarget.classList.remove('opacity-50');
        setDraggedCategory(null);
        setDragOverTarget(null);
    };


    const renderColumn = (title: string, items: string[], pathPrefix: string[], selectedItem: string | null, onSelect: (item: string | null) => void, itemType: string, disabled: boolean = false) => {
        const isDraggable = title === 'Categories';
        return (
            <div className={`bg-brand-gray-50 dark:bg-brand-gray-darker p-3 rounded-lg border dark:border-gray-700 flex flex-col transition-opacity ${disabled ? 'opacity-50' : ''}`}>
                <h3 className="text-md font-bold text-gray-800 dark:text-gray-100 mb-2 px-1 flex items-center gap-1">{title} {isDraggable && <span className="text-xs font-normal text-gray-400">(Draggable)</span>}</h3>
                <ul className="space-y-1 overflow-y-auto flex-grow min-h-[200px] max-h-[400px]">
                    {items.map(item => {
                        const path = [...pathPrefix, item];
                        const isEditing = editingItem?.path.join() === path.join();
                        const isDragOver = isDraggable && dragOverTarget === item && draggedCategory !== item;

                        return (
                            <li key={item}
                                draggable={isDraggable}
                                onDragStart={isDraggable ? (e) => handleDragStart(e, item) : undefined}
                                onDragOver={isDraggable ? (e) => handleDragOver(e, item) : undefined}
                                onDragLeave={isDraggable ? (e) => handleDragLeave(e) : undefined}
                                onDrop={isDraggable ? (e) => handleDrop(e, item) : undefined}
                                onDragEnd={isDraggable ? (e) => handleDragEnd(e) : undefined}
                                className={`rounded-md transition-all ${isDragOver ? 'border-t-2 border-brand-blue pt-1' : ''}`}
                            >
                                {isEditing ? (
                                    <div className="flex items-center gap-2 p-2">
                                        <input type="text" value={editingItem.value} onChange={e => setEditingItem(prev => ({ ...prev!, value: e.target.value }))} autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveEdit()} onBlur={handleSaveEdit} className="w-full text-sm p-1 border rounded bg-white dark:bg-gray-900" />
                                        <button onClick={handleSaveEdit} className="p-1 text-green-500 hover:text-green-700">&#x2713;</button>
                                        <button onClick={() => setEditingItem(null)} className="p-1 text-red-500 hover:text-red-700">&times;</button>
                                    </div>
                                ) : (
                                    <div onClick={() => !disabled && onSelect(item)} className={`group flex justify-between items-center p-2 rounded-md ${!disabled ? (isDraggable ? 'cursor-grab' : 'cursor-pointer') : 'cursor-default'} ${selectedItem === item ? 'bg-brand-blue text-white' : !disabled ? 'hover:bg-gray-200 dark:hover:bg-gray-700' : ''}`}>
                                        <span className="text-sm">{item}</span>
                                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedItem === item ? '!opacity-100' : ''}`}>
                                            <button onClick={e => { e.stopPropagation(); if (!disabled) setEditingItem({ path, value: item }); }} disabled={disabled} className="p-1 hover:bg-white/20 rounded-md">&#x270E;</button>
                                            <button onClick={e => { e.stopPropagation(); if (!disabled) handleDelete(path); }} disabled={disabled} className="p-1 hover:bg-white/20 rounded-md">&times;</button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                    {!disabled && items.length === 0 && <div className="text-center text-sm text-gray-500 py-4 px-2">No items yet. Add one below.</div>}
                    {disabled && <div className="text-center text-sm text-gray-500 py-4 px-2">Select an item from the previous column to continue.</div>}
                </ul>
                <div className="mt-2 pt-2 border-t dark:border-gray-700">
                    {addingAt?.path.join() === pathPrefix.join() ? (
                        <div className="flex items-center gap-2 p-1">
                            <input type="text" value={newItemValue} onChange={e => setNewItemValue(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveNewItem()} placeholder={`New ${itemType}...`} className="w-full text-sm p-1 border rounded bg-white dark:bg-gray-900" />
                            <button onClick={handleSaveNewItem} className="p-1 text-green-500 hover:text-green-700">&#x2713;</button>
                            <button onClick={() => { setAddingAt(null); setNewItemValue(''); }} className="p-1 text-red-500 hover:text-red-700">&times;</button>
                        </div>
                    ) : (
                        <button onClick={() => !disabled && setAddingAt({ path: pathPrefix, type: itemType })} disabled={disabled} className="w-full text-sm p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-brand-blue dark:text-brand-blue-light disabled:opacity-50 disabled:cursor-not-allowed">+ Add New {itemType}</button>
                    )}
                </div>
            </div>
        )
    };

    return (
        <div className="bg-white dark:bg-brand-gray-dark p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Manage Vehicle Data</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Manage the vehicle options available to sellers in their dashboard dropdowns. Click an item to view its children.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {renderColumn("Categories", Object.keys(vehicleData), [], selectedCategory, handleSelectCategory, "Category")}
                
                {renderColumn("Makes", selectedCategory ? Object.keys(vehicleData[selectedCategory] || {}).sort() : [], selectedCategory ? [selectedCategory] : [], selectedMake, handleSelectMake, "Make", !selectedCategory)}
                
                {renderColumn("Models", selectedCategory && selectedMake ? Object.keys(vehicleData[selectedCategory]?.[selectedMake] || {}).sort() : [], selectedCategory && selectedMake ? [selectedCategory, selectedMake] : [], selectedModel, handleSelectModel, "Model", !selectedMake)}
                
                {renderColumn("Variants", selectedCategory && selectedMake && selectedModel ? (vehicleData[selectedCategory]?.[selectedMake]?.[selectedModel] || []).sort() : [], selectedCategory && selectedMake && selectedModel ? [selectedCategory, selectedMake, selectedModel] : [], null, () => {}, "Variant", !selectedModel)}
            </div>
        </div>
    );
};


// --- Audit Log View Component ---
const AuditLogView: React.FC<{ auditLog: AuditLogEntry[] }> = ({ auditLog }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLog = useMemo(() => {
    if (!searchTerm.trim()) return auditLog;
    const lowercasedFilter = searchTerm.toLowerCase();
    return auditLog.filter(entry =>
      entry.actor.toLowerCase().includes(lowercasedFilter) ||
      entry.action.toLowerCase().includes(lowercasedFilter) ||
      entry.target.toLowerCase().includes(lowercasedFilter) ||
      (entry.details && entry.details.toLowerCase().includes(lowercasedFilter))
    );
  }, [auditLog, searchTerm]);

  const searchAction = (
    <input
      type="text"
      placeholder="Search logs..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="flex-grow p-2 border border-brand-gray dark:border-gray-600 rounded-lg bg-white dark:bg-brand-gray-darker dark:text-gray-200 focus:ring-2 focus:ring-brand-blue-light focus:outline-none transition w-full sm:w-64"
    />
  );

  return (
    <TableContainer title="Audit Log" actions={searchAction}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Timestamp</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actor</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Action</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Target</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Details</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-brand-gray-dark divide-y divide-gray-200 dark:divide-gray-700">
          {filteredLog.map(entry => (
            <tr key={entry.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(entry.timestamp).toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap font-medium">{entry.actor}</td>
              <td className="px-6 py-4 whitespace-nowrap">{entry.action}</td>
              <td className="px-6 py-4 whitespace-nowrap">{entry.target}</td>
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs" title={entry.details}>{entry.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredLog.length === 0 && <p className="text-center py-8 text-gray-500 dark:text-gray-400">No log entries found matching your search.</p>}
    </TableContainer>
  );
};

// --- Platform Settings View ---
const PlatformSettingsView: React.FC<{
    settings: PlatformSettings;
    onUpdate: (newSettings: PlatformSettings) => void;
    onSendBroadcast: (message: string) => void;
}> = ({ settings, onUpdate, onSendBroadcast }) => {
    const [currentSettings, setCurrentSettings] = useState(settings);
    const [broadcastMessage, setBroadcastMessage] = useState('');

    useEffect(() => {
        setCurrentSettings(settings);
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentSettings(prev => ({
            ...prev,
            [name]: name === 'listingFee' ? Number(value) : value,
        }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(currentSettings);
    };

    const handleBroadcast = (e: React.FormEvent) => {
        e.preventDefault();
        if (broadcastMessage.trim()) {
            if (window.confirm("Are you sure you want to send this broadcast message to all users?")) {
                onSendBroadcast(broadcastMessage.trim());
                setBroadcastMessage('');
            }
        }
    };

    const formElementClass = "block w-full p-3 border border-brand-gray-300 dark:border-brand-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue focus:outline-none transition bg-brand-gray-50 dark:bg-brand-gray-800 dark:text-gray-200";

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-brand-gray-dark p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">General Settings</h2>
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label htmlFor="listingFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Listing Fee (₹)
                        </label>
                        <input
                            type="number"
                            id="listingFee"
                            name="listingFee"
                            value={currentSettings.listingFee}
                            onChange={handleChange}
                            min="0"
                            className={formElementClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="siteAnnouncement" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Site Announcement Banner
                        </label>
                        <textarea
                            id="siteAnnouncement"
                            name="siteAnnouncement"
                            value={currentSettings.siteAnnouncement}
                            onChange={handleChange}
                            rows={3}
                            className={formElementClass}
                            placeholder="e.g., Special weekend discount on all EVs!"
                        />
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave empty to hide the banner.</p>
                    </div>
                    <div>
                        <button type="submit" className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-blue-dark transition-colors">
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white dark:bg-brand-gray-dark p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Communication</h2>
                <form onSubmit={handleBroadcast} className="space-y-4">
                    <div>
                         <label htmlFor="broadcastMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Send Broadcast Message
                        </label>
                        <textarea
                            id="broadcastMessage"
                            name="broadcastMessage"
                            value={broadcastMessage}
                            onChange={(e) => setBroadcastMessage(e.target.value)}
                            rows={3}
                            className={formElementClass}
                            placeholder="This message will be sent to every user's chat inbox."
                        />
                    </div>
                     <div>
                        <button type="submit" className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50" disabled={!broadcastMessage.trim()}>
                            Send Broadcast
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Moderation Queue View ---
const ModerationQueueView: React.FC<{
    vehicles: Vehicle[];
    conversations: Conversation[];
    onResolveFlag: (type: 'vehicle' | 'conversation', id: number | string) => void;
    onToggleVehicleStatus: (vehicleId: number) => void;
    onToggleUserStatus: (email: string) => void;
}> = ({ vehicles, conversations, onResolveFlag, onToggleVehicleStatus, onToggleUserStatus }) => {
    const flaggedVehicles = useMemo(() => vehicles.filter(v => v.isFlagged), [vehicles]);
    const flaggedConversations = useMemo(() => conversations.filter(c => c.isFlagged), [conversations]);

    return (
        <div className="space-y-8">
            <TableContainer title={`Flagged Vehicles (${flaggedVehicles.length})`}>
                {flaggedVehicles.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800"><tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Vehicle</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Seller</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Reported On</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                        </tr></thead>
                        <tbody className="bg-white dark:bg-brand-gray-dark divide-y divide-gray-200 dark:divide-gray-700">
                            {flaggedVehicles.map(v => (
                                <tr key={v.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{v.year} {v.make} {v.model}</td>
                                    <td className="px-6 py-4">{v.sellerEmail}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={v.flagReason}>{v.flagReason || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{v.flaggedAt ? new Date(v.flaggedAt).toLocaleString() : 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                        <button onClick={() => onResolveFlag('vehicle', v.id)} className="text-green-600 hover:text-green-900">Dismiss Flag</button>
                                        <button onClick={() => { onToggleVehicleStatus(v.id); onResolveFlag('vehicle', v.id); }} className="text-yellow-600 hover:text-yellow-900">Unpublish</button>
                                        <button onClick={() => onToggleUserStatus(v.sellerEmail)} className="text-red-600 hover:text-red-900">Ban Seller</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-center py-8 text-gray-500 dark:text-gray-400">No vehicles are currently flagged.</p>}
            </TableContainer>

            <TableContainer title={`Flagged Conversations (${flaggedConversations.length})`}>
                {flaggedConversations.length > 0 ? (
                     <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800"><tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Participants</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Reported On</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                        </tr></thead>
                        <tbody className="bg-white dark:bg-brand-gray-dark divide-y divide-gray-200 dark:divide-gray-700">
                           {flaggedConversations.map(c => (
                                <tr key={c.id}>
                                    <td className="px-6 py-4 text-sm">
                                        <div>C: {c.customerName}</div>
                                        <div>S: {c.sellerId}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-sm truncate" title={c.flagReason}>
                                        {c.flagReason || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{c.flaggedAt ? new Date(c.flaggedAt).toLocaleString() : 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                        <button onClick={() => onResolveFlag('conversation', c.id)} className="text-green-600 hover:text-green-900">Dismiss</button>
                                        <button onClick={() => onToggleUserStatus(c.customerId)} className="text-red-600 hover:text-red-900">Ban Customer</button>
                                        <button onClick={() => onToggleUserStatus(c.sellerId)} className="text-red-600 hover:text-red-900">Ban Seller</button>
                                    </td>
                                </tr>
                           ))}
                        </tbody>
                    </table>
                ) : <p className="text-center py-8 text-gray-500 dark:text-gray-400">No conversations are currently flagged.</p>}
            </TableContainer>
        </div>
    );
};



// --- Main Admin Panel Component ---

const AdminPanel: React.FC<AdminPanelProps> = ({ users, currentUser, vehicles, conversations, onToggleUserStatus, onDeleteUser, onAdminUpdateUser, onUpdateVehicle, onDeleteVehicle, onToggleVehicleStatus, onToggleVehicleFeature, onResolveFlag, platformSettings, onUpdateSettings, onSendBroadcast, auditLog, onExportUsers, onExportVehicles, onExportSales, vehicleData, onUpdateVehicleData, onToggleVerifiedStatus }) => {
    const [activeView, setActiveView] = useState<AdminView>('analytics');
    
    // State for User Management
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'name', direction: 'ascending' });
    
    // State for Vehicle Management
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

    // --- Memoized Analytics Calculations ---
    const analyticsData = useMemo(() => {
        const totalSalesValue = vehicles.reduce((sum, v) => sum + v.price, 0);
        const averagePrice = vehicles.length > 0 ? totalSalesValue / vehicles.length : 0;
        
        const userRoleCounts = users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {} as Record<User['role'], number>);

        const listingsByMake = vehicles.reduce((acc, v) => {
            acc[v.make] = (acc[v.make] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const mostPopularMake = Object.entries(listingsByMake).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        
        const userRoleChartData = Object.entries(userRoleCounts).map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value })).sort((a,b) => b.value - a.value);
        const listingsByMakeChartData = Object.entries(listingsByMake).map(([label, value]) => ({ label, value })).sort((a,b) => b.value - a.value);
        const moderationQueueCount = vehicles.filter(v => v.isFlagged).length + conversations.filter(c => c.isFlagged).length;


        return {
            totalSalesValue,
            averagePrice,
            mostPopularMake,
            userRoleChartData,
            listingsByMakeChartData,
            moderationQueueCount,
        };
    }, [users, vehicles, conversations]);

    // --- User Management Logic ---
    const requestSort = (key: keyof User) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const togglePasswordVisibility = (email: string) => {
        setVisiblePasswords(prev => {
            const newSet = new Set(prev);
            if (newSet.has(email)) newSet.delete(email);
            else newSet.add(email);
            return newSet;
        });
    };

    const handleEditUserClick = (user: User) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleSaveUser = (email: string, details: { name: string; mobile: string; role: User['role'] }) => {
        onAdminUpdateUser(email, details);
        setIsEditModalOpen(false);
        setSelectedUser(null);
    };

    const processedUsers = useMemo(() => {
        let filtered = users.filter(user => {
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const matchesSearch = searchTerm === '' || 
                                  user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  user.email.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesRole && matchesSearch;
        });

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [users, roleFilter, searchTerm, sortConfig]);

    // --- Vehicle Management Logic ---
    const handleSaveVehicle = (updatedVehicle: Vehicle) => {
        onUpdateVehicle(updatedVehicle);
        setEditingVehicle(null);
    };

    // --- Render Logic ---
    const AdminNavItem: React.FC<{ view: AdminView, children: React.ReactNode, count?: number }> = ({ view, children, count }) => (
        <button onClick={() => setActiveView(view)} className={`relative w-full text-left px-4 py-3 rounded-lg transition-colors font-medium ${activeView === view ? 'bg-brand-blue text-white' : 'hover:bg-brand-gray-light dark:hover:bg-brand-gray-darker'}`}>
          {children}
          {count && count > 0 && <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{count}</span>}
        </button>
    );
    
    const renderContent = () => {
        switch (activeView) {
            case 'analytics':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="Total Users" value={users.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                            <StatCard title="Total Vehicles" value={vehicles.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>} />
                             <StatCard title="Most Popular Make" value={analyticsData.mostPopularMake} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>} />
                             <StatCard title="Moderation Queue" value={analyticsData.moderationQueueCount} onClick={() => setActiveView('moderation')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>} />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <BarChart title="Listings by Make" data={analyticsData.listingsByMakeChartData} />
                            <BarChart title="User Role Distribution" data={analyticsData.userRoleChartData} />
                        </div>
                        <div className="bg-white dark:bg-brand-gray-dark p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Data Export</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Download platform data in CSV format for external analysis.</p>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={onExportUsers}
                                    className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    Export Users
                                </button>
                                <button
                                    onClick={onExportVehicles}
                                    className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    Export Vehicles
                                </button>
                                <button
                                    onClick={onExportSales}
                                    className="flex items-center gap-2 bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    Export Sales Report
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'users':
                const filterActions = (
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-grow p-2 border border-brand-gray dark:border-gray-600 rounded-lg bg-white dark:bg-brand-gray-darker dark:text-gray-200 focus:ring-2 focus:ring-brand-blue-light focus:outline-none transition" />
                        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)} className="p-2 border border-brand-gray dark:border-gray-600 rounded-lg bg-white dark:bg-brand-gray-darker dark:text-gray-200 focus:ring-2 focus:ring-brand-blue-light focus:outline-none transition">
                            <option value="all">All Roles</option><option value="customer">Customers</option><option value="seller">Sellers</option><option value="admin">Admins</option>
                        </select>
                    </div>
                );
                return (
                    <TableContainer title="User Management" actions={filterActions}>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                           <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"><tr>
                                <SortableHeader title="Name" sortKey="name" sortConfig={sortConfig} requestSort={requestSort} />
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Email / Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Password</th>
                                <SortableHeader title="Status" sortKey="status" sortConfig={sortConfig} requestSort={requestSort} />
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                            </tr></thead>
                            <tbody className="bg-white dark:bg-brand-gray-dark divide-y divide-gray-200 dark:divide-gray-700">
                                {processedUsers.map(user => {
                                    const isCurrentUser = user.email === currentUser.email;
                                    const isPasswordVisible = visiblePasswords.has(user.email);
                                    return (
                                        <tr key={user.email}>
                                            <td className="px-6 py-4">{user.name}{user.isVerified && ' ✅'}</td>
                                            <td className="px-6 py-4"><div className="font-medium">{user.email}</div><div className="text-sm text-gray-500 capitalize">{user.role}</div></td>
                                            <td className="px-6 py-4 text-gray-500 font-mono tracking-widest"><div className="flex items-center gap-2"><span>{isPasswordVisible ? user.password : '••••••••'}</span><button onClick={() => togglePasswordVisibility(user.email)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}>{isPasswordVisible ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 .847 0 1.67.111 2.458.324M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 2l20 20" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274-4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}</button></div></td>
                                            <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{user.status}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button onClick={() => handleEditUserClick(user)} disabled={isCurrentUser} className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed">Edit</button>
                                                <button onClick={() => onToggleUserStatus(user.email)} disabled={isCurrentUser} className={`ml-3 ${user.status === 'active' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'} disabled:opacity-50 disabled:cursor-not-allowed`}>{user.status === 'active' ? 'Deactivate' : 'Reactivate'}</button>
                                                {user.role === 'seller' && (
                                                    <button onClick={() => onToggleVerifiedStatus(user.email)} disabled={isCurrentUser} className="ml-3 text-cyan-600 hover:text-cyan-900 disabled:opacity-50 disabled:cursor-not-allowed">
                                                        {user.isVerified ? 'Un-verify' : 'Verify'}
                                                    </button>
                                                )}
                                                <button onClick={() => onDeleteUser(user.email)} disabled={isCurrentUser} className="ml-3 text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed">Delete</button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </TableContainer>
                );
            case 'listings':
                return (
                    <TableContainer title="Vehicle Listings Management">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800"><tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Vehicle</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Seller</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                            </tr></thead>
                            <tbody className="bg-white dark:bg-brand-gray-dark divide-y divide-gray-200 dark:divide-gray-700">
                                {vehicles.map(v => (
                                    <tr key={v.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">{v.year} {v.make} {v.model} {v.variant || ''}</td>
                                        <td className="px-6 py-4">₹{v.price.toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${v.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{v.status}</span>
                                            {v.isFeatured && <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">Featured</span>}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{v.sellerEmail}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onClick={() => setEditingVehicle(v)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                            <button onClick={() => onToggleVehicleStatus(v.id)} className="ml-3 text-yellow-600 hover:text-yellow-900">{v.status === 'published' ? 'Un-publish' : 'Publish'}</button>
                                            <button onClick={() => onToggleVehicleFeature(v.id)} className="ml-3 text-purple-600 hover:text-purple-900">{v.isFeatured ? 'Un-feature' : 'Feature'}</button>
                                            <button onClick={() => onDeleteVehicle(v.id)} className="ml-3 text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TableContainer>
                );
            case 'moderation':
                return <ModerationQueueView vehicles={vehicles} conversations={conversations} onResolveFlag={onResolveFlag} onToggleVehicleStatus={onToggleVehicleStatus} onToggleUserStatus={onToggleUserStatus} />;
            case 'vehicleData':
                return <VehicleDataEditor vehicleData={vehicleData} onUpdate={onUpdateVehicleData} />;
            case 'auditLog':
                return <AuditLogView auditLog={auditLog} />;
            case 'settings':
                return <PlatformSettingsView settings={platformSettings} onUpdate={onUpdateSettings} onSendBroadcast={onSendBroadcast} />;
        }
    };
    
    return (
    <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
            <aside>
                <div className="bg-white dark:bg-brand-gray-dark p-4 rounded-lg shadow-md space-y-2">
                    <AdminNavItem view="analytics">Analytics</AdminNavItem>
                    <AdminNavItem view="users">User Management</AdminNavItem>
                    <AdminNavItem view="listings">Vehicle Listings</AdminNavItem>
                    <AdminNavItem view="moderation" count={analyticsData.moderationQueueCount}>Moderation Queue</AdminNavItem>
                    <AdminNavItem view="vehicleData">Vehicle Data</AdminNavItem>
                    <AdminNavItem view="auditLog">Audit Log</AdminNavItem>
                    <AdminNavItem view="settings">Platform Settings</AdminNavItem>
                </div>
            </aside>
            <main>
                {renderContent()}
            </main>
        </div>
        
        {isEditModalOpen && selectedUser && (
            <EditUserModal user={selectedUser} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveUser} />
        )}
        {editingVehicle && (
            <EditVehicleModal vehicle={editingVehicle} onClose={() => setEditingVehicle(null)} onSave={handleSaveVehicle} />
        )}
    </div>
  );
};

export default AdminPanel;
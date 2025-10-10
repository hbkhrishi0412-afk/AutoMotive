
import React, { useMemo, useState, useEffect } from 'react';
import type { Vehicle, User, Conversation, PlatformSettings, AuditLogEntry, VehicleData, SupportTicket, FAQItem, TicketReply } from '../types';
import EditUserModal from './EditUserModal';
import EditVehicleModal from './EditVehicleModal';
import { PLAN_DETAILS } from '../constants';
import { VehicleDataBulkUploadModal } from './VehicleDataBulkUploadModal';

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
    supportTickets: SupportTicket[];
    onUpdateSupportTicket: (ticket: SupportTicket) => void;
    faqItems: FAQItem[];
    onAddFaq: (faq: Omit<FAQItem, 'id'>) => void;
    onUpdateFaq: (faq: FAQItem) => void;
    onDeleteFaq: (id: number) => void;
    onCertificationApproval: (vehicleId: number, decision: 'approved' | 'rejected') => void;
}

type AdminView = 'analytics' | 'users' | 'listings' | 'moderation' | 'certificationRequests' | 'vehicleData' | 'auditLog' | 'settings' | 'support' | 'faq';
type RoleFilter = 'all' | 'customer' | 'seller' | 'admin';
// FIX: Restrict sortable keys to prevent comparison errors on incompatible types.
type SortableUserKey = 'name' | 'status';
type SortConfig = {
    key: SortableUserKey;
    direction: 'ascending' | 'descending';
};

// --- Sub-components ---

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode, onClick?: () => void }> = ({ title, value, icon, onClick }) => (
  <div className={`bg-white dark:bg-brand-gray-dark p-6 rounded-lg shadow-md flex items-center ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-transform' : ''}`} onClick={onClick}>
    <div className="bg-brand-blue-lightest p-3 rounded-full mr-4">{icon}</div>
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
    sortKey: SortableUserKey;
    sortConfig: SortConfig | null;
    requestSort: (key: SortableUserKey) => void;
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
                                    {value}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Certification Requests View Component ---
const CertificationRequestsView: React.FC<{
    requests: Vehicle[];
    users: User[];
    onCertificationApproval: (vehicleId: number, decision: 'approved' | 'rejected') => void;
}> = ({ requests, users, onCertificationApproval }) => {
    
    const getSellerInfo = (email: string) => {
        const seller = users.find(u => u.email === email);
        if (!seller) return { planName: 'N/A', usage: 'N/A', hasFreeCredits: false };
        const plan = PLAN_DETAILS[seller.subscriptionPlan || 'free'];
        const used = seller.usedCertifications || 0;
        const total = plan.freeCertifications;
        const usage = `${used}/${total}`;
        return { planName: plan.name, usage, hasFreeCredits: used < total };
    };

    return (
        <TableContainer title={`Pending Certification Requests (${requests.length})`}>
            {requests.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Vehicle</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Seller</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Plan Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-brand-gray-dark divide-y divide-gray-200 dark:divide-gray-700">
                        {requests.map(v => {
                            const sellerInfo = getSellerInfo(v.sellerEmail);
                            return (
                                <tr key={v.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{v.year} {v.make} {v.model}</td>
                                    <td className="px-6 py-4">{v.sellerEmail}</td>
                                    <td className="px-6 py-4">
                                        <div>Plan: <span className="font-semibold">{sellerInfo.planName}</span></div>
                                        <div className="text-sm">Free Certs Used: {sellerInfo.usage}</div>
                                        {!sellerInfo.hasFreeCredits && <div className="text-xs text-yellow-600">No free credits left</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                        <button onClick={() => onCertificationApproval(v.id, 'approved')} className="text-green-600 hover:text-green-900">Approve</button>
                                        <button onClick={() => onCertificationApproval(v.id, 'rejected')} className="text-red-600 hover:text-red-900">Reject</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : <p className="text-center py-8 text-gray-500 dark:text-gray-400">No pending certification requests.</p>}
        </TableContainer>
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
    const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

    useEffect(() => {
        if (selectedCategory && !vehicleData[selectedCategory]) setSelectedCategory(null);
        if (selectedMake && (!selectedCategory || !vehicleData[selectedCategory]?.find(m => m.name === selectedMake))) setSelectedMake(null);
        if (selectedModel && (!selectedCategory || !selectedMake || !vehicleData[selectedCategory]?.find(m => m.name === selectedMake)?.models.find(mo => mo.name === selectedModel))) setSelectedModel(null);
    }, [vehicleData, selectedCategory, selectedMake, selectedModel]);

    const handleAction = (updater: (draft: VehicleData) => void) => {
        const draft = JSON.parse(JSON.stringify(vehicleData));
        updater(draft);
        onUpdate(draft);
    };

    const handleDelete = (path: string[]) => {
        if (!window.confirm(`Are you sure you want to delete "${path[path.length - 1]}"? This action cannot be undone.`)) return;
        handleAction(draft => {
            if (path.length === 1) { // Deleting a Category
                delete draft[path[0]];
            } else if (path.length === 2) { // Deleting a Make
                const category = draft[path[0]];
                const makeIndex = category.findIndex(m => m.name === path[1]);
                if (makeIndex > -1) category.splice(makeIndex, 1);
            } else if (path.length === 3) { // Deleting a Model
                const make = draft[path[0]].find(m => m.name === path[1]);
                if (make) {
                    const modelIndex = make.models.findIndex(mo => mo.name === path[2]);
                    if (modelIndex > -1) make.models.splice(modelIndex, 1);
                }
            } else if (path.length === 4) { // Deleting a Variant
                const model = draft[path[0]].find(m => m.name === path[1])?.models.find(mo => mo.name === path[2]);
                if (model) {
                    const variantIndex = model.variants.indexOf(path[3]);
                    if (variantIndex > -1) model.variants.splice(variantIndex, 1);
                }
            }
        });
        if (path.length === 1 && path[0] === selectedCategory) setSelectedCategory(null);
        if (path.length === 2 && path[1] === selectedMake) setSelectedMake(null);
        if (path.length === 3 && path[2] === selectedModel) setSelectedModel(null);
    };
    
    const handleSaveEdit = () => {
        if (!editingItem || !editingItem.value.trim()) return setEditingItem(null);
        const oldKey = editingItem.path[editingItem.path.length - 1];
        const newKey = editingItem.value.trim();
        if (oldKey === newKey) return setEditingItem(null);

        handleAction(draft => {
            if (editingItem.path.length === 1) {
                if (draft.hasOwnProperty(newKey)) return alert(`Category "${newKey}" already exists.`);
                draft[newKey] = draft[oldKey];
                delete draft[oldKey];
            } else if (editingItem.path.length === 2) {
                const make = draft[editingItem.path[0]].find(m => m.name === oldKey);
                if (make) make.name = newKey;
            } else if (editingItem.path.length === 3) {
                const model = draft[editingItem.path[0]].find(m => m.name === editingItem.path[1])?.models.find(mo => mo.name === oldKey);
                if (model) model.name = newKey;
            } else if (editingItem.path.length === 4) {
                const model = draft[editingItem.path[0]].find(m => m.name === editingItem.path[1])?.models.find(mo => mo.name === editingItem.path[2]);
                if (model) {
                    const variantIndex = model.variants.indexOf(oldKey);
                    if (variantIndex > -1) model.variants[variantIndex] = newKey;
                }
            }
        });
        setEditingItem(null);
    };

    const handleSaveNewItem = () => {
        if (!addingAt || !newItemValue.trim()) return setAddingAt(null);
        const newValue = newItemValue.trim();

        handleAction(draft => {
            if (addingAt.path.length === 0) { // New Category
                if (draft.hasOwnProperty(newValue)) return alert(`Category "${newValue}" already exists.`);
                draft[newValue] = [];
            } else if (addingAt.path.length === 1) { // New Make
                if (draft[addingAt.path[0]].some(m => m.name === newValue)) return alert(`Make "${newValue}" already exists.`);
                draft[addingAt.path[0]].push({ name: newValue, models: [] });
            } else if (addingAt.path.length === 2) { // New Model
                const make = draft[addingAt.path[0]].find(m => m.name === addingAt.path[1]);
                if (make) {
                    if (make.models.some(m => m.name === newValue)) return alert(`Model "${newValue}" already exists.`);
                    make.models.push({ name: newValue, variants: [] });
                }
            } else if (addingAt.path.length === 3) { // New Variant
                const model = draft[addingAt.path[0]].find(m => m.name === addingAt.path[1])?.models.find(mo => mo.name === addingAt.path[2]);
                if (model) {
                    if (model.variants.includes(newValue)) return alert(`Variant "${newValue}" already exists.`);
                    model.variants.push(newValue);
                }
            }
        });

        setAddingAt(null);
        setNewItemValue('');
    };
    
    const handleSelectCategory = (item: string | null) => { setSelectedCategory(item); setSelectedMake(null); setSelectedModel(null); };
    const handleSelectMake = (item: string | null) => { setSelectedMake(item); setSelectedModel(null); };
    const handleSelectModel = (item: string | null) => setSelectedModel(item);

    const categories = Object.keys(vehicleData).sort();
    const makes = selectedCategory ? (vehicleData[selectedCategory] || []).map(m => m.name).sort() : [];
    const models = selectedCategory && selectedMake ? (vehicleData[selectedCategory]?.find(m => m.name === selectedMake)?.models || []).map(mo => mo.name).sort() : [];
    const variants = selectedCategory && selectedMake && selectedModel ? (vehicleData[selectedCategory]?.find(m => m.name === selectedMake)?.models.find(mo => mo.name === selectedModel)?.variants || []).sort() : [];

    const renderColumn = (title: string, items: string[], pathPrefix: string[], selectedItem: string | null, onSelect: (item: string | null) => void, itemType: string, disabled: boolean = false) => (
        <div className={`bg-brand-gray-50 dark:bg-brand-gray-darker p-3 rounded-lg border dark:border-gray-700 flex flex-col transition-opacity ${disabled ? 'opacity-50' : ''}`}>
            <h3 className="text-md font-bold text-gray-800 dark:text-gray-100 mb-2 px-1">{title}</h3>
            <ul className="space-y-1 overflow-y-auto flex-grow min-h-[200px] max-h-[400px]">
                {items.map(item => {
                    const path = [...pathPrefix, item];
                    const isEditing = editingItem?.path.join() === path.join();
                    return (
                        <li key={item} className="rounded-md">
                            {isEditing ? (
                                <div className="flex items-center gap-2 p-2">
                                    <input type="text" value={editingItem.value} onChange={e => setEditingItem(prev => ({ ...prev!, value: e.target.value }))} autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveEdit()} onBlur={handleSaveEdit} className="w-full text-sm p-1 border rounded bg-white dark:bg-gray-900" />
                                </div>
                            ) : (
                                <div onClick={() => !disabled && onSelect(item)} className={`group flex justify-between items-center p-2 rounded-md ${!disabled ? 'cursor-pointer' : 'cursor-default'} ${selectedItem === item ? 'bg-brand-blue text-white' : !disabled ? 'hover:bg-gray-200 dark:hover:bg-gray-700' : ''}`}>
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
                {!disabled && items.length === 0 && <div className="text-center text-sm text-gray-500 py-4 px-2">No items.</div>}
                {disabled && <div className="text-center text-sm text-gray-500 py-4 px-2">Select an item from the previous column.</div>}
            </ul>
            <div className="mt-2 pt-2 border-t dark:border-gray-700">
                {addingAt?.path.join() === pathPrefix.join() ? (
                    <div className="flex items-center gap-2 p-1">
                        <input type="text" value={newItemValue} onChange={e => setNewItemValue(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveNewItem()} placeholder={`New ${itemType}...`} className="w-full text-sm p-1 border rounded bg-white dark:bg-gray-900" />
                    </div>
                ) : (
                    <button onClick={() => !disabled && setAddingAt({ path: pathPrefix, type: itemType })} disabled={disabled} className="w-full text-sm p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-brand-blue dark:text-brand-blue-light disabled:opacity-50 disabled:cursor-not-allowed">+ Add New {itemType}</button>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-brand-gray-dark p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Manage Vehicle Data</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage dropdown options for the vehicle creation form.</p>
                </div>
                <button onClick={() => setIsBulkUploadOpen(true)} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">
                    Bulk Upload
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {renderColumn("Categories", categories, [], selectedCategory, handleSelectCategory, "Category")}
                {renderColumn("Makes", makes, selectedCategory ? [selectedCategory] : [], selectedMake, handleSelectMake, "Make", !selectedCategory)}
                {renderColumn("Models", models, selectedCategory && selectedMake ? [selectedCategory, selectedMake] : [], selectedModel, handleSelectModel, "Model", !selectedMake)}
                {renderColumn("Variants", variants, selectedCategory && selectedMake && selectedModel ? [selectedCategory, selectedMake, selectedModel] : [], null, () => {}, "Variant", !selectedModel)}
            </div>
            {isBulkUploadOpen && (
// FIX: Changed 'onUpdateVehicleData' to 'onUpdate' to pass the correct prop within the component's scope.
                <VehicleDataBulkUploadModal 
                    onClose={() => setIsBulkUploadOpen(false)} 
                    onUpdateData={onUpdate}
                />
            )}
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

// --- Support Ticket View ---
const SupportTicketsView: React.FC<{
    tickets: SupportTicket[];
    onUpdateTicket: (ticket: SupportTicket) => void;
    currentUser: User;
}> = ({ tickets, onUpdateTicket, currentUser }) => {
    const [statusFilter, setStatusFilter] = useState<'All' | SupportTicket['status']>('All');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [replyText, setReplyText] = useState('');

    const filteredTickets = useMemo(() => {
        const sorted = [...tickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        if (statusFilter === 'All') return sorted;
        return sorted.filter(t => t.status === statusFilter);
    }, [tickets, statusFilter]);

    const handleReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedTicket) return;
        
        const newReply: TicketReply = {
            author: currentUser.email,
            message: replyText.trim(),
            timestamp: new Date().toISOString(),
        };

        const updatedTicket: SupportTicket = {
            ...selectedTicket,
            replies: [...selectedTicket.replies, newReply],
            status: 'In Progress' // Automatically move to 'In Progress' on reply
        };

        onUpdateTicket(updatedTicket);
        setSelectedTicket(updatedTicket); // Update local view
        setReplyText('');
    };

    const handleStatusChange = (newStatus: SupportTicket['status']) => {
        if (!selectedTicket || selectedTicket.status === newStatus) return;
        const updatedTicket = { ...selectedTicket, status: newStatus };
        onUpdateTicket(updatedTicket);
        setSelectedTicket(updatedTicket);
    };
    
    const statusColor = (status: SupportTicket['status']) => {
        switch (status) {
            case 'Open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
            case 'In Progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            case 'Closed': return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-6 h-[calc(100vh-200px)]">
            {/* Ticket List */}
            <div className="bg-white dark:bg-brand-gray-dark p-4 rounded-lg shadow-md flex flex-col">
                <div className="p-2 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Support Tickets</h2>
                    <div className="flex gap-2">
                        {(['All', 'Open', 'In Progress', 'Closed'] as const).map(status => (
                            <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1 text-xs font-semibold rounded-full ${statusFilter === status ? 'bg-brand-blue text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
                <ul className="overflow-y-auto mt-2 flex-grow">
                    {filteredTickets.map(ticket => (
                        <li key={ticket.id}>
                            <button onClick={() => setSelectedTicket(ticket)} className={`w-full text-left p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedTicket?.id === ticket.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold text-sm truncate pr-2 text-gray-800 dark:text-gray-100">{ticket.subject}</p>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${statusColor(ticket.status)}`}>{ticket.status}</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ticket.userName} ({ticket.userEmail})</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Updated: {new Date(ticket.updatedAt).toLocaleString()}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Ticket Detail View */}
            <div className="bg-white dark:bg-brand-gray-dark p-4 rounded-lg shadow-md flex flex-col">
                {selectedTicket ? (
                    <>
                        <div className="p-2 border-b dark:border-gray-700">
                             <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{selectedTicket.subject}</h3>
                             <p className="text-sm text-gray-500 dark:text-gray-400">Ticket #{selectedTicket.id} from {selectedTicket.userName}</p>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 space-y-4 my-2">
                            {/* Original Message */}
                             <div className="bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{selectedTicket.userName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedTicket.message}</p>
                            </div>
                            {/* Replies */}
                            {selectedTicket.replies.map((reply, index) => (
                                <div key={index} className={`p-3 rounded-lg ${reply.author === currentUser.email ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-700/50'}`}>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{reply.author === currentUser.email ? 'You' : reply.author}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{new Date(reply.timestamp).toLocaleString()}</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reply.message}</p>
                                </div>
                            ))}
                        </div>
                        {selectedTicket.status !== 'Closed' && (
                            <form onSubmit={handleReply} className="p-2 border-t dark:border-gray-700">
                                <textarea
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    placeholder="Type your reply..."
                                    rows={3}
                                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                                />
                                <div className="mt-2 flex justify-between items-center">
                                    <div>
                                        <button type="button" onClick={() => handleStatusChange('Open')} className="text-xs font-semibold text-blue-600 mr-3">Set to Open</button>
                                        <button type="button" onClick={() => handleStatusChange('In Progress')} className="text-xs font-semibold text-yellow-600 mr-3">Set to In Progress</button>
                                        <button type="button" onClick={() => handleStatusChange('Closed')} className="text-xs font-semibold text-gray-600">Close Ticket</button>
                                    </div>
                                    <button type="submit" className="px-4 py-2 bg-brand-blue text-white rounded-md text-sm font-semibold">Send Reply</button>
                                </div>
                            </form>
                        )}
                        {selectedTicket.status === 'Closed' && (
                             <div className="p-4 border-t dark:border-gray-700 text-center">
                                <p className="text-sm text-gray-500 italic">This ticket is closed.</p>
                                <button onClick={() => handleStatusChange('Open')} className="mt-2 text-sm font-semibold text-brand-blue">Re-open Ticket</button>
                             </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        <p className="mt-2 font-semibold">Select a ticket to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- FAQ Editor View ---
const FAQEditorView: React.FC<{
    faqItems: FAQItem[];
    onAdd: (faq: Omit<FAQItem, 'id'>) => void;
    onUpdate: (faq: FAQItem) => void;
    onDelete: (id: number) => void;
}> = ({ faqItems, onAdd, onUpdate, onDelete }) => {
    const [editingItem, setEditingItem] = useState<FAQItem | Partial<FAQItem> | null>(null);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || !editingItem.question || !editingItem.answer || !editingItem.category) return;
        
        if ('id' in editingItem && editingItem.id) {
            onUpdate(editingItem as FAQItem);
        } else {
            onAdd(editingItem as Omit<FAQItem, 'id'>);
        }
        setEditingItem(null);
    };

    const handleCancel = () => {
        setEditingItem(null);
    };

    const startEditing = (item: FAQItem) => {
        setEditingItem(item);
    };

    const startAdding = () => {
        setEditingItem({ question: '', answer: '', category: 'General' });
    };

    const categories = useMemo(() => [...new Set(faqItems.map(f => f.category))].sort(), [faqItems]);

    if (editingItem) {
        return (
            <div className="bg-white dark:bg-brand-gray-dark p-6 rounded-lg shadow-md animate-fade-in">
                <h2 className="text-xl font-bold mb-4">{'id' in editingItem ? 'Edit' : 'Add'} FAQ</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <input type="text" placeholder="Question" value={editingItem.question} onChange={e => setEditingItem(p => ({...p, question: e.target.value}))} className="w-full p-2 border rounded" required />
                    <textarea placeholder="Answer" value={editingItem.answer} onChange={e => setEditingItem(p => ({...p, answer: e.target.value}))} className="w-full p-2 border rounded" rows={4} required />
                    <input type="text" placeholder="Category" value={editingItem.category} onChange={e => setEditingItem(p => ({...p, category: e.target.value}))} className="w-full p-2 border rounded" list="faq-categories" required />
                    <datalist id="faq-categories">
                        {categories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                    <div className="flex gap-4">
                        <button type="submit" className="px-4 py-2 bg-brand-blue text-white rounded">Save</button>
                        <button type="button" onClick={handleCancel} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <TableContainer title="Manage FAQs" actions={<button onClick={startAdding} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg">Add FAQ</button>}>
            <table className="min-w-full">
                <thead><tr><th>Question</th><th>Category</th><th>Actions</th></tr></thead>
                <tbody>
                    {faqItems.map(item => (
                        <tr key={item.id}>
                            <td>{item.question}</td>
                            <td>{item.category}</td>
                            <td>
                                <button onClick={() => startEditing(item)} className="text-blue-500 mr-2">Edit</button>
                                <button onClick={() => onDelete(item.id)} className="text-red-500">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </TableContainer>
    );
};

// --- MAIN ADMIN PANEL COMPONENT ---

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
    const {
        users, currentUser, vehicles, conversations, onToggleUserStatus, onDeleteUser,
        onAdminUpdateUser, onUpdateVehicle, onDeleteVehicle, onToggleVehicleStatus,
        onToggleVehicleFeature, onResolveFlag, platformSettings, onUpdateSettings, onSendBroadcast,
        auditLog, onExportUsers, onExportVehicles, onExportSales, vehicleData, onUpdateVehicleData,
        onToggleVerifiedStatus, supportTickets, onUpdateSupportTicket, faqItems, onAddFaq, onUpdateFaq, onDeleteFaq,
        onCertificationApproval
    } = props;
    const [activeView, setActiveView] = useState<AdminView>('analytics');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    const analytics = useMemo(() => {
        const totalUsers = users.length;
        const totalVehicles = vehicles.length;
        const activeListings = vehicles.filter(v => v.status === 'published').length;
        const soldListings = vehicles.filter(v => v.status === 'sold');
// FIX: Added Number() to ensure v.price is treated as a number, preventing arithmetic errors on potentially mixed types.
        const totalSales = soldListings.reduce((sum: number, v) => sum + Number(v.price || 0), 0);
        const flaggedVehiclesCount = vehicles.reduce((sum: number, v) => v.isFlagged ? sum + 1 : sum, 0);
        const flaggedConversationsCount = conversations.reduce((sum: number, c) => c.isFlagged ? sum + 1 : sum, 0);
        const flaggedContent = flaggedVehiclesCount + flaggedConversationsCount;
        const certificationRequests = vehicles.filter(v => v.certificationStatus === 'requested').length;
        
        const listingsByMake = vehicles.reduce((acc, v) => {
            acc[v.make] = (acc[v.make] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const userSignups = users.reduce((acc, u) => {
            const date = new Date(u.createdAt).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const userSignupsChartData = Object.entries(userSignups)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .slice(-30) // Last 30 days
            .map(([label, value]) => ({ label, value }));
        
        const listingsByMakeChartData = Object.entries(listingsByMake)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 10)
            .map(([label, value]) => ({ label, value }));

        return {
            totalUsers, totalVehicles, activeListings, totalSales, flaggedContent, certificationRequests,
            listingsByMakeChartData,
            userSignupsChartData
        };
    }, [users, vehicles, conversations]);

    const filteredUsers = useMemo(() => {
        let sortableUsers = [...users];
        if (roleFilter !== 'all') {
            sortableUsers = sortableUsers.filter(user => user.role === roleFilter);
        }
        if (sortConfig !== null) {
            sortableUsers.sort((a, b) => {
                const valA = String(a[sortConfig.key]);
                const valB = String(b[sortConfig.key]);
                if (valA < valB) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (valA > valB) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableUsers;
    }, [users, roleFilter, sortConfig]);

    const requestSort = (key: SortableUserKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleSaveUser = (email: string, details: { name: string; mobile: string; role: User['role'] }) => {
        onAdminUpdateUser(email, details);
        setEditingUser(null);
    };

    const handleSaveVehicle = (vehicle: Vehicle) => {
        onUpdateVehicle(vehicle);
        setEditingVehicle(null);
    };
    
    const renderContent = () => {
        switch(activeView) {
            case 'analytics':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <StatCard title="Total Users" value={analytics.totalUsers} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>} onClick={() => setActiveView('users')} />
                            <StatCard title="Active Listings" value={analytics.activeListings} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17v-2a4 4 0 00-4-4h-1.5m1.5 4H13m-2 0a2 2 0 104 0 2 2 0 00-4 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 11V7a4 4 0 00-4-4H7a4 4 0 00-4 4v4" /></svg>} onClick={() => setActiveView('listings')} />
                            <StatCard title="Total Sales" value={`₹${(analytics.totalSales / 100000).toFixed(2)}L`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} />
                            <StatCard title="Flagged Content" value={analytics.flaggedContent} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>} onClick={() => setActiveView('moderation')} />
                            <StatCard title="Open Support Tickets" value={supportTickets.filter(t => t.status !== 'Closed').length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} onClick={() => setActiveView('support')} />
                            <StatCard title="Certification Requests" value={analytics.certificationRequests} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-blue" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812z" clipRule="evenodd" /></svg>} onClick={() => setActiveView('certificationRequests')} />
                        </div>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <BarChart title="Top 10 Vehicle Makes" data={analytics.listingsByMakeChartData} />
                            <BarChart title="User Signups (Last 30 Days)" data={analytics.userSignupsChartData} />
                        </div>
                        <div className="bg-white dark:bg-brand-gray-dark p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-bold mb-4">Export Data</h3>
                            <div className="flex flex-wrap gap-4">
                                <button onClick={onExportUsers} className="bg-gray-200 dark:bg-gray-700 font-semibold py-2 px-4 rounded-lg">Export Users (CSV)</button>
                                <button onClick={onExportVehicles} className="bg-gray-200 dark:bg-gray-700 font-semibold py-2 px-4 rounded-lg">Export Listings (CSV)</button>
                                <button onClick={onExportSales} className="bg-gray-200 dark:bg-gray-700 font-semibold py-2 px-4 rounded-lg">Export Sales Report (CSV)</button>
                            </div>
                        </div>
                    </div>
                );
            case 'users':
                const userFilterActions = (
                     <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)} className="p-2 border border-brand-gray dark:border-gray-600 rounded-lg bg-white dark:bg-brand-gray-darker dark:text-gray-200">
                        <option value="all">All Roles</option>
                        <option value="customer">Customers</option>
                        <option value="seller">Sellers</option>
                        <option value="admin">Admins</option>
                    </select>
                );
                return (
                   <TableContainer title="User Management" actions={userFilterActions}>
                       <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"><tr>
                                <SortableHeader title="Name" sortKey="name" sortConfig={sortConfig} requestSort={requestSort} />
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Email & Mobile</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Role</th>
                                <SortableHeader title="Status" sortKey="status" sortConfig={sortConfig} requestSort={requestSort} />
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Verified</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                            </tr></thead>
                            <tbody className="bg-white dark:bg-brand-gray-dark divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredUsers.map(user => {
                                    const isCurrentUser = user.email === currentUser.email;
                                    return (
                                        <tr key={user.email}>
                                            <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm"><p>{user.email}</p><p className="text-gray-500">{user.mobile}</p></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : user.role === 'seller' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{user.role}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{user.status}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {user.role === 'seller' && (
                                                    <input 
                                                        type="checkbox" 
                                                        checked={user.isVerified || false} 
                                                        onChange={() => onToggleVerifiedStatus(user.email)}
                                                        className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300 rounded"
                                                        title={user.isVerified ? "Un-verify seller" : "Verify seller"}
                                                    />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                                <button onClick={() => setEditingUser(user)} className="text-brand-blue hover:text-brand-blue-dark">Edit</button>
                                                <button onClick={() => onToggleUserStatus(user.email)} disabled={isCurrentUser} className={`${user.status === 'active' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'} disabled:opacity-50 disabled:cursor-not-allowed`}>{user.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                                                <button onClick={() => onDeleteUser(user.email)} disabled={isCurrentUser} className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed">Delete</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                       </table>
                   </TableContainer>
                );
            case 'listings':
                return (
                   <TableContainer title="All Listings">
                       <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800"><tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Listing</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Seller</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Featured</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                            </tr></thead>
                            <tbody className="bg-white dark:bg-brand-gray-dark divide-y divide-gray-200 dark:divide-gray-700">
                                {vehicles.map(v => (
                                    <tr key={v.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">{v.year} {v.make} {v.model}</td>
                                        <td className="px-6 py-4 text-sm">{v.sellerEmail}</td>
                                        <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${v.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{v.status}</span></td>
                                        <td className="px-6 py-4">{v.isFeatured ? 'Yes' : 'No'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                            <button onClick={() => setEditingVehicle(v)} className="text-brand-blue hover:text-brand-blue-dark">Edit</button>
                                            <button onClick={() => onToggleVehicleStatus(v.id)} className="text-yellow-600 hover:text-yellow-900">{v.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                                            <button onClick={() => onToggleVehicleFeature(v.id)} className="text-purple-600 hover:text-purple-900">{v.isFeatured ? 'Un-feature' : 'Feature'}</button>
                                            <button onClick={() => onDeleteVehicle(v.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                       </table>
                   </TableContainer>
                );
            case 'moderation':
                return <ModerationQueueView vehicles={vehicles} conversations={conversations} onResolveFlag={onResolveFlag} onToggleVehicleStatus={onToggleVehicleStatus} onToggleUserStatus={onToggleUserStatus} />;
            case 'certificationRequests':
                return <CertificationRequestsView requests={vehicles.filter(v => v.certificationStatus === 'requested')} users={users} onCertificationApproval={onCertificationApproval} />;
            case 'vehicleData':
                return <VehicleDataEditor vehicleData={vehicleData} onUpdate={onUpdateVehicleData} />;
            case 'auditLog':
                return <AuditLogView auditLog={auditLog} />;
            case 'settings':
                return <PlatformSettingsView settings={platformSettings} onUpdate={onUpdateSettings} onSendBroadcast={onSendBroadcast} />;
             case 'support':
                return <SupportTicketsView tickets={supportTickets} onUpdateTicket={onUpdateSupportTicket} currentUser={currentUser} />;
            case 'faq':
                return <FAQEditorView faqItems={faqItems} onAdd={onAddFaq} onUpdate={onUpdateFaq} onDelete={onDeleteFaq} />;
            default:
                return <div>Select a view</div>;
        }
    };

    const NavItem: React.FC<{ view: AdminView, label: string, count?: number }> = ({ view, label, count }) => (
        <li>
            <button
                onClick={() => setActiveView(view)}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex justify-between items-center ${activeView === view ? 'bg-brand-blue text-white shadow-md' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
                <span className="font-semibold">{label}</span>
                {count !== undefined && count > 0 && <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${activeView === view ? 'bg-white text-brand-blue' : 'bg-red-500 text-white'}`}>{count}</span>}
            </button>
        </li>
    );

    return (
        <div className="container mx-auto py-8 animate-fade-in">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">Administrator Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
                <aside className="self-start md:sticky top-24">
                    <div className="bg-white dark:bg-brand-gray-dark p-4 rounded-lg shadow-md">
                        <ul className="space-y-1">
                            <NavItem view="analytics" label="Analytics" />
                            <NavItem view="users" label="User Management" />
                            <NavItem view="listings" label="Listings" />
                            <NavItem view="moderation" label="Moderation Queue" count={analytics.flaggedContent} />
                            <NavItem view="certificationRequests" label="Certification Requests" count={analytics.certificationRequests} />
                             <NavItem view="support" label="Support Tickets" count={supportTickets.filter(t => t.status === 'Open').length} />
                            <NavItem view="faq" label="FAQ Management" />
                            <NavItem view="vehicleData" label="Vehicle Data" />
                            <NavItem view="auditLog" label="Audit Log" />
                            <NavItem view="settings" label="Settings" />
                        </ul>
                    </div>
                </aside>
                <main>
                    {renderContent()}
                </main>
            </div>

            {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />}
            {editingVehicle && <EditVehicleModal vehicle={editingVehicle} onClose={() => setEditingVehicle(null)} onSave={handleSaveVehicle} />}
        </div>
    );
};

export default AdminPanel;

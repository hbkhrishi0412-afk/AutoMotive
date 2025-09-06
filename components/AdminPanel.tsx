import React, { useMemo, useState } from 'react';
import type { Vehicle, User, Conversation, PlatformSettings, AuditLogEntry } from '../types';
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
}

type AdminView = 'analytics' | 'users' | 'listings';
type RoleFilter = 'all' | 'customer' | 'seller' | 'admin';
type SortConfig = {
    key: keyof User;
    direction: 'ascending' | 'descending';
};

// --- Sub-components ---

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-brand-gray-dark p-6 rounded-lg shadow-md flex items-center">
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


// --- Main Admin Panel Component ---

const AdminPanel: React.FC<AdminPanelProps> = ({ users, currentUser, vehicles, conversations, onToggleUserStatus, onDeleteUser, onAdminUpdateUser, onUpdateVehicle, onDeleteVehicle, onToggleVehicleStatus, onToggleVehicleFeature, onResolveFlag, platformSettings, onUpdateSettings, onSendBroadcast, auditLog, onExportUsers, onExportVehicles, onExportSales }) => {
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

        return {
            totalSalesValue,
            averagePrice,
            mostPopularMake,
            userRoleChartData,
            listingsByMakeChartData,
        };
    }, [users, vehicles]);

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
    const AdminNavItem: React.FC<{ view: AdminView, children: React.ReactNode }> = ({ view, children }) => (
        <button onClick={() => setActiveView(view)} className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-medium ${activeView === view ? 'bg-brand-blue text-white' : 'hover:bg-brand-gray-light dark:hover:bg-brand-gray-darker'}`}>
          {children}
        </button>
    );
    
    const renderContent = () => {
        switch (activeView) {
            case 'analytics':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="Total Users" value={users.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                            <StatCard title="Total Sales Value" value={`$${analyticsData.totalSalesValue.toLocaleString()}`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01v-2.01m-3.599 3.599A3.001 3.001 0 0012 10m-3.599 1.401a3.001 3.001 0 010 1.198m0 0A3.001 3.001 0 0112 14m-3.599-1.401H12m0 0h3.599m0 0A3.001 3.001 0 0012 12m3.599-1.401a3.001 3.001 0 010-1.198m0 0A3.001 3.001 0 0112 10m3.599 1.401H12m0 0V7m0 1v.01" /></svg>} />
                            <StatCard title="Average Vehicle Price" value={`$${analyticsData.averagePrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>} />
                             <StatCard title="Most Popular Make" value={analyticsData.mostPopularMake} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>} />
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
                                <SortableHeader title="Email / Role" sortKey="email" sortConfig={sortConfig} requestSort={requestSort} />
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
                                            <td className="px-6 py-4">{user.name}</td>
                                            <td className="px-6 py-4"><div className="font-medium">{user.email}</div><div className="text-sm text-gray-500 capitalize">{user.role}</div></td>
                                            <td className="px-6 py-4 text-gray-500 font-mono tracking-widest"><div className="flex items-center gap-2"><span>{isPasswordVisible ? user.password : '••••••••'}</span><button onClick={() => togglePasswordVisibility(user.email)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}>{isPasswordVisible ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 .847 0 1.67.111 2.458.324M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 2l20 20" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}</button></div></td>
                                            <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{user.status}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button onClick={() => handleEditUserClick(user)} disabled={isCurrentUser} className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed">Edit</button>
                                                <button onClick={() => onToggleUserStatus(user.email)} disabled={isCurrentUser} className={`ml-3 ${user.status === 'active' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'} disabled:opacity-50 disabled:cursor-not-allowed`}>{user.status === 'active' ? 'Deactivate' : 'Reactivate'}</button>
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
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">{v.year} {v.make} {v.model}</td>
                                        <td className="px-6 py-4">${v.price.toLocaleString()}</td>
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

import React, { useMemo, useState, useEffect } from 'react';
import type { Vehicle, User, Conversation, PlatformSettings, AuditLogEntry, VehicleData } from '../types';
import EditUserModal from './EditUserModal';
import EditVehicleModal from './EditVehicleModal';
import { PLAN_DETAILS, INSPECTION_SERVICE_FEE } from '../constants';

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
// FIX: Restrict sortable keys to prevent comparison errors on incompatible types.
type SortableUserKey = 'name' | 'status';
type SortConfig = {
    key: SortableUserKey;
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


// --- MAIN ADMIN PANEL COMPONENT ---

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
    const {
        users, currentUser, vehicles, conversations, onToggleUserStatus, onDeleteUser,
        onAdminUpdateUser, onUpdateVehicle, onDeleteVehicle, onToggleVehicleStatus,
        onToggleVehicleFeature, onResolveFlag, platformSettings, onUpdateSettings, onSendBroadcast,
        auditLog, onExportUsers, onExportVehicles, onExportSales, vehicleData, onUpdateVehicleData,
        onToggleVerifiedStatus
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
        // FIX: Add explicit type for reduce accumulator to avoid implicit 'any' issues.
        const totalSales = soldListings.reduce((sum: number, v) => sum + v.price, 0);
        const flaggedContent = vehicles.filter(v => v.isFlagged).length + conversations.filter(c => c.isFlagged).length;
        const certificationRequests = vehicles.filter(v => v.certificationStatus === 'requested').length;
        
        // FIX: Add explicit type for reduce accumulator.
        const listingsByMake = vehicles.reduce((acc, v) => {
            acc[v.make] = (acc[v.make] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // FIX: Add explicit type for reduce accumulator.
        const userSignups = users.reduce((acc, u) => {
            const date = new Date(u.createdAt).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const userSignupsChartData = Object.entries(userSignups)
            // FIX: Use .getTime() to perform a numeric subtraction on dates, which is a valid arithmetic operation.
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
    // FIX: Add missing 'conversations' dependency to the useMemo hook.
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

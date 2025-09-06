import React, { useMemo, useState } from 'react';
import type { User, View } from '../types';
import { View as ViewEnum } from '../types';

interface UserManagementProps {
    users: User[];
    currentUser: User;
    onToggleUserStatus: (email: string) => void;
    onDeleteUser: (email: string) => void;
    onCreateUser: (userData: Omit<User, 'status'>) => { success: boolean, reason: string };
    onNavigate: (view: View) => void;
}

// FIX: Correct 'dealer' to 'seller' to match the User type.
type RoleFilter = 'all' | 'customer' | 'seller';

const initialFormState: Omit<User, 'status'> = {
    name: '',
    email: '',
    password: '',
    mobile: '',
    role: 'customer'
};

// Create User Modal
const CreateUserModal: React.FC<{
    onClose: () => void;
    onCreateUser: (userData: Omit<User, 'status'>) => { success: boolean, reason: string };
}> = ({ onClose, onCreateUser }) => {
    const [formData, setFormData] = useState(initialFormState);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setError('');
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.name || !formData.email || !formData.password || !formData.mobile) {
            setError('All fields are required.');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        const result = onCreateUser(formData);
        if (result.success) {
            onClose();
        } else {
            setError(result.reason);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-brand-gray-dark rounded-lg shadow-2xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                           <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Create New User</h2>
                           <button type="button" onClick={onClose} className="text-gray-500 dark:text-gray-400 text-2xl hover:text-gray-800 dark:hover:text-gray-200">&times;</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
                                <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                                <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md">
                                    <option value="customer">Customer</option>
                                    {/* FIX: Correct 'dealer' to 'seller' to match the User type. */}
                                    <option value="seller">Seller</option>
                                </select>
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-brand-gray-darker px-6 py-3 flex justify-end gap-4 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark">Create User</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UserManagement: React.FC<UserManagementProps> = ({ users, currentUser, onToggleUserStatus, onDeleteUser, onCreateUser, onNavigate }) => {
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const filteredUsers = useMemo(() => {
        if (roleFilter === 'all') return users;
        // FIX: The comparison below now works correctly after aligning RoleFilter and User['role'] types.
        return users.filter(user => user.role === roleFilter);
    }, [users, roleFilter]);

    const filterActions = (
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)} className="p-2 border border-brand-gray dark:border-gray-600 rounded-lg bg-white dark:bg-brand-gray-darker dark:text-gray-200">
            <option value="all">All Users</option>
            <option value="customer">Customers</option>
            {/* FIX: Correct 'dealer' to 'seller' to match the User type. */}
            <option value="seller">Sellers</option>
        </select>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                     <button onClick={() => onNavigate(ViewEnum.ADMIN_PANEL)} className="text-sm text-brand-blue hover:underline mb-2">&larr; Back to Admin Dashboard</button>
                     <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">User Management</h1>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                    Create User
                </button>
            </div>
            
            <div className="bg-white dark:bg-brand-gray-dark p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">All Users</h2>
                    <div>{filterActions}</div>
                </div>
                <div className="overflow-x-auto">
                   <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-brand-gray-dark divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredUsers.map(user => {
                                const isCurrentUser = user.email === currentUser.email;
                                return (
                                    <tr key={user.email}>
                                        <td className="px-6 py-4">{user.name}</td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : user.role === 'seller' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{user.role}</span></td>
                                        <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{user.status}</span></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button 
                                                onClick={() => onToggleUserStatus(user.email)} 
                                                disabled={isCurrentUser}
                                                className={`mr-3 ${user.status === 'active' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                                {user.status === 'active' ? 'Deactivate' : 'Reactivate'}
                                            </button>
                                            <button 
                                                onClick={() => onDeleteUser(user.email)} 
                                                disabled={isCurrentUser}
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {isCreateModalOpen && <CreateUserModal onClose={() => setIsCreateModalOpen(false)} onCreateUser={onCreateUser} />}
        </div>
    );
};

export default UserManagement;
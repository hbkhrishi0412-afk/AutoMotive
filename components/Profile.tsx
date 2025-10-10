
import React, { useState, useEffect } from 'react';
import type { User } from '../types';

interface ProfileProps {
  currentUser: User;
  onUpdateProfile: (details: { name: string; mobile: string; avatarUrl?: string }) => void;
  // FIX: Changed onUpdatePassword to return a Promise<boolean> as it's an async function.
  onUpdatePassword: (passwords: { current: string; new: string }) => Promise<boolean>;
}

const ProfileInput: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; disabled?: boolean; }> = 
  ({ label, name, value, onChange, type = 'text', disabled = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{label}</label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="mt-1 block w-full p-3 border border-brand-gray-300 dark:border-brand-gray-600 rounded-lg shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white dark:bg-brand-gray-800 disabled:bg-brand-gray-100 dark:disabled:bg-brand-gray-700"
    />
  </div>
);

const Profile: React.FC<ProfileProps> = ({ currentUser, onUpdateProfile, onUpdatePassword }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser.name,
    mobile: currentUser.mobile,
    avatarUrl: currentUser.avatarUrl || '',
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordError, setPasswordError] = useState('');

  // Sync form data if currentUser changes from parent
  useEffect(() => {
    setFormData({
      name: currentUser.name,
      mobile: currentUser.mobile,
      avatarUrl: currentUser.avatarUrl || '',
    });
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setFormData(prev => ({ ...prev, avatarUrl: event.target.result as string }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordError) setPasswordError('');
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // If canceling, revert changes
      setFormData({ name: currentUser.name, mobile: currentUser.mobile, avatarUrl: currentUser.avatarUrl || '' });
    }
    setIsEditing(!isEditing);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setIsEditing(false);
  };

  // FIX: Made function async and awaited the result of onUpdatePassword.
  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordData.new !== passwordData.confirm) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwordData.new.length < 6) {
        setPasswordError("New password must be at least 6 characters long.");
        return;
    }

    const success = await onUpdatePassword({ current: passwordData.current, new: passwordData.new });
    if (success) {
      setPasswordData({ current: '', new: '', confirm: '' });
    } else {
        // Error toast is handled in App.tsx, but we can also set local error state
        setPasswordError("Your current password was incorrect.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-8 container py-8">
      <h1 className="text-3xl font-extrabold text-brand-gray-900 dark:text-brand-gray-100">My Profile</h1>
      
      {/* Account Details Card */}
      <div className="bg-white dark:bg-brand-gray-800 shadow-soft-lg rounded-xl overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100 mb-4">Account Details</h2>
          <form onSubmit={handleProfileSave}>
             <div className="flex flex-col items-center space-y-4 mb-6">
              <div className="relative">
                <img
                  src={formData.avatarUrl || `https://i.pravatar.cc/150?u=${currentUser.email}`}
                  alt="Profile Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-brand-gray-200 dark:border-brand-gray-700"
                />
                {isEditing && (
                  <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-brand-blue text-white rounded-full p-2 cursor-pointer hover:bg-brand-blue-dark transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                    <input id="avatar-upload" type="file" className="sr-only" accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <ProfileInput
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">Email</label>
                <p className="mt-1 text-lg text-brand-gray-500 dark:text-brand-gray-400">{currentUser.email}</p>
                <p className="mt-1 text-xs text-brand-gray-400">Email address cannot be changed.</p>
              </div>
              <ProfileInput
                label="Mobile Number"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className="mt-6 flex gap-4">
              {isEditing ? (
                <>
                  <button type="submit" className="px-6 py-2 bg-brand-blue text-white font-semibold rounded-md hover:bg-brand-blue-dark transition-colors">
                    Save Changes
                  </button>
                  <button type="button" onClick={handleEditToggle} className="px-6 py-2 bg-brand-gray-200 dark:bg-brand-gray-600 text-brand-gray-800 dark:text-brand-gray-200 font-semibold rounded-md hover:bg-brand-gray-300 dark:hover:bg-brand-gray-500 transition-colors">
                    Cancel
                  </button>
                </>
              ) : (
                <button type="button" onClick={handleEditToggle} className="px-6 py-2 bg-brand-blue-light text-white font-semibold rounded-md hover:bg-brand-blue transition-colors">
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white dark:bg-brand-gray-800 shadow-soft-lg rounded-xl overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordSave}>
            <div className="space-y-4">
              <ProfileInput
                label="Current Password"
                name="current"
                type="password"
                value={passwordData.current}
                onChange={handlePasswordChange}
              />
              <ProfileInput
                label="New Password"
                name="new"
                type="password"
                value={passwordData.new}
                onChange={handlePasswordChange}
              />
              <ProfileInput
                label="Confirm New Password"
                name="confirm"
                type="password"
                value={passwordData.confirm}
                onChange={handlePasswordChange}
              />
              {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
            </div>
            <div className="mt-6">
              <button type="submit" className="px-6 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors disabled:opacity-50" disabled={!passwordData.current || !passwordData.new || !passwordData.confirm}>
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

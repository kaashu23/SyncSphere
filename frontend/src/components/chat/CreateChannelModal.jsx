import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function CreateChannelModal({ isOpen, onClose, onCreated }) {
  const { user } = useUser();
  const [name, setName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      searchUsers('');
    }
  }, [isOpen]);

  const searchUsers = async (query) => {
    try {
      const config = { headers: { 'clerk-id': user.id } };
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users?search=${query}`, config);
      setUsersList(data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  const toggleUser = (u) => {
    if (selectedUsers.find(su => su._id === u._id)) {
      setSelectedUsers(selectedUsers.filter(su => su._id !== u._id));
    } else {
      setSelectedUsers([...selectedUsers, u]);
    }
  };

  const handleCreate = async () => {
    if (!name || selectedUsers.length < 1) {
      toast.error('Please enter a name and select at least 1 user');
      return;
    }
    setLoading(true);
    try {
      const config = { headers: { 'clerk-id': user.id } };
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/chats/group`, {
        name,
        users: JSON.stringify(selectedUsers.map(u => u._id))
      }, config);
      toast.success('Channel created!');
      onCreated(data);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating channel');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-2xl rounded-xl shadow-ambient p-lg md:p-xl border border-outline-variant/30 flex flex-col gap-lg transform scale-100 animate-in fade-in duration-200 max-h-[85vh]">
        <div className="flex justify-between items-center border-b border-outline-variant/30 pb-sm shrink-0">
          <h2 className="font-title-sm text-title-sm text-on-surface font-semibold flex items-center gap-sm">
            <span className="material-symbols-outlined">tag</span>
            Create Channel
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-md md:gap-xl flex-1 min-h-0">
          <div className="md:w-2/5 flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-on-surface-variant">Channel Name</label>
              <input 
                type="text" 
                placeholder="e.g. engineering, general"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-on-surface-variant">
                Selected Members ({selectedUsers.length})
              </label>
              <div className="bg-surface-container-low rounded-xl p-sm min-h-[90px] max-h-40 overflow-y-auto flex flex-wrap gap-1.5 content-start">
                {selectedUsers.length === 0 && (
                  <p className="font-body-sm text-on-surface-variant/70 p-xs">No members selected yet</p>
                )}
                {selectedUsers.map(u => (
                  <span key={u._id} className="flex items-center gap-1 bg-surface-container-high text-on-surface font-body-sm px-2 py-1 rounded-full">
                    {u.displayName}
                    <button onClick={() => toggleUser(u)} className="text-on-surface-variant hover:text-error transition-colors flex items-center">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="md:w-3/5 flex flex-col gap-xs min-h-0">
            <label className="font-label-caps text-label-caps text-on-surface-variant">Add Members</label>
            <input 
              type="text" 
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); searchUsers(e.target.value); }}
              className="w-full bg-surface-bright border border-outline-variant rounded-lg px-3 py-1.5 mb-sm font-body-sm text-on-surface outline-none focus:border-primary"
            />
            <div className="flex-1 max-h-64 overflow-y-auto space-y-1 pr-1">
              {usersList.map(u => (
                <div key={u._id} onClick={() => toggleUser(u)} className={`flex items-center gap-sm p-sm rounded-lg cursor-pointer transition-colors border ${selectedUsers.find(su => su._id === u._id) ? 'bg-primary-fixed/30 border-primary/50' : 'hover:bg-surface-container-low border-transparent'}`}>
                  <img src={u.avatarUrl || '/avatars/avatar_female_light.jpg'} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-body-sm text-on-surface font-medium truncate">{u.displayName}</p>
                    <p className="font-body-sm text-on-surface-variant truncate">{u.username ? `@${u.username}` : u.email}</p>
                  </div>
                  {selectedUsers.find(su => su._id === u._id) && (
                    <span className="material-symbols-outlined text-primary text-[20px] shrink-0">check_circle</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-sm mt-md shrink-0">
          <button onClick={onClose} className="flex-1 py-sm rounded-lg font-title-sm text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={loading} className="flex-1 py-sm rounded-lg font-title-sm text-on-primary bg-primary hover:bg-primary-container transition-colors disabled:opacity-50">Create Channel</button>
        </div>
      </div>
    </div>
  );
}

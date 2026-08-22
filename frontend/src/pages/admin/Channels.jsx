import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Channels() {
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchUser1, setSearchUser1] = useState('');
  const [selectedUser1, setSelectedUser1] = useState(null);
  const [searchUser2, setSearchUser2] = useState('');

  const fetchData = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      const [usersRes, chatsRes] = await Promise.all([
        axios.get(`${baseUrl}/api/admin/users`),
        axios.get(`${baseUrl}/api/admin/chats`)
      ]);
      
      if (Array.isArray(usersRes.data)) setUsers(usersRes.data);
      if (Array.isArray(chatsRes.data)) setChats(chatsRes.data);
    } catch (error) {
      console.error('Error fetching export data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = (chatId) => {
    const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    window.location.href = `${baseUrl}/api/admin/export/${chatId}`;
  };

  // Filter users based on search
  const filteredUsers = users.filter(u => 
    `${u.displayName}`.toLowerCase().includes(searchUser1.toLowerCase()) || 
    u.email.toLowerCase().includes(searchUser1.toLowerCase())
  );

  // Filter chats for the selected user
  const userChats = selectedUser1 
    ? chats.filter(chat => chat.users.some(u => u._id === selectedUser1._id))
    : [];

  // Filter the friends/chats based on the second search
  const filteredUserChats = userChats.filter(chat => {
    if (!searchUser2) return true;
    const otherUsers = chat.users.filter(u => u._id !== selectedUser1._id);
    const names = otherUsers.map(u => u.displayName).join(' ');
    const chatName = chat.chatName || '';
    return names.toLowerCase().includes(searchUser2.toLowerCase()) || chatName.toLowerCase().includes(searchUser2.toLowerCase());
  });

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto w-full flex flex-col gap-lg h-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-xs">
          <h2 className="font-display-lg text-display-lg text-on-surface">Data Exports & Logs</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Search for a user to export their specific conversations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg h-full overflow-hidden pb-4">
        
        {/* Step 1: Select User */}
        <div className="lg:col-span-1 flex flex-col gap-sm bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-ambient p-4 h-full">
          <h3 className="font-title-md text-title-md text-on-surface">1. Select User</h3>
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchUser1}
            onChange={(e) => setSearchUser1(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-on-surface font-body-sm outline-none focus:border-primary"
          />
          <div className="flex-1 overflow-y-auto mt-2 pr-1 space-y-1">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg flex items-center gap-3 animate-pulse border border-transparent">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high shrink-0"></div>
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-4 bg-surface-container-high rounded w-3/4"></div>
                    <div className="h-3 bg-surface-container-high rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div 
                  key={user._id} 
                  onClick={() => setSelectedUser1(user)}
                  className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${selectedUser1?._id === user._id ? 'bg-primary-container text-on-primary-container border border-primary/30' : 'hover:bg-surface-container-high border border-transparent text-on-surface'}`}
                >
                  <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`} className="w-8 h-8 rounded-full object-cover" alt="Avatar"/>
                  <div className="flex-1 min-w-0">
                    <p className="font-title-sm truncate">{user.displayName || 'Unknown User'}</p>
                    <p className="font-body-sm text-xs opacity-70 truncate">{user.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center font-body-sm text-on-surface-variant p-4">No users found.</p>
            )}
          </div>
        </div>

        {/* Step 2: Select Chat/Friend */}
        <div className="lg:col-span-2 flex flex-col gap-sm bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-ambient p-4 h-full">
          <h3 className="font-title-md text-title-md text-on-surface">2. Select Friend to Export</h3>
          {selectedUser1 ? (
            <>
              <input 
                type="text" 
                placeholder="Search their friends or groups..." 
                value={searchUser2}
                onChange={(e) => setSearchUser2(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-on-surface font-body-sm outline-none focus:border-primary"
              />
              <div className="flex-1 overflow-y-auto mt-2 pr-1 space-y-2">
                {filteredUserChats.length > 0 ? (
                  filteredUserChats.map(chat => {
                    const otherUsers = chat.users.filter(u => u._id !== selectedUser1._id);
                    const chatTitle = chat.isGroupChat ? chat.chatName : otherUsers.map(u => u.displayName).join(', ');
                    
                    return (
                      <div key={chat._id} className="p-3 bg-surface-container-high rounded-lg border border-outline-variant/20 flex items-center justify-between group hover:border-primary/50 transition-colors">
                        <div className="flex flex-col min-w-0 flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-label-caps ${chat.isGroupChat ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'}`}>
                              {chat.isGroupChat ? 'Group' : 'Direct'}
                            </span>
                            <p className="font-title-sm text-on-surface truncate">{chatTitle}</p>
                          </div>
                          <p className="font-body-sm text-xs text-on-surface-variant mt-1 truncate">
                            {otherUsers.map(u => u.email).join(', ')}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleExport(chat._id)}
                          className="px-4 py-2 bg-primary text-on-primary rounded-lg font-title-sm text-sm hover:bg-primary-container hover:text-on-primary-container transition-colors shrink-0 flex items-center gap-2 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                          Export
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-on-surface-variant gap-2 opacity-60">
                    <span className="material-symbols-outlined text-4xl">search_off</span>
                    <p className="font-body-sm">No chats found for this user.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant gap-2 opacity-60">
              <span className="material-symbols-outlined text-4xl">person_search</span>
              <p className="font-body-sm">Select a user from the left pane first.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

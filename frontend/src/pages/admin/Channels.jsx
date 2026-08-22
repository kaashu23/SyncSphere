import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Channels() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/chats`);
      setChats(data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const handleExport = (chatId) => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/admin/export/${chatId}`;
  };

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto w-full flex flex-col gap-lg h-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-xs">
          <h2 className="font-display-lg text-display-lg text-on-surface">Data Exports & Logs</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">View and export all chat data.</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-ambient">
        {loading ? (
          <div className="flex items-center justify-center p-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-caps text-label-caps">
                <th className="p-sm pl-lg">Chat Name / Users</th>
                <th className="p-sm">Type</th>
                <th className="p-sm">Last Active</th>
                <th className="p-sm pr-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {chats.map(chat => (
                <tr key={chat._id} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                  <td className="p-sm pl-lg font-title-sm text-title-sm text-on-surface">
                    {chat.isGroupChat ? chat.chatName : chat.users.map(u => u.firstName).join(', ')}
                  </td>
                  <td className="p-sm">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-label-caps ${chat.isGroupChat ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'}`}>
                      {chat.isGroupChat ? 'Group' : 'Direct'}
                    </span>
                  </td>
                  <td className="p-sm font-body-sm text-on-surface-variant">
                    {new Date(chat.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="p-sm pr-lg text-right">
                    <button 
                      onClick={() => handleExport(chat._id)}
                      className="px-3 py-1.5 bg-surface-container-high hover:bg-outline-variant/30 text-on-surface rounded-lg font-title-sm text-[12px] flex items-center justify-center gap-1 ml-auto transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      Export
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Overview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalChats: 0,
    totalMessages: 0,
    pendingReports: 0
  });

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/stats`);
      setStats(data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    // Real-time monitor polling every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto w-full flex flex-col gap-lg">
      <div className="flex flex-col gap-xs mb-sm">
        <h2 className="font-display-lg text-display-lg text-on-surface">Live Dashboard</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Real-time monitoring of platform activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant/30 shadow-ambient flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <span className="font-title-sm text-title-sm text-on-surface-variant">Total Users</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[18px]">group</span>
            </div>
          </div>
          <div className="flex items-baseline gap-sm">
            <span className="font-display-lg text-display-lg text-on-surface">{stats.totalUsers}</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant/30 shadow-ambient flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <span className="font-title-sm text-title-sm text-on-surface-variant">Active Online</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-green-400">
              <span className="material-symbols-outlined text-[18px]">online_prediction</span>
            </div>
          </div>
          <div className="flex items-baseline gap-sm">
            <span className="font-display-lg text-display-lg text-on-surface text-green-400 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span> {stats.activeUsers}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant/30 shadow-ambient flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <span className="font-title-sm text-title-sm text-on-surface-variant">Total Chats</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary-fixed">
              <span className="material-symbols-outlined text-[18px]">forum</span>
            </div>
          </div>
          <div className="flex items-baseline gap-sm">
            <span className="font-display-lg text-display-lg text-on-surface">{stats.totalChats}</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant/30 shadow-ambient flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <span className="font-title-sm text-title-sm text-on-surface-variant">Total Messages</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[18px]">chat</span>
            </div>
          </div>
          <div className="flex items-baseline gap-sm">
            <span className="font-display-lg text-display-lg text-on-surface">{stats.totalMessages}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

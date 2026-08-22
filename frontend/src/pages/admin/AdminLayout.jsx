import { useUser } from '@clerk/clerk-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminLayout() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
      const { data } = await axios.get(`${baseUrl}/api/admin/notifications`);
      if (Array.isArray(data)) setNotifications(data);
    } catch (e) {
      console.error(e);
    }
  };

  const markRead = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
      await axios.post(`${baseUrl}/api/admin/notifications/read`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user && user.primaryEmailAddress?.emailAddress !== 'kashishsalvi06@gmail.com') {
      navigate('/chat', { replace: true });
    } else if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [user, navigate]);

  if (!user || user.primaryEmailAddress?.emailAddress !== 'kashishsalvi06@gmail.com') {
    return null;
  }

  const navClass = ({ isActive }) =>
    isActive
      ? "flex items-center gap-sm px-sm py-sm rounded-lg bg-secondary-fixed text-on-secondary-fixed transition-colors duration-200"
      : "flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200";

  const iconClass = ({ isActive }) =>
    isActive ? "material-symbols-outlined icon-filled" : "material-symbols-outlined";

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex selection:bg-primary-container selection:text-on-primary-container">
      {/* Sidebar */}
      <nav className="hidden md:flex w-[260px] h-screen fixed left-0 top-0 border-r border-outline-variant bg-surface flex-col py-lg px-md gap-xs z-50">
        <div className="flex items-center gap-sm mb-lg px-xs">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white shrink-0">
            <g transform="rotate(-30 12 12)">
              <circle cx="7.3" cy="3.2" r="1.45" />
              <rect x="5.5" y="4.7" width="3.6" height="14.6" rx="1.8" />
              <rect x="14.9" y="4.7" width="3.6" height="14.6" rx="1.8" />
              <circle cx="16.7" cy="20.8" r="1.45" />
            </g>
          </svg>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary truncate">SyncSphere</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Admin Portal</p>
          </div>
        </div>

        <div className="flex flex-col gap-unit">
          <NavLink to="/admin" end className={navClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass({ isActive })}>dashboard</span>
                <span className="font-body-md text-body-md">Overview</span>
              </>
            )}
          </NavLink>
          <NavLink to="/admin/workspaces" className={navClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass({ isActive })}>people</span>
                <span className="font-body-md text-body-md">Users</span>
              </>
            )}
          </NavLink>
          <NavLink to="/admin/channels" className={navClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass({ isActive })}>forum</span>
                <span className="font-body-md text-body-md">Exports</span>
              </>
            )}
          </NavLink>
          <NavLink to="/admin/events" className={navClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass({ isActive })}>calendar_today</span>
                <span className="font-body-md text-body-md">Events</span>
              </>
            )}
          </NavLink>
          <NavLink to="/admin/settings" className={navClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass({ isActive })}>settings</span>
                <span className="font-body-md text-body-md">Settings</span>
              </>
            )}
          </NavLink>
        </div>

        <div className="mt-auto pt-lg border-t border-outline-variant/30 flex items-center gap-sm px-xs">
          <img 
            alt="Admin Profile" 
            className="w-8 h-8 rounded-full object-cover shrink-0 border-2 border-surface-bright" 
            src={user?.imageUrl || "https://ui-avatars.com/api/?name=Admin"}
          />
          <div className="overflow-hidden">
            <p className="font-title-sm text-title-sm text-on-surface truncate">{user?.fullName || 'Admin User'}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
      </nav>

      {/* Main Area */}
      <main className="w-full md:w-[calc(100%-260px)] md:ml-[260px] flex flex-col min-h-screen overflow-x-hidden">
        <header className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-16 border-b border-outline-variant bg-surface sticky top-0 z-40">
          <div className="flex items-center gap-md flex-1">
            <div className="relative w-full max-w-md hidden lg:block">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input 
                className="w-full min-w-[300px] bg-surface-container-lowest border border-outline-variant rounded-full py-2 pl-10 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/50" 
                placeholder="Search portal..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-xs md:gap-md">
            <button 
              onClick={() => navigate('/chat')}
              className="px-3 md:px-4 py-2 rounded-full font-label-caps text-label-caps bg-red-600 text-white hover:bg-red-500 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-red-500/50 whitespace-nowrap">
              Exit to Chat
            </button>
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications && unreadCount > 0) markRead();
                }}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors shrink-0 relative">
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-surface"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg z-50 p-2 flex flex-col gap-2">
                  <h3 className="font-title-sm p-2 text-on-surface border-b border-outline-variant/20">Notifications</h3>
                  {notifications.length === 0 ? (
                    <p className="text-center p-4 text-on-surface-variant font-body-sm">No notifications yet.</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n._id} className={`p-3 rounded-lg flex flex-col gap-1 ${n.isRead ? 'opacity-70' : 'bg-surface-container-low'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${n.type === 'error' ? 'bg-red-500' : n.type === 'success' ? 'bg-green-500' : n.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}></span>
                          <span className="font-title-sm text-sm text-on-surface">{n.title}</span>
                        </div>
                        <p className="font-body-sm text-xs text-on-surface-variant pl-4">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Nav */}
        <nav className="md:hidden flex overflow-x-auto no-scrollbar gap-unit px-margin-mobile py-2 bg-surface border-b border-outline-variant/30">
          <NavLink to="/admin" end className={navClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass({ isActive })}>dashboard</span>
                <span className="font-body-md text-body-md">Overview</span>
              </>
            )}
          </NavLink>
          <NavLink to="/admin/workspaces" className={navClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass({ isActive })}>people</span>
                <span className="font-body-md text-body-md">Users</span>
              </>
            )}
          </NavLink>
          <NavLink to="/admin/channels" className={navClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass({ isActive })}>forum</span>
                <span className="font-body-md text-body-md">Exports</span>
              </>
            )}
          </NavLink>
          <NavLink to="/admin/events" className={navClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass({ isActive })}>calendar_today</span>
                <span className="font-body-md text-body-md">Events</span>
              </>
            )}
          </NavLink>
          <NavLink to="/admin/settings" className={navClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass({ isActive })}>settings</span>
                <span className="font-body-md text-body-md">Settings</span>
              </>
            )}
          </NavLink>
        </nav>

        <div className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

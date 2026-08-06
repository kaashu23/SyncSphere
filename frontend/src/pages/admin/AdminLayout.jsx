import { useUser } from '@clerk/clerk-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function AdminLayout() {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.primaryEmailAddress?.emailAddress !== 'kashishsalvi06@gmail.com') {
      navigate('/chat', { replace: true });
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
          <img src="/logo.png" alt="SyncSphere Logo" className="w-10 h-10 object-cover rounded-full border-2 border-primary-fixed shadow-sm" />
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
                <span className={iconClass({ isActive })}>grid_view</span>
                <span className="font-body-md text-body-md">Workspaces</span>
              </>
            )}
          </NavLink>
          <NavLink to="/admin/channels" className={navClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass({ isActive })}>tag</span>
                <span className="font-body-md text-body-md">Channels</span>
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
      <main className="w-full md:ml-[260px] flex flex-col min-h-screen">
        <header className="flex justify-between items-center w-full px-margin-desktop h-16 border-b border-outline-variant bg-surface sticky top-0 z-40">
          <div className="flex items-center gap-md w-1/3">
            <div className="relative w-full max-w-sm">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input 
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-full py-xs pl-xl pr-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/50" 
                placeholder="Search portal..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-md">
            <button 
              onClick={() => navigate('/chat')}
              className="px-4 py-2 rounded-full font-label-caps text-label-caps bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors">
              Exit to Chat
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

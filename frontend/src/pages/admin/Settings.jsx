import { useUser, useClerk } from '@clerk/clerk-react';

export default function Settings() {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="max-w-[720px] mx-auto w-full flex flex-col gap-lg pb-xl p-margin-mobile md:p-margin-desktop">
      {/* Page Title */}
      <div className="mb-sm">
        <h2 className="font-display-lg text-display-lg text-on-background mb-xs">Settings</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Manage your account preferences and application behavior.</p>
      </div>

      {/* Profile Card */}
      <section className="bg-surface-container-lowest rounded-xl p-lg shadow-[0_4px_20px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.02)] border border-outline-variant/30 flex flex-col md:flex-row items-center md:items-start gap-lg relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        
        <div className="relative shrink-0">
          <img 
            alt="Profile Avatar" 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-surface shadow-sm" 
            src={user?.imageUrl || "https://ui-avatars.com/api/?name=Admin"}
          />
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-surface-container-lowest rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container-low transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">edit</span>
          </button>
        </div>

        <div className="flex-1 text-center md:text-left flex flex-col h-full justify-center">
          <div className="flex items-center justify-center md:justify-start gap-sm mb-xs">
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">{user?.fullName || 'Admin User'}</h3>
            <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed font-label-caps text-label-caps rounded-full">Pro</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mb-md">{user?.primaryEmailAddress?.emailAddress}</p>
          
          <div className="flex flex-wrap gap-sm justify-center md:justify-start relative z-10">
            <button className="px-4 py-2 bg-primary text-on-primary font-title-sm text-title-sm rounded-lg hover:bg-primary-container transition-colors cursor-pointer">Edit Profile</button>
            <button className="px-4 py-2 bg-surface text-on-surface font-title-sm text-title-sm rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors cursor-pointer">View Public Profile</button>
          </div>
        </div>
      </section>

      {/* Settings List */}
      <div className="flex flex-col gap-sm">
        <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-xs ml-sm">Account Settings</h3>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          
          <button className="w-full flex items-center justify-between p-lg hover:bg-surface-container-low transition-colors border-b border-outline-variant/30 last:border-b-0 group cursor-pointer text-left">
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary-fixed group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined font-light">person</span>
              </div>
              <div>
                <p className="font-title-sm text-title-sm text-on-surface">Personal Information</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Name, email, phone number</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
          </button>

          <button className="w-full flex items-center justify-between p-lg hover:bg-surface-container-low transition-colors border-b border-outline-variant/30 last:border-b-0 group cursor-pointer text-left">
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary-fixed group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined font-light">lock</span>
              </div>
              <div>
                <p className="font-title-sm text-title-sm text-on-surface">Privacy & Security</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Password, 2FA, connected apps</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
          </button>

        </div>
      </div>

      <div className="flex flex-col gap-sm mt-md">
        <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-xs ml-sm">Preferences</h3>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          
          <button className="w-full flex items-center justify-between p-lg hover:bg-surface-container-low transition-colors border-b border-outline-variant/30 last:border-b-0 group cursor-pointer text-left">
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary-fixed group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined font-light">notifications</span>
              </div>
              <div>
                <p className="font-title-sm text-title-sm text-on-surface">Notifications</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Email, push, desktop sounds</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
          </button>

          <button className="w-full flex items-center justify-between p-lg hover:bg-surface-container-low transition-colors border-b border-outline-variant/30 last:border-b-0 group cursor-pointer text-left">
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary-fixed group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined font-light">palette</span>
              </div>
              <div>
                <p className="font-title-sm text-title-sm text-on-surface">Appearance</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Theme, sidebar colors, layout</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
          </button>

        </div>
      </div>

      <div className="mt-xl flex justify-center">
        <button 
          onClick={() => signOut()}
          className="px-6 py-3 font-title-sm text-title-sm text-error hover:bg-error-container/50 rounded-lg transition-colors flex items-center gap-sm cursor-pointer">
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Sign Out
        </button>
      </div>
    </div>
  );
}

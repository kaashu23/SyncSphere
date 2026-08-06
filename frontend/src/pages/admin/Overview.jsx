export default function Overview() {
  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto w-full flex flex-col gap-lg">
      <div className="flex flex-col gap-xs mb-sm">
        <h2 className="font-display-lg text-display-lg text-on-surface">Dashboard Overview</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Monitor platform activity and moderation queue.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.02)] flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <span className="font-title-sm text-title-sm text-on-surface-variant">Daily Active Users</span>
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary-fixed-dim">
              <span className="material-symbols-outlined text-sm">group</span>
            </div>
          </div>
          <div className="flex items-baseline gap-sm">
            <span className="font-display-lg text-display-lg text-on-surface">14,289</span>
            <span className="font-label-caps text-label-caps text-primary bg-primary-fixed/30 px-2 py-1 rounded-full flex items-center gap-xs">
              <span className="material-symbols-outlined text-[10px]">trending_up</span> 12%
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.02)] flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <span className="font-title-sm text-title-sm text-on-surface-variant">Messages Sent (24h)</span>
            <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-sm">chat</span>
            </div>
          </div>
          <div className="flex items-baseline gap-sm">
            <span className="font-display-lg text-display-lg text-on-surface">1.2M</span>
            <span className="font-label-caps text-label-caps text-secondary bg-secondary-fixed/50 px-2 py-1 rounded-full flex items-center gap-xs">
              <span className="material-symbols-outlined text-[10px]">trending_up</span> 4%
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.02)] flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <span className="font-title-sm text-title-sm text-on-surface-variant">Pending Reports</span>
            <div className="w-8 h-8 rounded-full bg-error-container flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-sm">flag</span>
            </div>
          </div>
          <div className="flex items-baseline gap-sm">
            <span className="font-display-lg text-display-lg text-on-surface">24</span>
            <span className="font-label-caps text-label-caps text-error bg-error-container/50 px-2 py-1 rounded-full flex items-center gap-xs">
              <span className="material-symbols-outlined text-[10px]">priority_high</span> Action Needed
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mt-sm">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-lg border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.02)] flex flex-col">
          <div className="flex items-center justify-between mb-lg">
            <h3 className="font-title-sm text-title-sm text-on-surface">Weekly Message Volume</h3>
            <button className="text-on-surface-variant hover:bg-surface-container-high rounded-full p-unit transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
          
          <div className="flex-1 min-h-[250px] relative border-b border-l border-outline-variant/40 flex items-end pt-lg pr-lg">
            <div className="absolute left-[-30px] top-0 bottom-0 flex flex-col justify-between font-label-caps text-label-caps text-on-surface-variant/70">
              <span>1.5M</span>
              <span>1.0M</span>
              <span>0.5M</span>
              <span>0</span>
            </div>
            
            <div className="absolute inset-0 w-full h-full flex flex-col justify-between ml-2 pointer-events-none">
              <div className="w-full h-px bg-outline-variant/20"></div>
              <div className="w-full h-px bg-outline-variant/20"></div>
              <div className="w-full h-px bg-outline-variant/20"></div>
              <div className="w-full h-px"></div>
            </div>
            
            <div className="w-full h-full flex items-end justify-between px-md relative z-10">
              <div className="w-2 bg-primary/40 h-[40%] rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-on-tertiary-container px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">400k</div>
              </div>
              <div className="w-2 bg-primary/40 h-[65%] rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-on-tertiary-container px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">650k</div>
              </div>
              <div className="w-2 bg-primary/60 h-[50%] rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-on-tertiary-container px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">500k</div>
              </div>
              <div className="w-2 bg-primary/80 h-[90%] rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-on-tertiary-container px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">900k</div>
              </div>
              <div className="w-2 bg-primary/70 h-[75%] rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-on-tertiary-container px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">750k</div>
              </div>
              <div className="w-2 bg-primary h-[85%] rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-on-tertiary-container px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">850k</div>
              </div>
              <div className="w-2 bg-primary-container h-[100%] rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative shadow-[0_0_10px_rgba(111,98,226,0.5)]">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-on-tertiary-container px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">1.2M</div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between px-md mt-sm font-label-caps text-label-caps text-on-surface-variant/70 ml-2">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        <div className="lg:col-span-1 bg-surface-container-lowest rounded-xl p-lg border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.02)] flex flex-col">
          <div className="flex items-center justify-between mb-md">
            <h3 className="font-title-sm text-title-sm text-on-surface">Recent Reports</h3>
            <button className="font-label-caps text-label-caps text-primary hover:underline">VIEW ALL</button>
          </div>
          
          <div className="flex flex-col gap-sm overflow-y-auto pr-unit [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-outline-variant/40 [&::-webkit-scrollbar-thumb]:rounded-full">
            
            <div className="flex items-start justify-between p-sm rounded-lg hover:bg-surface-container-low transition-colors group cursor-pointer border border-transparent hover:border-outline-variant/20">
              <div className="flex gap-sm">
                <div className="w-8 h-8 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm">person_off</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-body-md text-body-md text-on-surface line-clamp-1 group-hover:text-primary transition-colors">Harassment in #general</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Reported by @alex_j</span>
                </div>
              </div>
              <span className="font-label-caps text-label-caps px-2 py-1 rounded-full bg-error-container/50 text-error whitespace-nowrap mt-1">High</span>
            </div>

            <div className="flex items-start justify-between p-sm rounded-lg hover:bg-surface-container-low transition-colors group cursor-pointer border border-transparent hover:border-outline-variant/20">
              <div className="flex gap-sm">
                <div className="w-8 h-8 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm">link_off</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-body-md text-body-md text-on-surface line-clamp-1 group-hover:text-primary transition-colors">Spam Link (DM)</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Reported by @sarah_m</span>
                </div>
              </div>
              <span className="font-label-caps text-label-caps px-2 py-1 rounded-full bg-surface-variant text-on-surface-variant whitespace-nowrap mt-1">Low</span>
            </div>
            
            <div className="flex items-start justify-between p-sm rounded-lg hover:bg-surface-container-low transition-colors group cursor-pointer border border-transparent hover:border-outline-variant/20">
              <div className="flex gap-sm">
                <div className="w-8 h-8 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm">block</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-body-md text-body-md text-on-surface line-clamp-1 group-hover:text-primary transition-colors">Inappropriate Avatar</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Automated Flag</span>
                </div>
              </div>
              <span className="font-label-caps text-label-caps px-2 py-1 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant whitespace-nowrap mt-1">Med</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

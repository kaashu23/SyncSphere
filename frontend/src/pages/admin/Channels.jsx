export default function Channels() {
  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto w-full h-full flex flex-col justify-center items-center gap-md">
      <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-md shadow-ambient">
        <span className="material-symbols-outlined text-[48px] font-light">tag</span>
      </div>
      <h2 className="font-display-lg text-display-lg text-on-surface">Channels Hub</h2>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md text-center">
        Organize your conversations into dedicated topic-based channels. Public and private channels will be managed here.
      </p>
      <button className="mt-lg px-6 py-3 bg-primary text-on-primary rounded-full font-title-sm shadow-sm hover:bg-primary-container transition-colors flex items-center gap-xs cursor-pointer">
        <span className="material-symbols-outlined text-[20px]">add</span>
        Create Channel
      </button>
    </div>
  );
}

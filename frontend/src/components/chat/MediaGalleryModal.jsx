import React, { useState } from 'react';

export default function MediaGalleryModal({ isOpen, onClose, messages }) {
  const [activeTab, setActiveTab] = useState('media'); // 'media' | 'links'

  if (!isOpen) return null;

  const mediaMessages = messages.filter(m => 
    m.type === 'image' || m.type === 'video' || (m.content.startsWith('http') && m.content.includes('ik.imagekit.io') && (m.content.match(/\.(jpeg|jpg|gif|png|mp4|webm)$/) != null || m.content.includes('tr:')))
  );

  const linkMessages = messages.filter(m => 
    m.type === 'text' && /(https?:\/\/[^\s]+)/g.test(m.content)
  );

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl w-full max-w-[600px] shadow-2xl flex flex-col h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/30">
          <h3 className="text-xl font-bold text-on-surface">Media, Links, and Docs</h3>
          <button onClick={onClose} className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex border-b border-outline-variant/30">
          <button onClick={() => setActiveTab('media')} className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === 'media' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
            Media ({mediaMessages.length})
          </button>
          <button onClick={() => setActiveTab('links')} className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === 'links' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
            Links ({linkMessages.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'media' && (
            <div className="grid grid-cols-3 gap-2">
              {mediaMessages.length === 0 ? (
                <p className="col-span-3 text-center text-outline py-8">No media found.</p>
              ) : (
                mediaMessages.map(m => (
                  <div key={m._id} className="aspect-square bg-surface-container rounded-lg overflow-hidden relative group cursor-pointer hover:opacity-90">
                    {m.type === 'video' || m.content.match(/\.(mp4|webm)$/) ? (
                      <video src={m.content} className="w-full h-full object-cover" />
                    ) : (
                      <img src={m.content} className="w-full h-full object-cover" />
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'links' && (
            <div className="flex flex-col gap-3">
              {linkMessages.length === 0 ? (
                <p className="text-center text-outline py-8">No links found.</p>
              ) : (
                linkMessages.map(m => {
                  const url = m.content.match(/(https?:\/\/[^\s]+)/)[0];
                  return (
                    <a key={m._id} href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary transition-colors">
                      <span className="text-primary text-sm font-medium break-all">{url}</span>
                      <span className="text-xs text-on-surface-variant mt-1">Shared by {m.sender?.displayName || 'User'}</span>
                    </a>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

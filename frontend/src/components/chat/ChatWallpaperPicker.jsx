import React, { useState } from 'react';
import { IKUpload } from 'imagekitio-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ChatWallpaperPicker({ chatId, currentUser, onUpdate, onClose }) {
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (res) => {
    setLoading(true);
    try {
      const config = { headers: { 'clerk-id': currentUser.id } };
      const { data } = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/chats/${chatId}/wallpaper`, {
        wallpaperUrl: res.url
      }, config);
      toast.success('Wallpaper updated!');
      if (onUpdate) onUpdate(data);
      if (onClose) onClose();
    } catch (error) {
      toast.error('Failed to update wallpaper');
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err) => {
    console.error(err);
    toast.error('Failed to upload image');
    setLoading(false);
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      const config = { headers: { 'clerk-id': currentUser.id } };
      const { data } = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/chats/${chatId}/wallpaper`, {
        wallpaperUrl: ''
      }, config);
      toast.success('Wallpaper removed!');
      if (onUpdate) onUpdate(data);
      if (onClose) onClose();
    } catch (error) {
      toast.error('Failed to remove wallpaper');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-surface w-full max-w-[400px] rounded-xl shadow-2xl p-6 border border-outline-variant/30 flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
          <h2 className="font-title-sm text-title-sm text-on-surface font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined">wallpaper</span>
            Chat Wallpaper
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="relative w-full h-12 bg-primary text-on-primary rounded-lg font-title-sm flex items-center justify-center hover:bg-primary-container transition-colors cursor-pointer shadow-sm overflow-hidden">
            {loading ? 'Uploading...' : 'Upload New Wallpaper'}
            <div style={{ display: loading ? 'none' : 'block' }}>
              <IKUpload
                fileName={`wallpaper_${chatId}.jpg`}
                folder="/syncsphere/wallpapers"
                onSuccess={handleSuccess}
                onError={handleError}
                onUploadStart={() => setLoading(true)}
                style={{ position: 'absolute', top: 0, left: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', zIndex: 10 }}
                accept="image/*"
              />
            </div>
          </div>
          
          <button 
            onClick={handleRemove} 
            disabled={loading}
            className="w-full py-3 rounded-lg font-title-sm text-error bg-error-container hover:bg-error hover:text-on-error transition-colors shadow-sm disabled:opacity-50"
          >
            Remove / Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}

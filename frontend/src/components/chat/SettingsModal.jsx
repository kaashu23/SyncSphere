import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { IKContext, IKUpload } from 'imagekitio-react';

const authenticator = async () => {
  try {
    const response = await fetch("http://localhost:5001/api/auth/imagekit");
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const data = await response.json();
    return { signature: data.signature, expire: data.expire, token: data.token };
  } catch (error) {
    throw new Error(`Authentication request failed: ${error.message}`);
  }
};

export default function SettingsModal({ isOpen, onClose, onUpdate }) {
  const { user } = useUser();
  const [displayName, setDisplayName] = useState(user?.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.imageUrl || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const config = { headers: { 'clerk-id': user.id } };
      await axios.post('http://localhost:5001/api/users/onboard', {
        clerkId: user.id,
        username: user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0],
        email: user.primaryEmailAddress?.emailAddress,
        displayName,
        avatarUrl
      }, config);
      toast.success('Profile updated successfully!');
      onUpdate && onUpdate();
      onClose();
    } catch (error) {
      toast.error('Error updating profile');
    }
    setLoading(false);
  };

  const onError = err => toast.error('Avatar upload failed');
  const onSuccess = res => { setAvatarUrl(res.url); toast.success('Avatar uploaded!'); };

  return (
    <IKContext 
      publicKey={import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY} 
      urlEndpoint={import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT} 
      authenticator={authenticator}
    >
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="bg-surface w-full max-w-[400px] rounded-xl shadow-2xl p-6 border border-outline-variant/30 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
            <h2 className="font-title-sm text-title-sm text-on-surface font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined">settings</span>
              Settings
            </h2>
            <button onClick={onClose} className="text-on-surface-variant hover:text-error transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex flex-col gap-2 items-center">
            <div className="relative group cursor-pointer w-24 h-24">
              <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover border-4 border-surface shadow-sm" />
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <IKUpload fileName="avatar.jpg" onError={onError} onSuccess={onSuccess} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }} />
                <span className="material-symbols-outlined text-white pointer-events-none">photo_camera</span>
              </div>
            </div>
            <p className="font-label-caps text-label-caps text-on-surface-variant">Click to change avatar</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-label-caps text-on-surface-variant">Display Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button onClick={onClose} className="flex-1 py-2 rounded-lg font-title-sm text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="flex-1 py-2 rounded-lg font-title-sm text-on-primary bg-primary hover:bg-primary-container transition-colors disabled:opacity-50">Save Changes</button>
          </div>
        </div>
      </div>
    </IKContext>
  );
}

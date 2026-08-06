import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

import * as Sentry from '@sentry/react';

const AVATARS = [
  '/avatars/avatar_female_light.jpg',
  '/avatars/avatar_male_dark.jpg',
  '/avatars/avatar_female_medium.jpg',
  '/avatars/avatar_male_light.jpg',
  '/avatars/avatar_female_older.jpg',
  '/avatars/avatar_alt_style.jpg',
];

export default function Onboarding() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatar(data.url);
      setShowPicker(false);
      toast.success('Image uploaded!');
    } catch (err) {
      Sentry.captureException(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      if (!user) return;
      try {
        await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/me`, { headers: { 'clerk-id': user.id } });
        // User exists, redirect immediately
        navigate('/chat');
      } catch (err) {
        // User not found, stay and show form
        setIsChecking(false);
      }
    };
    checkUser();
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/onboard`, {
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        displayName: user.fullName || user.firstName || username,
        username,
        avatarUrl: avatar || user.imageUrl,
      });
      toast.success('Profile updated successfully!');
      navigate('/chat');
    } catch (err) {
      console.error(err);
      Sentry.captureException(err);
      toast.error(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background flex items-center justify-center font-body-md text-on-surface overflow-y-auto py-12">
      <main className="w-full max-w-[480px] min-w-[320px] px-6 md:px-8 flex flex-col items-center">
        <header className="text-center mb-xl w-full">
          <h1 className="font-display-lg text-[32px] md:text-[40px] font-bold text-on-surface mb-sm tracking-tight">SyncSphere</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Set up your profile to continue.</p>
        </header>

        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-6 bg-surface-container-lowest shadow-ambient rounded-xl p-8 md:p-10 border border-outline-variant/30">
          
          <div className="relative group cursor-pointer">
            <label htmlFor="avatar-upload" className="block relative w-32 h-32 rounded-full bg-surface-container flex items-center justify-center overflow-hidden border-2 border-dashed border-outline-variant group-hover:border-primary transition-colors cursor-pointer">
              {avatar ? (
                <img src={avatar} alt="Selected avatar" className="w-full h-full object-cover" />
              ) : user?.imageUrl ? (
                <img src={user.imageUrl} alt="Clerk avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-primary transition-colors" style={{ fontVariationSettings: "'FILL' 0" }}>photo_camera</span>
              )}
            </label>
            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <div className="absolute bottom-0 right-0 bg-primary text-on-primary rounded-full p-2 shadow-sm transform translate-x-1/4 translate-y-1/4 pointer-events-none">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0" }}>add</span>
            </div>
          </div>

          <div className="w-full">
            <label className="sr-only" htmlFor="username">Username</label>
            <div className="relative">
              <input 
                className="w-full bg-transparent border-b border-outline-variant py-sm px-xs font-title-sm text-title-sm text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-outline-variant/70" 
                id="username" 
                name="username" 
                placeholder="Choose a username" 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              {username.length > 2 && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-xs pointer-events-none">
                  <span className="material-symbols-outlined text-primary text-lg" data-icon="check_circle">check_circle</span>
                </div>
              )}
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs pl-xs">This is how others will see you in SyncSphere.</p>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-primary text-on-primary font-title-sm text-title-sm py-sm px-lg rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors duration-200 shadow-sm disabled:opacity-50" 
            type="submit"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </main>
    </div>
  );
}

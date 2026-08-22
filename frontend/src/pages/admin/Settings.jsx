import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowRegistrations: true,
    maxFileSizeMB: 20,
    theme: 'system'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
      const { data } = await axios.get(`${baseUrl}/api/admin/settings`);
      setSettings(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
      const { data } = await axios.put(`${baseUrl}/api/admin/settings`, settings);
      setSettings(data);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-4xl mx-auto w-full flex flex-col gap-lg h-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-xs">
          <h2 className="font-display-lg text-display-lg text-on-surface">Platform Settings</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Manage global application behavior.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary text-on-primary rounded-full font-label-caps hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col gap-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-ambient p-6 md:p-8">
        
        {/* Maintenance Mode */}
        <div className="flex items-center justify-between pb-6 border-b border-outline-variant/20">
          <div className="flex flex-col gap-1 pr-4">
            <h3 className="font-title-md text-on-surface">Maintenance Mode</h3>
            <p className="font-body-sm text-on-surface-variant">Disable user access to the application for upgrades.</p>
          </div>
          <button 
            onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.maintenanceMode ? 'bg-error' : 'bg-surface-container-highest'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Allow Registrations */}
        <div className="flex items-center justify-between pb-6 border-b border-outline-variant/20">
          <div className="flex flex-col gap-1 pr-4">
            <h3 className="font-title-md text-on-surface">Allow New Registrations</h3>
            <p className="font-body-sm text-on-surface-variant">Let new users sign up for the platform.</p>
          </div>
          <button 
            onClick={() => setSettings({...settings, allowRegistrations: !settings.allowRegistrations})}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.allowRegistrations ? 'bg-primary' : 'bg-surface-container-highest'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.allowRegistrations ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Max File Size */}
        <div className="flex flex-col gap-4 pb-6 border-b border-outline-variant/20">
          <div className="flex flex-col gap-1">
            <h3 className="font-title-md text-on-surface">Max Upload Size</h3>
            <p className="font-body-sm text-on-surface-variant">Maximum file size (MB) users can upload.</p>
          </div>
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={settings.maxFileSizeMB} 
              onChange={e => setSettings({...settings, maxFileSizeMB: parseInt(e.target.value)})}
              className="w-full max-w-xs accent-primary" 
            />
            <span className="font-title-md text-primary">{settings.maxFileSizeMB} MB</span>
          </div>
        </div>

        {/* Default Theme */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-title-md text-on-surface">Default Theme</h3>
            <p className="font-body-sm text-on-surface-variant">Set the default theme for new users.</p>
          </div>
          <div className="flex items-center gap-3">
            {['light', 'dark', 'system'].map((theme) => (
              <button 
                key={theme}
                onClick={() => setSettings({...settings, theme})}
                className={`px-4 py-2 rounded-lg font-label-md capitalize border transition-colors ${settings.theme === theme ? 'bg-primary-container text-on-primary-container border-primary/30' : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

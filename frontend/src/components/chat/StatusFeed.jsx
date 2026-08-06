import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useUser } from '@clerk/clerk-react';
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

export default function StatusFeed() {
  const { user } = useUser();
  const [groupedStatuses, setGroupedStatuses] = useState([]);
  const [viewerData, setViewerData] = useState(null); // { user, statuses, currentIndex }
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchStatuses = async () => {
    try {
      const { data } = await axios.get('http://localhost:5001/api/status');
      setGroupedStatuses(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleStatusUploadSuccess = async (res) => {
    setUploading(true);
    try {
      const config = { headers: { 'clerk-id': user.id } };
      await axios.post('http://localhost:5001/api/status', {
        content: res.url,
        mediaType: 'image'
      }, config);
      toast.success('Status uploaded!');
      setIsCreateOpen(false);
      fetchStatuses();
    } catch (error) {
      toast.error('Failed to post status');
    }
    setUploading(false);
  };

  const openViewer = (group) => {
    setViewerData({ user: group.user, statuses: group.statuses, currentIndex: 0 });
  };

  const closeViewer = () => setViewerData(null);

  const nextStatus = () => {
    if (viewerData.currentIndex < viewerData.statuses.length - 1) {
      setViewerData({ ...viewerData, currentIndex: viewerData.currentIndex + 1 });
    } else {
      closeViewer();
    }
  };

  // Auto-advance
  useEffect(() => {
    if (viewerData) {
      const timer = setTimeout(nextStatus, 5000);
      return () => clearTimeout(timer);
    }
  }, [viewerData]);

  return (
    <div className="w-full flex flex-col pt-4 pb-2 px-md border-b border-outline-variant/30">
      <div className="flex gap-4 overflow-x-auto no-scrollbar items-center pb-2">
        {/* Add Status Button */}
        <div className="flex flex-col items-center gap-1 cursor-pointer shrink-0" onClick={() => setIsCreateOpen(true)}>
          <div className="relative w-14 h-14 rounded-full border-2 border-dashed border-outline-variant flex items-center justify-center hover:border-primary transition-colors hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-outline">add</span>
            <img src={user?.imageUrl} className="absolute inset-0 w-full h-full rounded-full object-cover opacity-30" />
          </div>
          <span className="font-body-sm text-[11px] text-on-surface-variant font-medium">Add Status</span>
        </div>

        {/* Status List */}
        {groupedStatuses.map((group, i) => (
          <div key={i} className="flex flex-col items-center gap-1 cursor-pointer shrink-0" onClick={() => openViewer(group)}>
            <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-primary to-primary-fixed">
              <img src={group.user.avatarUrl || '/avatars/avatar_female_light.jpg'} className="w-full h-full rounded-full object-cover border-2 border-surface" />
            </div>
            <span className="font-body-sm text-[11px] text-on-surface-variant font-medium truncate w-14 text-center">
              {group.user.displayName.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {isCreateOpen && (
        <IKContext publicKey={import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY} urlEndpoint={import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT} authenticator={authenticator}>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-surface p-xl rounded-2xl flex flex-col items-center gap-md max-w-sm w-full shadow-2xl relative">
              <button onClick={() => setIsCreateOpen(false)} className="absolute top-sm right-sm text-outline hover:text-error">
                <span className="material-symbols-outlined">close</span>
              </button>
              <h3 className="font-title-md text-on-surface mb-sm font-semibold">Post a Status</h3>
              {uploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              ) : (
                <div className="relative w-full h-48 border-2 border-dashed border-outline rounded-xl flex flex-col items-center justify-center text-outline hover:bg-surface-container-low transition-colors cursor-pointer group">
                  <IKUpload 
                    fileName="status.jpg" 
                    onSuccess={handleStatusUploadSuccess} 
                    onError={() => toast.error('Upload failed')} 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }} 
                  />
                  <span className="material-symbols-outlined text-[32px] group-hover:scale-110 transition-transform text-primary">cloud_upload</span>
                  <span className="font-body-sm mt-2">Click to upload image</span>
                </div>
              )}
            </div>
          </div>
        </IKContext>
      )}

      {/* Viewer Modal */}
      {viewerData && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center backdrop-blur-md">
          {/* Progress Bars */}
          <div className="absolute top-4 w-full max-w-md px-4 flex gap-1 z-10">
            {viewerData.statuses.map((s, i) => (
              <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div className={`h-full bg-white transition-all duration-[5000ms] ease-linear ${i === viewerData.currentIndex ? 'w-full' : (i < viewerData.currentIndex ? 'w-full duration-0' : 'w-0 duration-0')}`}></div>
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 w-full max-w-md px-4 flex justify-between items-center z-10">
            <div className="flex items-center gap-sm">
              <img src={viewerData.user.avatarUrl || '/avatars/avatar_female_light.jpg'} className="w-10 h-10 rounded-full object-cover border border-white/20" />
              <div className="flex flex-col text-white shadow-sm">
                <span className="font-title-sm font-semibold">{viewerData.user.displayName}</span>
                <span className="text-[11px] text-white/70">
                  {new Date(viewerData.statuses[viewerData.currentIndex].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <button onClick={closeViewer} className="text-white/80 hover:text-white bg-black/20 p-2 rounded-full backdrop-blur-md transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Media */}
          <div className="w-full max-w-md aspect-[9/16] relative flex items-center justify-center overflow-hidden rounded-xl bg-surface-container-lowest/5" onClick={nextStatus}>
            <img src={viewerData.statuses[viewerData.currentIndex].content} className="w-full h-full object-contain pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}

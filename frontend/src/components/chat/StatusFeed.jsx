import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

export default function StatusFeed() {
  const { user } = useUser();
  const [groupedStatuses, setGroupedStatuses] = useState([]);
  const [viewerData, setViewerData] = useState(null); // { user, statuses, currentIndex }
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');

  const fetchStatuses = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/status`);
      setGroupedStatuses(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleStatusUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    toast.loading('Uploading status...', { id: 'status-upload' });
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      const { data: uploadData } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const config = { headers: { 'clerk-id': user.id } };
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/status`, {
        content: uploadData.url,
        mediaType: 'image',
        caption: caption
      }, config);
      toast.success('Status uploaded!', { id: 'status-upload' });
      setIsCreateOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
      fetchStatuses();
    } catch (error) {
      toast.error('Failed to post status', { id: 'status-upload' });
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
      {isCreateOpen && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface p-6 rounded-2xl flex flex-col items-center gap-4 min-w-[320px] max-w-[400px] w-full shadow-2xl relative">
            <button onClick={() => { setIsCreateOpen(false); setSelectedFile(null); setPreviewUrl(null); setCaption(''); }} className="absolute top-4 right-4 text-outline hover:text-error transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-title-md text-on-surface mb-2 font-semibold">Post a Status</h3>
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary my-4"></div>
            ) : selectedFile ? (
              <div className="w-full flex flex-col gap-4">
                <div className="relative w-full h-64 bg-surface-container rounded-xl overflow-hidden flex items-center justify-center">
                  <img src={previewUrl} className="w-full h-full object-contain" />
                </div>
                <input 
                  type="text" 
                  placeholder="Add a caption..." 
                  value={caption} 
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleStatusUpload(); }}
                />
                <button onClick={handleStatusUpload} className="w-full bg-primary text-on-primary py-2 rounded-xl font-medium hover:bg-primary-container transition-colors shadow-sm">
                  Post Status
                </button>
              </div>
            ) : (
              <div className="relative w-full h-48 border-2 border-dashed border-outline rounded-xl flex flex-col items-center justify-center text-outline hover:bg-surface-container-low transition-colors cursor-pointer group overflow-hidden">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileSelect} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  title="Upload status image"
                />
                <span className="material-symbols-outlined text-[32px] group-hover:scale-110 transition-transform text-primary">cloud_upload</span>
                <span className="font-body-sm mt-2 font-medium">Click to upload image</span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Viewer Modal */}
      {viewerData && createPortal(
        <div className="fixed inset-0 z-[2000] bg-black/95 flex flex-col items-center justify-center backdrop-blur-md">
          {/* Progress Bars */}
          <div className="absolute top-4 w-full max-w-[400px] px-4 flex gap-1 z-10">
            {viewerData.statuses.map((s, i) => (
              <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div className={`h-full bg-white transition-all duration-[5000ms] ease-linear ${i === viewerData.currentIndex ? 'w-full' : (i < viewerData.currentIndex ? 'w-full duration-0' : 'w-0 duration-0')}`}></div>
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 w-full max-w-[400px] px-4 flex justify-between items-center z-10">
            <div className="flex items-center gap-sm">
              <img src={viewerData.user.avatarUrl || '/avatars/avatar_female_light.jpg'} className="w-10 h-10 rounded-full object-cover border border-white/20" />
              <div className="flex flex-col text-white shadow-sm">
                <span className="font-title-sm font-semibold">{viewerData.user.displayName}</span>
                <span className="text-[11px] text-white/70">
                  {new Date(viewerData.statuses[viewerData.currentIndex].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <button onClick={closeViewer} className="text-white/80 hover:text-white w-8 h-8 flex items-center justify-center rounded-full transition-colors z-20 cursor-pointer">
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          {/* Media */}
          <div className="w-full max-w-[400px] aspect-[9/16] relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-surface-container-lowest/5" onClick={nextStatus}>
            <img src={viewerData.statuses[viewerData.currentIndex].content} className="w-full h-full object-contain pointer-events-none" />
            
            {viewerData.statuses[viewerData.currentIndex].caption && (
              <div className="absolute bottom-10 w-full px-6 flex justify-center z-20 pointer-events-none">
                <div className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-xl text-center shadow-lg font-body-md break-words max-w-full">
                  {viewerData.statuses[viewerData.currentIndex].caption}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

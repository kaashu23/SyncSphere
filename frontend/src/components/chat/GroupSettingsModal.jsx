import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { IKContext, IKUpload } from 'imagekitio-react';
import ConfirmModal from '../common/ConfirmModal';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const authenticator = async () => {
  const response = await fetch(`${API}/api/auth/imagekit`);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const data = await response.json();
  return { signature: data.signature, expire: data.expire, token: data.token };
};

export default function GroupSettingsModal({ isOpen, onClose, chat, onChatUpdated }) {
  const { user } = useUser();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [busy, setBusy] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (isOpen && chat) {
      setName(chat.chatName || '');
      setAvatarUrl(chat.chatAvatar || '');
      setSearch('');
      setSearchResult([]);
    }
  }, [isOpen, chat]);

  if (!isOpen || !chat) return null;

  const config = () => ({ headers: { 'clerk-id': user.id } });

  const adminIds = (chat.admins || []).map((a) => a?.clerkId || a?._id || a);
  const isCreator = chat.groupAdmin?.clerkId === user.id || chat.groupAdmin === user.id;
  const currentUserIsAdmin = isCreator || adminIds.includes(user.id);

  const isMemberAdmin = (m) => {
    if (chat.groupAdmin?.clerkId === m.clerkId) return true;
    return adminIds.some((id) => id === m.clerkId || id === m._id);
  };

  const notMember = (u) => !chat.users.some((m) => m._id === u._id);

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Group name cannot be empty');
    setSaving(true);
    try {
      const { data } = await axios.put(
        `${API}/api/chats/${chat._id}/update`,
        { chatName: name.trim(), chatAvatar: avatarUrl },
        config()
      );
      toast.success('Group settings saved!');
      onChatUpdated?.(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving group settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUploadSuccess = (res) => {
    setAvatarUrl(res.url);
    toast.success('Avatar uploaded!');
    setUploading(false);
  };

  const handleAvatarUploadError = () => {
    toast.error('Avatar upload failed');
    setUploading(false);
  };

  const handleAvatarUploadStart = () => setUploading(true);

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearch(q);
    if (!q.trim()) {
      setSearchResult([]);
      return;
    }
    try {
      const { data } = await axios.get(`${API}/api/users?search=${q}`, config());
      setSearchResult(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAdmin = async (member) => {
    try {
      setBusy(true);
      const { data } = await axios.put(`${API}/api/chats/${chat._id}/admin/${member._id}`, {}, config());
      toast.success(isMemberAdmin(member) ? `${member.displayName} is no longer an admin` : `${member.displayName} is now an admin`);
      onChatUpdated?.(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating admin');
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveMember = async () => {
    const member = memberToRemove;
    if (!member) return;
    try {
      setBusy(true);
      const { data } = await axios.put(`${API}/api/chats/${chat._id}/remove/${member._id}`, {}, config());
      toast.success(`${member.displayName} removed from group`);
      if (data.message) toast.success(data.message);
      onChatUpdated?.(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error removing member');
    } finally {
      setBusy(false);
      setMemberToRemove(null);
    }
  };

  const handleAddMember = async (u) => {
    try {
      setBusy(true);
      const { data } = await axios.put(`${API}/api/chats/${chat._id}/add`, { userId: u._id }, config());
      toast.success(`${u.displayName} added to group`);
      setSearch('');
      setSearchResult([]);
      onChatUpdated?.(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding member');
    } finally {
      setBusy(false);
    }
  };

  const handleGenerateInvite = async () => {
    try {
      setBusy(true);
      const { data } = await axios.get(`${API}/api/chats/${chat._id}/invite`, config());
      const link = `${window.location.origin}/join/${data.inviteCode}`;
      setInviteLink(link);
      navigator.clipboard.writeText(link);
      toast.success('Invite link generated and copied!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error generating invite link');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <IKContext publicKey={import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || 'public_dummy'} urlEndpoint={import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/dummy'} authenticator={authenticator}>
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-[420px] max-h-[85vh] rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-md py-sm border-b border-outline-variant/30 shrink-0">
              <h3 className="font-title-sm text-title-sm text-on-surface font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">settings</span>
                Group Settings
              </h3>
              <button onClick={onClose} className="p-1 rounded-full text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-md">
              <div className="flex flex-col items-center gap-1 py-sm">
                <div className="relative group cursor-pointer w-20 h-20 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container">
                  <img src={avatarUrl || '/logo.png'} alt="Group avatar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <IKUpload
                      fileName="group-avatar.jpg"
                      onError={handleAvatarUploadError}
                      onSuccess={handleAvatarUploadSuccess}
                      onUploadStart={handleAvatarUploadStart}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                    />
                    <span className="material-symbols-outlined text-white pointer-events-none">photo_camera</span>
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <p className="font-label-caps text-label-caps text-on-surface-variant">Click to change group picture</p>
              </div>

              <div className="flex flex-col gap-1 mt-sm">
                <label className="font-label-caps text-label-caps text-on-surface-variant">Group Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                />
              </div>

              <div className="flex gap-3 mt-md mb-md">
                <button onClick={onClose} className="flex-1 py-2 rounded-lg font-title-sm text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || uploading} className="flex-1 py-2 rounded-lg font-title-sm text-on-primary bg-primary hover:bg-primary-container transition-colors disabled:opacity-50">Save Changes</button>
              </div>

              {currentUserIsAdmin && (
                <div className="border-t border-outline-variant/30 pt-md pb-md flex flex-col gap-2">
                  <h4 className="font-title-sm text-on-surface font-semibold">Invite Link</h4>
                  <p className="text-xs text-on-surface-variant">Share this link with others to let them join the group.</p>
                  {inviteLink ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input type="text" readOnly value={inviteLink} className="flex-1 bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-1.5 text-sm font-mono text-on-surface outline-none" />
                      <button onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success('Copied!'); }} className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      </button>
                    </div>
                  ) : (
                    <button onClick={handleGenerateInvite} disabled={busy} className="mt-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-colors font-body-sm text-on-surface disabled:opacity-50 border border-outline-variant/30">
                      <span className="material-symbols-outlined text-[18px]">link</span> Generate Invite Link
                    </button>
                  )}
                </div>
              )}

              <div className="border-t border-outline-variant/30 pt-md">
                <div className="relative mb-1">
                  <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant/70 text-[20px]">search</span>
                  <input
                    type="text"
                    value={search}
                    onChange={handleSearch}
                    placeholder="Add members..."
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-full py-2 pl-xl pr-sm font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                  />
                </div>
                {searchResult.filter(notMember).map((u) => (
                  <div key={u._id} className="flex items-center gap-sm p-2 rounded-xl hover:bg-surface-container-low transition-colors">
                    <img src={u.avatarUrl || '/avatars/avatar_female_light.jpg'} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-body-md text-on-surface font-medium truncate">{u.displayName}</p>
                      <p className="font-body-sm text-on-surface-variant truncate">{u.username ? `@${u.username}` : u.email}</p>
                    </div>
                    <button
                      onClick={() => handleAddMember(u)}
                      disabled={busy}
                      className="bg-primary text-on-primary font-label-md px-3 py-1.5 rounded-lg hover:bg-primary-container transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">person_add</span> Add
                    </button>
                  </div>
                ))}

                <div className="flex flex-col gap-1 mt-sm">
                  {chat.users.map((member) => {
                    const isSelf = member.clerkId === user.id;
                    const isCreatorMember = chat.groupAdmin?.clerkId === member.clerkId;
                    const isAdminMember = isMemberAdmin(member);
                    const showControls = currentUserIsAdmin && !isSelf && !isCreatorMember;

                    return (
                      <div key={member._id} className="flex items-center gap-sm p-sm rounded-xl hover:bg-surface-container-low transition-colors">
                        <img src={member.avatarUrl || '/avatars/avatar_female_light.jpg'} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-body-md text-on-surface font-medium truncate flex items-center gap-1">
                            {member.displayName || member.username || 'User'}
                            {isSelf && <span className="font-body-sm text-on-surface-variant">(You)</span>}
                          </p>
                          <div className="flex gap-1 mt-0.5">
                            {isCreatorMember && (
                              <span className="flex items-center gap-0.5 font-label-caps text-label-caps text-primary bg-primary-fixed/40 px-1.5 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-[12px]">star</span> Creator
                              </span>
                            )}
                            {isAdminMember && !isCreatorMember && (
                              <span className="flex items-center gap-0.5 font-label-caps text-label-caps text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-[12px]">admin_panel_settings</span> Admin
                              </span>
                            )}
                          </div>
                        </div>

                        {showControls && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleToggleAdmin(member)}
                              disabled={busy}
                              title={isAdminMember ? 'Remove as admin' : 'Make admin'}
                              className={`p-2 rounded-full transition-colors flex items-center justify-center disabled:opacity-50 ${
                                isAdminMember
                                  ? 'text-error hover:bg-error-container/20'
                                  : 'text-on-surface-variant hover:text-primary hover:bg-primary/10'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[18px]" style={isAdminMember ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                {isAdminMember ? 'admin_panel_settings' : 'shield'}
                              </span>
                            </button>
                            <button
                              onClick={() => setMemberToRemove(member)}
                              disabled={busy}
                              title="Remove from group"
                              className="p-2 rounded-full text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors flex items-center justify-center disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[18px]">person_remove</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </IKContext>

      <ConfirmModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.displayName || 'this member'} from ${chat.chatName}?`}
        confirmText="Remove"
      />
    </>
  );
}

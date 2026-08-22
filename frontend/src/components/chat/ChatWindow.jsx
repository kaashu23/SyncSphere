import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import socket from '../../sockets/socket';
import toast from 'react-hot-toast';
import VideoCallModal from './VideoCallModal';
import GroupInfoModal from './GroupInfoModal';
import GroupSettingsModal from './GroupSettingsModal';
import EmojiPicker from 'emoji-picker-react';
import { IKContext, IKUpload } from 'imagekitio-react';
import ConfirmModal from '../common/ConfirmModal';
import ChatWallpaperPicker from './ChatWallpaperPicker';
import { motion, AnimatePresence } from 'framer-motion';

const authenticator = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/imagekit`);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const data = await response.json();
    return { signature: data.signature, expire: data.expire, token: data.token };
  } catch (error) {
    throw new Error(`Authentication request failed: ${error.message}`);
  }
};

export default function ChatWindow({ selectedChat, user, onBack, onMessageSent, onFriendRemoved, onChatUpdate, onStartCall }) {
  const theme = useSelector((state) => state.theme.theme);
  const presences = useSelector((state) => state.presence.presences);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Call States
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [isWallpaperPickerOpen, setIsWallpaperPickerOpen] = useState(false);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  
  // Audio Recording States
  const [audioState, setAudioState] = useState('idle'); // 'idle', 'recording', 'preview'
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  
  const messagesEndRef = useRef(null);
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (user) {
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit('join', { userId: user?.id });
      socket.on('connected', () => setSocketConnected(true));
      socket.on('message:new', (newMessageRecieved) => {
        if (!selectedChat || selectedChat._id !== newMessageRecieved.chat._id) {
          // Could notify here
        } else {
          setMessages((messages) => [...messages, newMessageRecieved]);
          // Mark as read immediately when active
          const config = { headers: { 'clerk-id': user?.id } };
          axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/messages/read`, { chatId: selectedChat._id }, config).then(() => {
            socket.emit('message:seen', { chatId: selectedChat._id, users: selectedChat.users, userId: user?.id });
          });
        }
      });

      socket.on('message:seen', ({ chatId }) => {
        if (selectedChat && selectedChat._id === chatId) {
          setMessages(prev => prev.map(m => ({ ...m, seenBy: [{ user: 'dummy' }] })));
        }
      });

      socket.on('message:deleted', ({ messageId }) => {
        setMessages(prev => prev.filter(m => m._id !== messageId));
      });

      socket.on('message:reaction', (updatedMessage) => {
        setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
      });

      socket.on('message:updated', (updatedMessage) => {
        setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
      });

      socket.on('message:star', (updatedMessage) => {
        setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
      });

      socket.on('typing:start', ({ chatId, userId }) => {
        if (selectedChat && selectedChat._id === chatId) {
          setTypingUsers(prev => Array.from(new Set([...prev, userId])));
        }
      });

      socket.on('typing:stop', ({ chatId, userId }) => {
        if (selectedChat && selectedChat._id === chatId) {
          setTypingUsers(prev => prev.filter(id => id !== userId));
        }
      });
    }
    return () => {
      socket.off('connected');
      socket.off('message:new');
      socket.off('message:seen');
      socket.off('message:deleted');
      socket.off('message:reaction');
      socket.off('message:updated');
      socket.off('message:star');
      socket.off('typing:start');
      socket.off('typing:stop');
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user, selectedChat]);

  const [activeReactionMessageId, setActiveReactionMessageId] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [chatsList, setChatsList] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const [initialLoading, setInitialLoading] = useState(false);

  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      setInitialLoading(true);
      const config = { headers: { 'clerk-id': user?.id } };
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/messages/${selectedChat._id}`, config);
      setMessages(Array.isArray(data) ? data : []);
      socket.emit('join chat', selectedChat._id);
      
      // Mark as read
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/messages/read`, { chatId: selectedChat._id }, config);
      socket.emit('message:seen', { chatId: selectedChat._id, users: selectedChat.users, userId: user?.id });
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setInitialLoading(false);
      setTimeout(() => scrollToBottom('auto'), 100);
    }
  };

  const myUserId = selectedChat?.users?.find(u => u.clerkId === user?.id)?._id;
  const myWallpaperObj = selectedChat?.wallpaperBy?.find(w => w.user === myUserId || w.user?._id === myUserId);
  const wallpaperUrl = myWallpaperObj?.wallpaperUrl || '';

  useEffect(() => {
    fetchMessages();
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

  const sendMessage = async () => {
    if (newMessage.trim()) {
      try {
        const config = { headers: { 'clerk-id': user?.id } };
        const tempMessage = newMessage;
        setNewMessage('');
        setShowEmojiPicker(false);
        socket.emit('typing:stop', { chatId: selectedChat._id, userId: user?.id, users: selectedChat.users });
        
        if (editingMessage) {
          const { data } = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/messages/${editingMessage._id}`, { content: tempMessage }, config);
          socket.emit('message:edit', { message: data, users: selectedChat.users });
          setMessages(prev => prev.map(m => m._id === data._id ? data : m));
          setEditingMessage(null);
        } else {
          const payload = {
            content: tempMessage,
            chatId: selectedChat._id,
          };
          if (replyingToMessage) {
            payload.replyTo = replyingToMessage._id;
          }
          const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/messages`, payload, config);
          socket.emit('message:send', { message: data });
          setMessages(prev => [...prev, data]);
          onMessageSent?.(data);
          setReplyingToMessage(null);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    // Typing indicator logic
    socket.emit('typing:start', { chatId: selectedChat._id, userId: user?.id, users: selectedChat.users });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { chatId: selectedChat._id, userId: user?.id, users: selectedChat.users });
    }, 2000);
  };

  const handleAttachFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = null; // reset input
    
    const formData = new FormData();
    formData.append('image', file, file.name);
    
    try {
      toast.loading('Uploading file...', { id: 'upload' });
      const { data: uploadData } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const config = { headers: { 'clerk-id': user?.id } };
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/messages`, {
        content: uploadData.url,
        chatId: selectedChat._id,
      }, config);
      
      socket.emit('message:send', { message: data });
      setMessages(prev => [...prev, data]);
      onMessageSent?.(data);
      toast.success('File sent', { id: 'upload' });
    } catch (error) {
      console.error(error);
      toast.error('File upload failed', { id: 'upload' });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioState('preview');
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setAudioState('recording');
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      toast.error('Microphone access denied or unavailable');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const cancelAudio = () => {
    setAudioBlob(null);
    setAudioState('idle');
    setRecordingTime(0);
  };

  const sendAudio = async () => {
    if (!audioBlob) return;
    setAudioState('idle'); // optimistic UI reset
    const formData = new FormData();
    formData.append('image', audioBlob, 'audio_message.webm');
    
    try {
      const { data: uploadData } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const config = { headers: { 'clerk-id': user?.id } };
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/messages`, {
        content: uploadData.url,
        chatId: selectedChat._id,
      }, config);
      socket.emit('message:send', { message: data });
      setMessages(prev => [...prev, data]);
      onMessageSent?.(data);
    } catch (error) {
      console.error(error);
      toast.error('Error sending audio message');
    }
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const isArchivedForMe = selectedChat?.archivedBy?.some(u => u.clerkId === user?.id);

  const groupAdminIds = (selectedChat?.admins || []).map(a => a?.clerkId || a?._id || a);
  const isGroupCreator = selectedChat?.groupAdmin?.clerkId === user?.id || selectedChat?.groupAdmin === user?.id;
  const isCurrentUserGroupAdmin = isGroupCreator || groupAdminIds.includes(user?.id);

  const handleArchiveChat = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/chats/${selectedChat._id}/archive`, {}, { headers: { 'clerk-id': user?.id } });
      toast.success(isArchivedForMe ? 'Chat unarchived' : 'Chat archived');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) { toast.error('Error archiving chat'); }
  };

  const handleOpenInfo = () => {
    if (selectedChat.isGroupChat) {
      setIsGroupInfoOpen(true);
    }
  };

  const handleOpenGroupSettings = () => {
    setIsGroupSettingsOpen(true);
  };

  const handleMuteChat = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/chats/${selectedChat._id}/mute`, {}, { headers: { 'clerk-id': user?.id } });
      toast.success('Chat notifications muted');
    } catch (err) { toast.error('Error muting chat'); }
  };

  const handleDeleteChat = () => {
    setShowDeleteConfirm(true);
  };

  const handleRemoveFriend = async () => {
    const otherUser = selectedChat.users.find(u => u.clerkId !== user?.id);
    if (!otherUser) return;
    try {
      const config = { headers: { 'clerk-id': user?.id } };
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/remove/${otherUser._id}`, {}, config);
      toast.success('Friend removed');
      onFriendRemoved?.(otherUser._id);
      onBack();
    } catch (err) { toast.error('Error removing friend'); }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const config = { headers: { 'clerk-id': user?.id } };
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/messages/${messageId}`, config);
      setMessages(prev => prev.filter(m => m._id !== messageId));
      socket.emit('message:delete', { messageId, chatId: selectedChat._id, users: selectedChat.users, senderId: user?.id });
      toast.success('Message deleted');
    } catch (err) {
      toast.error('Error deleting message');
    }
  };

  const handleReactToMessage = async (messageId, emoji) => {
    try {
      setActiveReactionMessageId(null); // close picker immediately
      const config = { headers: { 'clerk-id': user?.id } };
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/messages/${messageId}/react`, { emoji }, config);
      setMessages(prev => prev.map(m => m._id === data._id ? data : m));
      socket.emit('message:react', { message: data, users: selectedChat.users });
    } catch (error) {
      console.error(error);
      toast.error('Failed to add reaction');
    }
  };

  const handleStarMessage = async (messageId) => {
    try {
      const config = { headers: { 'clerk-id': user?.id } };
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/messages/${messageId}/star`, {}, config);
      setMessages(prev => prev.map(m => m._id === data._id ? data : m));
      socket.emit('message:star', { message: data, users: selectedChat.users });
    } catch (error) {
      console.error(error);
      toast.error('Failed to star message');
    }
  };

  const handleForwardMessage = async (chatId) => {
    if (!forwardingMessage) return;
    try {
      const config = { headers: { 'clerk-id': user?.id } };
      const payload = {
        content: forwardingMessage.content,
        chatId: chatId,
        type: forwardingMessage.type,
        forwardedFrom: forwardingMessage._id
      };
      
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/messages`, payload, config);
      socket.emit('message:send', { message: data });
      
      if (chatId === selectedChat._id) {
        setMessages(prev => [...prev, data]);
        onMessageSent?.(data);
      }
      
      toast.success('Message forwarded');
      setForwardingMessage(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to forward message');
    }
  };

  const openForwardModal = async (message) => {
    setForwardingMessage(message);
    try {
      const config = { headers: { 'clerk-id': user?.id } };
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/chats`, config);
      setChatsList(data);
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDeleteChat = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/chats/${selectedChat._id}`, { headers: { 'clerk-id': user?.id } });
      toast.success('Chat deleted');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) { toast.error('Error deleting chat'); }
    setShowDeleteConfirm(false);
  };

  const startCall = (isVideo) => {
    if (selectedChat.isGroupChat) return;
    const targetUser = selectedChat?.users?.find(u => u.clerkId !== user?.id);
    if (onStartCall) onStartCall(isVideo, targetUser);
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prevInput => prevInput + emojiObject.emoji);
  };

  if (!selectedChat) {
    return (
      <section className="flex-1 h-full bg-surface-bright flex flex-col items-center justify-center relative">
        <div className="flex flex-col items-center text-center w-full max-w-[400px] px-4 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6 shadow-sm border border-outline-variant/30">
            <span className="material-symbols-outlined text-[48px] text-primary">chat_bubble</span>
          </div>
          <h2 className="font-title-lg text-title-lg text-on-surface mb-2 font-semibold tracking-tight">Your Workspace</h2>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Select a chat from the menu to start messaging, or create a new conversation to connect with your team.
          </p>
          <button className="mt-lg bg-primary hover:bg-primary-container text-on-primary font-body-sm text-body-sm px-6 py-2.5 rounded-full transition-colors shadow-ambient flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Message
          </button>
        </div>
      </section>
    );
  }

  return (
    <IKContext publicKey={import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || 'public_dummy'} urlEndpoint={import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/dummy'} authenticator={authenticator}>
      <div className="flex-1 flex flex-col h-full relative bg-background w-full max-w-full">
        {/* TopAppBar */}
        <header className="hidden md:flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop top-0 h-16 border-b border-outline-variant bg-surface shrink-0 z-10">
          <div className="flex items-center gap-2 md:gap-lg flex-1 min-w-0">
            <span className="font-headline-md text-headline-md font-bold text-primary truncate md:overflow-visible">SyncSphere</span>
            <div className="relative w-full max-w-[240px] hidden md:block">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
              <input className="w-full bg-surface-container-low border-none rounded-full py-xs pl-xl pr-sm font-body-sm text-body-sm focus:ring-1 focus:ring-primary focus:bg-surface transition-all placeholder:text-outline-variant text-on-surface" placeholder="Search..." type="text"/>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-sm text-on-surface-variant shrink-0">
            <div className="w-px h-6 bg-outline-variant/50 mx-1 md:mx-xs"></div>
            <img alt="User" className="w-8 h-8 rounded-full object-cover cursor-pointer active:opacity-70 ring-2 ring-transparent hover:ring-primary-fixed transition-all shrink-0" src={user?.imageUrl || '/avatars/avatar_female_light.jpg'} />
          </div>
        </header>

        {/* Active Chat Sub-Header */}
        <div className="flex items-center justify-between px-4 md:px-margin-desktop py-sm bg-surface-bright/80 backdrop-blur-md border-b border-outline-variant/30 shrink-0 z-40 shadow-sm relative">
          <div className="flex items-center gap-2 md:gap-md">
            <div className="relative">
              <img alt="Chat Contact" className="w-12 h-12 rounded-full object-cover ring-2 ring-surface" src={selectedChat.isGroupChat ? (selectedChat.chatAvatar || '/logo.png') : selectedChat.users.find(u => u.clerkId !== user?.id)?.avatarUrl || '/avatars/avatar_female_light.jpg'} />
              {!selectedChat.isGroupChat && presences[selectedChat.users.find(u => u.clerkId !== user?.id)?.clerkId]?.status === 'online' && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface rounded-full"></span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={onBack}
                  className="md:hidden p-1 -ml-2 mr-1 text-on-surface hover:bg-surface-container-low rounded-lg transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="font-title-sm text-title-sm text-on-surface font-semibold flex items-center gap-1">
                  {selectedChat.isGroupChat ? selectedChat.chatName : selectedChat.users.find(u => u.clerkId !== user?.id)?.displayName || 'User'}
                </h2>
              </div>
              
              {selectedChat.isGroupChat ? (
                <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs ml-[36px] md:ml-0">
                  {selectedChat?.users?.length || 0} members
                </p>
              ) : (
                <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs ml-[36px] md:ml-0">
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${presences[selectedChat.users.find(u => u.clerkId !== user?.id)?.clerkId]?.status === 'online' ? 'bg-green-500' : 'bg-outline-variant'}`}></span>
                  {presences[selectedChat.users.find(u => u.clerkId !== user?.id)?.clerkId]?.status === 'online' 
                    ? 'Active now' 
                    : presences[selectedChat.users.find(u => u.clerkId !== user?.id)?.clerkId]?.lastSeenAt 
                      ? `Last seen ${new Date(presences[selectedChat.users.find(u => u.clerkId !== user?.id)?.clerkId]?.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                      : 'Offline'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!selectedChat.isGroupChat && (
              <div className="flex items-center">
                <button onClick={() => startCall(false)} className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer rounded-full hover:bg-surface-container-low">
                  <span className="material-symbols-outlined text-[20px]">call</span>
                </button>
                <button onClick={() => startCall(true)} className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer rounded-full hover:bg-surface-container-low">
                  <span className="material-symbols-outlined text-[20px]">videocam</span>
                </button>
              </div>
            )}
            <button onClick={handleOpenInfo} className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer rounded-full hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-[20px]">info</span>
            </button>
            <div className="relative">
              <button
                id="chatMenuButton"
                onClick={() => setChatMenuOpen((open) => !open)}
                className="w-9 h-9 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low flex items-center justify-center focus:outline-none"
              >
                <span className="material-symbols-outlined">more_vert</span>
              </button>
              {chatMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setChatMenuOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-outline-variant/30 rounded-xl shadow-2xl overflow-hidden z-50">
                  <button onClick={() => { handleArchiveChat(); setChatMenuOpen(false); }} className="w-full flex items-center gap-2 text-left px-md py-sm font-body-sm hover:bg-surface-container-low transition-colors text-on-surface">
                    <span className="material-symbols-outlined text-[18px]">{isArchivedForMe ? 'unarchive' : 'archive'}</span> {isArchivedForMe ? 'Unarchive Chat' : 'Archive Chat'}
                  </button>
                  <button onClick={() => { handleMuteChat(); setChatMenuOpen(false); }} className="w-full flex items-center gap-2 text-left px-md py-sm font-body-sm hover:bg-surface-container-low transition-colors text-on-surface">
                    <span className="material-symbols-outlined text-[18px]">volume_off</span> Mute Notifications
                  </button>
                  <button onClick={() => { setIsWallpaperPickerOpen(true); setChatMenuOpen(false); }} className="w-full flex items-center gap-2 text-left px-md py-sm font-body-sm hover:bg-surface-container-low transition-colors text-on-surface">
                    <span className="material-symbols-outlined text-[18px]">wallpaper</span> Change Wallpaper
                  </button>
                  {selectedChat.isGroupChat && isCurrentUserGroupAdmin && (
                    <button onClick={() => { handleOpenGroupSettings(); setChatMenuOpen(false); }} className="w-full flex items-center gap-2 text-left px-md py-sm font-body-sm hover:bg-surface-container-low transition-colors text-on-surface">
                      <span className="material-symbols-outlined text-[18px]">settings</span> Group Settings
                    </button>
                  )}
                  {!selectedChat.isGroupChat && (
                    <>
                      <div className="h-px w-full bg-outline-variant/30 my-1"></div>
                      <button onClick={() => { handleRemoveFriend(); setChatMenuOpen(false); }} className="w-full flex items-center gap-2 text-left px-md py-sm font-body-sm hover:bg-error-container hover:text-on-error-container transition-colors text-error">
                        <span className="material-symbols-outlined text-[18px]">person_remove</span> Remove Friend
                      </button>
                    </>
                  )}
                  <div className="h-px w-full bg-outline-variant/30 my-1"></div>
                  <button onClick={() => { handleDeleteChat(); setChatMenuOpen(false); }} className="w-full flex items-center gap-2 text-left px-md py-sm font-body-sm hover:bg-error-container hover:text-on-error-container transition-colors text-error">
                    <span className="material-symbols-outlined text-[18px]">delete</span> Delete Chat
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        </div>

        {/* Chat Canvas */}
        <main 
          className={`flex-1 overflow-y-auto flex flex-col items-center relative ${wallpaperUrl ? 'bg-cover bg-center' : 'bg-background'}`}
          style={wallpaperUrl ? { backgroundImage: `url(${wallpaperUrl})` } : {}}
        >
          {wallpaperUrl && <div className="absolute inset-0 bg-black/40 z-0"></div>}
          <div className="w-full max-w-[900px] flex-1 px-4 md:px-margin-desktop py-lg flex flex-col gap-sm justify-end pb-xl z-10 relative">
            <div className="flex items-center justify-center gap-md my-sm">
              <div className="h-px bg-outline-variant/30 flex-1"></div>
              <span className="font-label-caps text-label-caps text-outline px-sm py-xs bg-surface-container-lowest rounded-full border border-outline-variant/20 shadow-ambient">TODAY</span>
              <div className="h-px bg-outline-variant/30 flex-1"></div>
            </div>
            
            <AnimatePresence>
              {initialLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <motion.div key={`skel-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`flex mb-lg ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    {i % 2 !== 0 && <div className="w-8 h-8 rounded-full bg-surface-variant animate-pulse mr-sm shrink-0"></div>}
                    <div className={`h-16 w-48 bg-surface-variant animate-pulse rounded-2xl ${i % 2 === 0 ? 'rounded-br-sm' : 'rounded-bl-sm'}`}></div>
                  </motion.div>
                ))
              ) : messages.map((m, i) => {
               const isMine = m.sender._id === user?.id || m.sender.clerkId === user?.id;
               const isImage = m.type === 'image' || (m.content.startsWith('http') && m.content.includes('ik.imagekit.io') && (m.content.match(/\.(jpeg|jpg|gif|png)$/) != null || m.content.includes('tr:')));
               const isAudio = m.type === 'audio' || (m.content.startsWith('http') && m.content.includes('ik.imagekit.io') && m.content.match(/\.(webm|mp3|wav|ogg)$/) != null);
               const isFile = !isImage && !isAudio && m.content.startsWith('http') && m.content.includes('ik.imagekit.io');
               
               // Count reactions
               const reactionCounts = {};
               const userReactions = {};
               if (m.reactions && Array.isArray(m.reactions)) {
                 m.reactions.forEach(r => {
                   reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
                   if (r.user === user?.id || r.user?._id === user?.id) {
                     userReactions[r.emoji] = true;
                   }
                 });
               }

               return (
                  <motion.div 
                    key={m._id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    layout
                    className={`flex items-end gap-2 md:gap-sm group max-w-[95%] md:max-w-[85%] ${isMine ? 'self-end flex-row-reverse' : 'self-start'}`}
                  >
                   {!isMine && (
                     <img src={m.sender?.avatarUrl || '/avatars/avatar_female_light.jpg'} className="w-8 h-8 rounded-full object-cover shrink-0 mb-1" />
                   )}
                   <div className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'} relative`}>
                     
                     {/* Hover Actions */}
                     <div className={`absolute top-0 ${isMine ? 'right-full mr-2' : 'left-full ml-2'} flex items-center opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-surface/80 backdrop-blur-md rounded-full shadow-sm border border-outline-variant/30 p-0.5`}>
                       <button onClick={() => handleStarMessage(m._id)} className={`p-1.5 rounded-full hover:bg-surface-container-high transition-colors flex ${m.starredBy?.includes(user?.id) ? 'text-yellow-500' : 'text-on-surface-variant hover:text-primary'}`} title="Star message">
                         <span className="material-symbols-outlined text-[16px]" style={m.starredBy?.includes(user?.id) ? {fontVariationSettings: "'FILL' 1"} : {}}>star</span>
                       </button>
                       <button onClick={() => setActiveReactionMessageId(m._id)} className="p-1.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors flex" title="Add reaction">
                         <span className="material-symbols-outlined text-[16px]">add_reaction</span>
                       </button>
                       <button onClick={() => { setReplyingToMessage(m); setEditingMessage(null); }} className="p-1.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors flex" title="Reply">
                         <span className="material-symbols-outlined text-[16px]">reply</span>
                       </button>
                       <button onClick={() => openForwardModal(m)} className="p-1.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors flex" title="Forward">
                         <span className="material-symbols-outlined text-[16px]">forward</span>
                       </button>
                       {isMine && m.type === 'text' && (
                         <button onClick={() => { setEditingMessage(m); setReplyingToMessage(null); setNewMessage(m.content); }} className="p-1.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors flex" title="Edit message">
                           <span className="material-symbols-outlined text-[16px]">edit</span>
                         </button>
                       )}
                       {isMine && (
                         <button onClick={() => handleDeleteMessage(m._id)} className="p-1.5 rounded-full text-error hover:bg-error-container/20 transition-colors flex" title="Delete message">
                           <span className="material-symbols-outlined text-[16px]">delete</span>
                         </button>
                       )}
                     </div>

                     {/* Emoji Picker Overlay */}
                     {activeReactionMessageId === m._id && (
                       <div className={`absolute top-10 ${isMine ? 'right-full mr-2' : 'left-full ml-2'} z-[100] shadow-2xl`}>
                         <div className="fixed inset-0 z-[-1]" onClick={() => setActiveReactionMessageId(null)}></div>
                         <EmojiPicker emojiStyle="native" onEmojiClick={(emojiData) => handleReactToMessage(m._id, emojiData.emoji)} theme={theme} width={300} height={400} />
                       </div>
                     )}

                     {/* Message Bubble */}
                     <div className={`${isMine ? 'bg-primary-container text-on-primary-container rounded-br-sm' : 'bg-surface border border-outline-variant/50 text-on-surface rounded-bl-sm'} rounded-2xl p-sm font-body-md text-body-md shadow-ambient max-w-full flex flex-col relative`}>
                       
                       {/* Forward Tag */}
                       {m.forwardedFrom && (
                         <div className="flex items-center gap-1 text-[10px] font-medium opacity-70 italic mb-1">
                           <span className="material-symbols-outlined text-[12px]">forward</span>
                           Forwarded
                         </div>
                       )}

                       {/* Reply Quote Block */}
                       {m.replyTo && (
                         <div className={`mb-2 px-2 py-1 border-l-2 rounded-r-md ${isMine ? 'bg-primary/20 border-primary text-on-primary-container/80' : 'bg-surface-container border-primary text-on-surface-variant'}`}>
                           <p className="text-[10px] font-bold mb-0.5">{m.replyTo.sender?.displayName || 'Someone'}</p>
                           <p className="text-xs truncate max-w-[200px]">{m.replyTo.content.startsWith('http') && m.replyTo.content.includes('ik.imagekit.io') ? 'Media' : m.replyTo.content}</p>
                         </div>
                       )}

                       {isImage ? (
                         <img src={m.content} className="max-w-[240px] rounded-lg mb-1 object-cover" />
                       ) : isAudio ? (
                         <audio src={m.content} controls className="max-w-[240px] h-[40px] rounded-lg mb-1" />
                       ) : isFile ? (
                         <a href={m.content} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors mb-1 max-w-[240px] truncate">
                           <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                           <span className="truncate text-on-surface text-sm underline decoration-primary/30 underline-offset-2">Attachment</span>
                         </a>
                       ) : (
                         <div className="flex flex-col gap-1">
                           <p className="px-xs whitespace-pre-wrap">{m.content}</p>
                           {m.linkPreview && (
                             <a href={m.linkPreview.url} target="_blank" rel="noreferrer" className={`flex flex-col mt-1 border ${isMine ? 'border-primary/30 hover:bg-primary/10' : 'border-outline-variant hover:bg-surface-container-low'} rounded-lg overflow-hidden transition-colors w-full max-w-[280px]`}>
                               {m.linkPreview.image && <img src={m.linkPreview.image} className="w-full h-[120px] object-cover" />}
                               <div className="p-2 flex flex-col gap-1">
                                 <span className="font-semibold text-xs truncate">{m.linkPreview.title}</span>
                                 {m.linkPreview.description && <span className="text-[10px] opacity-80 line-clamp-2">{m.linkPreview.description}</span>}
                                 <span className="text-[9px] font-medium opacity-60 mt-0.5 truncate">{new URL(m.linkPreview.url).hostname}</span>
                               </div>
                             </a>
                           )}
                         </div>
                       )}
                       
                       <div className={`flex items-center gap-1 mt-1 self-end ${isMine ? 'text-white/80' : 'text-on-surface-variant/80'}`}>
                         {m.starredBy?.includes(user?.id) && (
                           <span className="material-symbols-outlined text-[12px] text-yellow-400 mr-0.5" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                         )}
                         {m.editedAt && (
                           <span className="text-[10px] font-medium tracking-tight opacity-70 italic mr-1">
                             edited
                           </span>
                         )}
                         <span className="text-[10px] font-medium tracking-tight">
                           {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                         {isMine && (
                           <span className={`material-symbols-outlined text-[14px] ml-0.5 ${m.seenBy?.length > 0 ? 'text-blue-500 font-bold' : 'text-white/60'}`}>
                             {m.seenBy?.length > 0 ? 'done_all' : 'done'}
                           </span>
                         )}
                       </div>

                       {/* Reactions Display */}
                       {Object.keys(reactionCounts).length > 0 && (
                         <div className={`flex flex-wrap gap-1 mt-2 absolute -bottom-3 ${isMine ? 'right-2' : 'left-2'}`}>
                           {Object.entries(reactionCounts).map(([emoji, count]) => (
                             <button key={emoji} onClick={() => handleReactToMessage(m._id, emoji)} className={`flex items-center gap-1 border rounded-full px-1.5 py-0.5 text-[11px] shadow-sm transition-colors ${userReactions[emoji] ? 'bg-primary-container border-primary/30 text-on-primary-container' : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}>
                               <span className="text-[14px] leading-none">{emoji}</span>
                               <span className="font-medium">{count}</span>
                             </button>
                           ))}
                         </div>
                       )}

                     </div>
                    </div>
                 </motion.div>
               );
             })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Bottom Input Bar */}
        <div className="w-full bg-background border-t border-outline-variant/30 py-2 md:py-md px-2 md:px-margin-desktop flex flex-col items-center shrink-0 relative">
          
          {/* Active Status Indicators (Typing / Editing) */}
          <div className="w-full max-w-[900px] mb-2 px-sm flex flex-col gap-1">
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-primary font-medium text-sm animate-pulse">
                <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                {typingUsers.length === 1 ? 'Someone is typing...' : 'Several people are typing...'}
              </div>
            )}
            
            {editingMessage && (
              <div className="flex items-center justify-between bg-surface-container border-l-2 border-primary px-3 py-1.5 rounded-r-md">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-primary">Editing Message</span>
                  <span className="text-sm text-on-surface-variant truncate max-w-[300px]">{editingMessage.content}</span>
                </div>
                <button onClick={() => { setEditingMessage(null); setNewMessage(''); }} className="p-1 rounded-full text-outline hover:text-error hover:bg-error-container/20 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {replyingToMessage && (
              <div className="flex items-center justify-between bg-surface-container border-l-2 border-primary px-3 py-1.5 rounded-r-md">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-primary">Replying to {replyingToMessage.sender?.displayName}</span>
                  <span className="text-sm text-on-surface-variant truncate max-w-[300px]">
                    {replyingToMessage.content.startsWith('http') && replyingToMessage.content.includes('ik.imagekit.io') ? 'Media file' : replyingToMessage.content}
                  </span>
                </div>
                <button onClick={() => setReplyingToMessage(null)} className="p-1 rounded-full text-outline hover:text-error hover:bg-error-container/20 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}
          </div>

          <div className="w-full max-w-[900px]">
            {showEmojiPicker && audioState === 'idle' && (
              <div className="absolute bottom-[100px] left-8 z-[1000] shadow-2xl">
                <EmojiPicker emojiStyle="native" onEmojiClick={onEmojiClick} theme={theme} />
              </div>
            )}
            <div className="flex items-end gap-1 md:gap-sm bg-surface border border-outline-variant rounded-2xl px-1 md:px-sm py-1 md:py-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all shadow-sm">
              
              {audioState === 'idle' && (
                <>
                  <div className="relative p-1 md:p-sm text-outline hover:text-primary transition-colors rounded-full hover:bg-surface-container-low self-end mb-0.5 overflow-hidden">
                    <input type="file" onChange={handleAttachFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="Attach file" />
                    <span className="material-symbols-outlined text-[20px] md:text-[22px] pointer-events-none">attach_file</span>
                  </div>
                  <textarea 
                    className="flex-1 bg-transparent border-none resize-none focus:ring-0 font-body-md text-body-md text-on-surface placeholder:text-outline py-2 md:py-sm px-1 md:px-xs min-h-[44px] max-h-[120px] outline-none" 
                    placeholder="Message..." 
                    rows="1"
                    value={newMessage}
                    onChange={handleTyping}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  ></textarea>
                  <div className="flex items-center gap-0 md:gap-1 self-end mb-0.5 pr-0 md:pr-xs">
                    <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-1 md:p-sm transition-colors rounded-full hover:bg-surface-container-low ${showEmojiPicker ? 'text-primary' : 'text-outline hover:text-primary'}`}>
                      <span className="material-symbols-outlined text-[20px] md:text-[22px]">mood</span>
                    </button>
                    <button onClick={startRecording} className="p-1 md:p-sm text-outline hover:text-primary transition-colors rounded-full hover:bg-surface-container-low">
                      <span className="material-symbols-outlined text-[20px] md:text-[22px]">mic</span>
                    </button>
                  </div>
                  <button onClick={sendMessage} className="p-2 md:p-sm bg-primary text-on-primary hover:bg-primary-container transition-colors rounded-xl self-end mb-0.5 ml-1 md:ml-xs flex items-center justify-center shadow-ambient active:scale-95 duration-150">
                    <span className="material-symbols-outlined text-[18px] md:text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                  </button>
                </>
              )}

              {audioState === 'recording' && (
                <div className="flex-1 flex items-center justify-between px-4 py-2 bg-error-container/10 rounded-xl min-h-[44px]">
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-error animate-pulse">mic</span>
                    <span className="font-body-md text-error font-medium">
                      {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-1 h-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-1 bg-error rounded-full animate-wave" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
                      ))}
                    </div>
                  </div>
                  <button onClick={stopRecording} className="p-2 bg-error text-on-error rounded-full hover:bg-error/80 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">stop</span>
                  </button>
                </div>
              )}

              {audioState === 'preview' && audioBlob && (
                <div className="flex-1 flex items-center justify-between gap-4 px-2 py-1 bg-surface-container-lowest rounded-xl min-h-[44px]">
                  <button onClick={cancelAudio} className="p-2 text-error hover:bg-error-container/30 rounded-full transition-colors flex shrink-0">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                  <audio src={URL.createObjectURL(audioBlob)} controls className="flex-1 h-[40px]" />
                  <button onClick={sendAudio} className="p-2 bg-primary text-on-primary rounded-full hover:bg-primary-container transition-colors flex shrink-0">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Forward Modal */}
        {forwardingMessage && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-surface rounded-2xl p-4 md:p-6 w-full max-w-[400px] shadow-2xl flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-on-surface">Forward Message</h3>
                <button onClick={() => setForwardingMessage(null)} className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="overflow-y-auto flex-1 pr-2">
                {chatsList.length === 0 ? (
                  <p className="text-center text-outline py-8">No chats found.</p>
                ) : (
                  chatsList.map(chat => {
                    const otherUser = chat.users.find(u => u.clerkId !== user?.id);
                    return (
                      <button key={chat._id} onClick={() => handleForwardMessage(chat._id)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors text-left mb-1">
                        <img src={otherUser?.avatarUrl || '/avatars/avatar_female_light.jpg'} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        <span className="font-semibold text-on-surface truncate flex-1">{otherUser?.displayName || otherUser?.firstName || 'User'}</span>
                        <span className="material-symbols-outlined text-outline">send</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        <GroupInfoModal
          isOpen={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          chat={selectedChat}
          onChatUpdated={onChatUpdate}
        />

        <GroupSettingsModal
          isOpen={isGroupSettingsOpen}
          onClose={() => setIsGroupSettingsOpen(false)}
          chat={selectedChat}
          onChatUpdated={onChatUpdate}
        />

        <ConfirmModal 
          isOpen={showDeleteConfirm} 
          onClose={() => setShowDeleteConfirm(false)} 
          onConfirm={confirmDeleteChat}
          title="Delete Chat"
          message="Are you sure you want to permanently delete this chat? This action cannot be undone."
        />
        
        {isWallpaperPickerOpen && (
          <ChatWallpaperPicker 
            chatId={selectedChat._id}
            currentUser={user}
            onClose={() => setIsWallpaperPickerOpen(false)}
            onUpdate={onChatUpdate}
          />
        )}
      </div>
    </IKContext>
  );
}

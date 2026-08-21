import { useState, useEffect, useRef } from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../redux/themeSlice';
import { updatePresence } from '../redux/presenceSlice';
import { useNavigate } from 'react-router-dom';
import ChatWindow from '../components/chat/ChatWindow';
import SettingsModal from '../components/chat/SettingsModal';
import CreateChannelModal from '../components/chat/CreateChannelModal';
import ConfirmModal from '../components/common/ConfirmModal';
import StatusFeed from '../components/chat/StatusFeed';
import VideoCallModal from '../components/chat/VideoCallModal';
import axios from 'axios';
import toast from 'react-hot-toast';
import socket from '../sockets/socket';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatHome() {
  const { user } = useUser();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector(state => state.theme.theme);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  
  // Global Call States
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [callIsVideo, setCallIsVideo] = useState(true);
  const [targetUserForCall, setTargetUserForCall] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [checkingOnboarded, setCheckingOnboarded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [friendsData, setFriendsData] = useState({ friends: [], friendRequests: [], sentRequests: [] });
  const friendsDataRef = useRef(friendsData);
  const selectedChatRef = useRef(selectedChat);
  
  const [activeTab, setActiveTab] = useState('Direct Messages');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [deleteChatId, setDeleteChatId] = useState(null);

  const fetchChats = async () => {
    try {
      const config = { headers: { 'clerk-id': user.id } };
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/chats`, config);
      setChats(data);
      return data;
    } catch (error) {
      console.error('Error fetching chats', error);
      return [];
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const config = { headers: { 'clerk-id': user.id } };
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/friends`, config);
      setFriendsData(data);
    } catch (error) {
      console.error('Error fetching friends', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchChats();
      fetchFriends();
      
      const handleCallOffer = (data) => {
        setIncomingCallData(data);
        setCallIsVideo(!!data.isVideo);
        setIsVideoCallOpen(true);
      };
      
      socket.on("call:offer", handleCallOffer);
      return () => {
        socket.off("call:offer", handleCallOffer);
      };
    }
  }, [user]);

  useEffect(() => {
    friendsDataRef.current = friendsData;
  }, [friendsData]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  const handleStartCall = (isVideo, targetUser) => {
    setTargetUserForCall(targetUser);
    setCallIsVideo(isVideo);
    setIncomingCallData(null);
    setIsVideoCallOpen(true);
  };

  // Guard: redirect to onboarding if the user hasn't set up a profile yet
  useEffect(() => {
    if (!user) return;
    const config = { headers: { 'clerk-id': user.id } };
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/me`, config)
      .then(({ data }) => {
        if (!data.onboarded) {
          navigate('/onboarding');
        } else {
          setCheckingOnboarded(false);
        }
      })
      .catch(() => {
        navigate('/onboarding');
      });
  }, [user, navigate]);

  const updateChatWithMessage = (message) => {
    const chatId = message.chat?._id || message.chat;
    if (!chatId) return;
    setChats(prev => {
      const existing = prev.find(c => c._id === chatId);
      const isCurrentlyOpen = selectedChatRef.current && selectedChatRef.current._id === chatId;
      const isFromMe = (message.sender?._id || message.sender?.clerkId) === user?.id;

      if (existing) {
        let newUnreadCount = existing.unreadCount || 0;
        if (!isCurrentlyOpen && !isFromMe) {
          newUnreadCount += 1;
        }
        return [{ ...existing, latestMessage: message, unreadCount: newUnreadCount }, ...prev.filter(c => c._id !== chatId)];
      }
      
      const senderId = message.sender?._id || message.sender?.clerkId;
      const isFriend = friendsDataRef.current.friends.some(f => f._id === senderId);
      if (!isFriend) return prev;
      
      let newUnreadCount = 0;
      if (!isCurrentlyOpen && !isFromMe) {
        newUnreadCount += 1;
      }
      return [{ ...(message.chat || {}), _id: chatId, latestMessage: message, unreadCount: newUnreadCount }, ...prev];
    });
  };

  // Live socket: update the chat list when a message arrives
  useEffect(() => {
    if (!user) return;
    
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('join', { userId: user.id });

    socket.on('message:new', (newMessage) => {
      updateChatWithMessage(newMessage);
    });

    socket.on('friend-request-received', (newRequest) => {
      setFriendsData(prev => {
        if (prev.friendRequests.some(r => r._id === newRequest._id)) return prev;
        return { ...prev, friendRequests: [newRequest, ...prev.friendRequests] };
      });
      toast.success(`New friend request from ${newRequest.displayName || 'a user'}`);
    });

    socket.on('friend-accepted', () => {
      fetchFriends();
      fetchChats();
    });

    socket.on('group updated', async (updatedChat) => {
      const freshChats = await fetchChats();
      const current = selectedChatRef.current;
      if (current?.isGroupChat && current._id === updatedChat?._id) {
        const updated = freshChats.find((c) => c._id === updatedChat._id);
        if (updated) setSelectedChat(updated);
      }
    });

    socket.on('presence:update', (presenceData) => {
      dispatch(updatePresence(presenceData));
    });

    return () => {
      socket.off('message:new');
      socket.off('friend-request-received');
      socket.off('friend-accepted');
      socket.off('group updated');
      socket.off('presence:update');
    };
  }, [user, dispatch]);

  const handleSearch = async (e) => {
    setSearch(e.target.value);
    if (!e.target.value) {
      setSearchResult([]);
      return;
    }
    try {
      setLoading(true);
      const config = { headers: { 'clerk-id': user.id } };
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users?search=${e.target.value}`, config);
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      console.error('Error searching users', error);
    }
  };

  const accessChat = async (userId) => {
    try {
      const config = { headers: { 'clerk-id': user.id } };
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/chats`, { userId }, config);
      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
      setSelectedChat(data);
      setSearch('');
      setSearchResult([]);
    } catch (error) {
      console.error('Error accessing chat', error);
    }
  };

  const sendFriendRequest = async (userId, e) => {
    e?.stopPropagation();
    try {
      const config = { headers: { 'clerk-id': user.id } };
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/request/${userId}`, {}, config);
      toast.success('Friend request sent');
      fetchFriends();
    } catch (err) { toast.error(err.response?.data?.message || 'Error sending request'); }
  };

  const acceptFriendRequest = async (userId, e) => {
    e?.stopPropagation();
    try {
      const config = { headers: { 'clerk-id': user.id } };
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/accept/${userId}`, {}, config);
      toast.success('Request accepted');
      await fetchFriends();
      await accessChat(userId);
      setActiveTab('Direct Messages');
    } catch (err) { toast.error('Error accepting request'); }
  };

  const rejectFriendRequest = async (userId, e) => {
    e?.stopPropagation();
    try {
      const config = { headers: { 'clerk-id': user.id } };
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/reject/${userId}`, {}, config);
      toast.success('Request rejected');
      fetchFriends();
    } catch (err) { toast.error('Error rejecting request'); }
  };

  const getSender = (loggedUser, users) => {
    return users[0]?.clerkId === loggedUser?.id ? users[1]?.displayName : users[0]?.displayName;
  };
  const getSenderPic = (loggedUser, users) => {
    return users[0]?.clerkId === loggedUser?.id ? users[1]?.avatarUrl : users[0]?.avatarUrl;
  };

  const handleFriendRemoved = (friendId) => {
    setChats(prev => prev.filter(c => c.isGroupChat || !c.users.some(u => u._id === friendId)));
    if (selectedChat && !selectedChat.isGroupChat && selectedChat.users.some(u => u._id === friendId)) {
      setSelectedChat(null);
    }
  };

  const updateChatInList = (updatedChat) => {
    setChats(prev => {
      const rest = prev.filter(c => c._id !== updatedChat._id);
      return [updatedChat, ...rest];
    });
    setSelectedChat(updatedChat);
  };

  const handleRemoveFriend = async (friendId, e) => {
    e.stopPropagation();
    try {
      const config = { headers: { 'clerk-id': user.id } };
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/remove/${friendId}`, {}, config);
      toast.success('Friend removed');
      fetchFriends();
      handleFriendRemoved(friendId);
    } catch (err) { toast.error('Error removing friend'); }
  };

  const handleArchiveChat = async (chatId, e) => {
    e.stopPropagation();
    try {
      const chat = chats.find(c => c._id === chatId);
      const wasArchived = chat?.archivedBy?.some(u => u.clerkId === user.id);
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/chats/${chatId}/archive`, {}, { headers: { 'clerk-id': user.id } });
      // Update the list immediately so archived/unarchived state is reflected right away
      setChats(prev => prev.map(c => {
        if (c._id !== chatId) return c;
        const archivedBy = wasArchived
          ? (c.archivedBy || []).filter(u => u.clerkId !== user.id)
          : [{ _id: user.id, clerkId: user.id }, ...(c.archivedBy || [])];
        return { ...c, archivedBy };
      }));
      toast.success(wasArchived ? 'Chat unarchived' : 'Chat archived');
      fetchChats();
      if(selectedChat?._id === chatId) setSelectedChat(null);
    } catch (err) { toast.error('Error archiving chat'); }
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    setDeleteChatId(chatId);
  };

  const confirmDelete = async () => {
    if(!deleteChatId) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/chats/${deleteChatId}`, { headers: { 'clerk-id': user.id } });
      toast.success('Chat deleted');
      fetchChats();
      if(selectedChat?._id === deleteChatId) setSelectedChat(null);
    } catch (err) { toast.error('Error deleting chat'); }
    setDeleteChatId(null);
  };

  const isChatArchivedForMe = (c) => c.archivedBy?.some(u => u.clerkId === user?.id);
  const archivedChats = chats.filter(c => isChatArchivedForMe(c));
  const visibleChats = chats.filter(c => {
    if (activeTab === 'Archived') return isChatArchivedForMe(c);
    const matchesType = activeTab === 'Channels' ? c.isGroupChat : !c.isGroupChat;
    return matchesType && !isChatArchivedForMe(c);
  });

  if (checkingOnboarded) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden relative">
      
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-[260px] h-full bg-surface-lowest border-r border-outline-variant flex-col fixed left-0 top-0 z-50">
        {/* Header */}
        <div className="flex items-center gap-sm px-sm mb-lg">
          <img src="/logo.png" alt="SyncSphere Logo" className="w-11 h-11 rounded-full border-2 border-primary-fixed shadow-ambient object-cover" />
          <div className="flex flex-col flex-1">
            <span className="font-headline-md text-headline-md font-bold text-primary leading-tight">SyncSphere</span>
          </div>
          <div className="w-11 h-11 rounded-full border-2 border-surface shadow-ambient flex items-center justify-center overflow-hidden shrink-0">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-11 h-11" } }} />
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-col gap-unit w-full flex-1">
          <button 
            onClick={() => setActiveTab('Workspaces')}
            className={`flex items-center gap-sm px-sm py-sm rounded-lg transition-colors duration-200 cursor-pointer w-full text-left ${activeTab === 'Workspaces' ? 'bg-secondary-fixed text-on-secondary-fixed font-medium' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined font-light text-[24px]">grid_view</span>
            <span className="font-body-md text-body-md">Workspaces</span>
          </button>
          <button 
            onClick={() => setActiveTab('Channels')}
            className={`flex items-center gap-sm px-sm py-sm rounded-lg transition-colors duration-200 cursor-pointer w-full text-left ${activeTab === 'Channels' ? 'bg-secondary-fixed text-on-secondary-fixed font-medium' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined font-light text-[24px]">tag</span>
            <span className="font-body-md text-body-md">Channels</span>
          </button>
          <button 
            onClick={() => setActiveTab('Direct Messages')}
            className={`flex items-center gap-sm px-sm py-sm rounded-lg transition-colors duration-200 cursor-pointer w-full text-left ${activeTab === 'Direct Messages' ? 'bg-secondary-fixed text-on-secondary-fixed font-medium' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined" style={activeTab === 'Direct Messages' ? { fontVariationSettings: "'FILL' 1" } : {}}>chat_bubble</span>
            <span className="font-body-md text-body-md">Direct Messages</span>
          </button>
          <button 
            onClick={() => setActiveTab('Events')}
            className={`flex items-center gap-sm px-sm py-sm rounded-lg transition-colors duration-200 cursor-pointer w-full text-left ${activeTab === 'Events' ? 'bg-secondary-fixed text-on-secondary-fixed font-medium' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined font-light text-[24px]">calendar_today</span>
            <span className="font-body-md text-body-md">Events</span>
          </button>
          <button 
            onClick={() => setActiveTab('Requests')}
            className={`flex items-center gap-sm px-sm py-sm rounded-lg transition-colors duration-200 cursor-pointer w-full text-left ${activeTab === 'Requests' ? 'bg-secondary-fixed text-on-secondary-fixed font-medium' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined font-light text-[24px]">group_add</span>
            <span className="font-body-md text-body-md flex-1">Requests</span>
            {friendsData.friendRequests.length > 0 && (
              <span className="bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full">{friendsData.friendRequests.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('Archived')}
            className={`flex items-center gap-sm px-sm py-sm rounded-lg transition-colors duration-200 cursor-pointer w-full text-left ${activeTab === 'Archived' ? 'bg-secondary-fixed text-on-secondary-fixed font-medium' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined font-light text-[24px]">archive</span>
            <span className="font-body-md text-body-md flex-1">Archived</span>
            {archivedChats.length > 0 && (
              <span className="bg-surface-container-high text-on-surface-variant text-[10px] font-bold px-1.5 py-0.5 rounded-full">{archivedChats.length}</span>
            )}
          </button>
          
          <div className="flex-1"></div>
          
          <button 
            onClick={() => dispatch(toggleTheme())}
            className="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors duration-200 cursor-pointer w-full text-left"
          >
            <span className="material-symbols-outlined font-light text-[24px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            <span className="font-body-md text-body-md">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {user?.primaryEmailAddress?.emailAddress === 'kashishsalvi06@gmail.com' && (
            <button 
              onClick={() => navigate('/admin')}
              className="flex items-center gap-sm px-sm py-sm rounded-lg text-error hover:bg-error-container/20 transition-colors duration-200 cursor-pointer mb-sm w-full text-left"
            >
              <span className="material-symbols-outlined font-light text-[24px]">admin_panel_settings</span>
              <span className="font-body-md text-body-md font-medium">Admin Portal</span>
            </button>
          )}

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors duration-200 cursor-pointer mb-sm w-full text-left"
          >
            <span className="material-symbols-outlined font-light text-[24px]">settings</span>
            <span className="font-body-md text-body-md">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area Wrapper */}
      <div className="md:ml-[260px] flex w-full md:w-[calc(100%-260px)] h-full">
        {/* Left Panel: Chat List */}
        <section className={`w-full md:w-[360px] h-full border-r border-outline-variant bg-surface flex-col z-0 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-lg pt-lg pb-sm flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="font-title-lg text-title-lg text-on-surface font-semibold tracking-tight">
                {activeTab === 'Channels' ? 'Channels' : activeTab === 'Direct Messages' ? 'Messages' : activeTab}
              </h2>
            </div>
            {activeTab === 'Channels' && (
              <button 
                onClick={() => setIsChannelModalOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined font-light">add_circle</span>
              </button>
            )}
            {activeTab === 'Direct Messages' && (
              <button className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors">
                <span className="material-symbols-outlined font-light">edit_square</span>
              </button>
            )}
          </div>
          
          {/* Search Bar */}
          <div className="px-lg pb-sm">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant/70 text-[20px]">search</span>
              <input 
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-full py-2 pl-xl pr-sm font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-on-surface placeholder:text-on-surface-variant/50 shadow-sm" 
                placeholder="Search users..." 
                type="text"
                value={search}
                onChange={(e) => handleSearch(e)}
              />
            </div>
          </div>
          
          <StatusFeed />

          <div className="flex-1 overflow-y-auto px-md pb-[80px] md:pb-lg space-y-1 mt-2">
            <AnimatePresence>
              {initialLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <motion.div 
                    key={`skeleton-${i}`} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="flex items-center gap-3 p-3 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-variant animate-pulse shrink-0"></div>
                    <div className="flex-1 flex flex-col gap-2 min-w-0 pr-6">
                      <div className="h-4 bg-surface-variant animate-pulse rounded-full w-2/3"></div>
                      <div className="h-3 bg-surface-variant animate-pulse rounded-full w-4/5"></div>
                    </div>
                  </motion.div>
                ))
              ) : searchResult.length > 0 ? (
                searchResult.map((u, i) => {
                  const isFriend = friendsData.friends.some(f => f._id === u._id);
                  const isSent = friendsData.sentRequests.some(r => r._id === u._id);
                  const isReceived = friendsData.friendRequests.some(r => r._id === u._id);

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={u._id} 
                      onClick={() => { if (isFriend) accessChat(u._id); }} 
                      className={`flex justify-between items-center p-3 rounded-lg transition-colors ${isFriend ? 'hover:bg-surface-container-low cursor-pointer' : 'bg-surface'}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <img src={u.avatarUrl || '/avatars/avatar_female_light.jpg'} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        <div className="min-w-0">
                          <p className="font-body-md text-on-surface font-medium truncate">{u.displayName}</p>
                          <p className="font-body-sm text-on-surface-variant truncate">{u.username ? `@${u.username}` : u.email}</p>
                        </div>
                      </div>
                      
                      {isFriend ? (
                        <button className="text-primary hover:bg-primary/10 p-1.5 rounded-full transition-colors flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                        </button>
                      ) : isSent ? (
                        <span className="font-label-sm text-on-surface-variant bg-surface-container px-2 py-1 rounded-md shrink-0">Pending</span>
                      ) : isReceived ? (
                        <button onClick={(e) => acceptFriendRequest(u._id, e)} className="bg-primary text-on-primary font-label-md px-3 py-1.5 rounded-lg hover:bg-primary-container transition-colors shrink-0">
                          Accept
                        </button>
                      ) : (
                        <button onClick={(e) => sendFriendRequest(u._id, e)} className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0">
                          <span className="material-symbols-outlined text-[16px]">person_add</span> Add
                        </button>
                      )}
                    </motion.div>
                  );
                })
              ) : activeTab === 'Requests' ? (
                <>
                  {friendsData.friendRequests.length === 0 && <p className="text-on-surface-variant text-center font-body-sm mt-4">No pending requests</p>}
                  {friendsData.friendRequests.map((u, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={u._id} 
                      className="flex justify-between items-center p-3 rounded-lg bg-surface border border-outline-variant/30 mb-2"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <img src={u.avatarUrl || '/avatars/avatar_female_light.jpg'} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        <div className="min-w-0">
                          <p className="font-body-md text-on-surface font-medium truncate">{u.displayName}</p>
                          <p className="font-body-sm text-on-surface-variant truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={(e) => rejectFriendRequest(u._id, e)} className="p-1.5 text-on-surface-variant hover:bg-error-container hover:text-error rounded-full transition-colors flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                        <button onClick={(e) => acceptFriendRequest(u._id, e)} className="bg-primary text-on-primary font-label-md px-3 py-1.5 rounded-lg hover:bg-primary-container transition-colors flex items-center justify-center">
                          Accept
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </>
              ) : visibleChats.length > 0 ? (
                visibleChats.map((chat, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={chat._id} 
                    onClick={() => {
                      setSelectedChat(chat);
                      if (chat.unreadCount > 0) {
                        setChats(prev => prev.map(c => c._id === chat._id ? { ...c, unreadCount: 0 } : c));
                      }
                    }} 
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors group relative ${selectedChat?._id === chat._id ? 'bg-surface-container-high' : 'hover:bg-surface-container-low'}`}
                  >
                    <img src={chat.isGroupChat ? (chat.chatAvatar || '/logo.png') : getSenderPic(user, chat.users) || '/avatars/avatar_female_light.jpg'} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex justify-between items-center w-full">
                        <p className={`font-body-md text-on-surface truncate ${chat.unreadCount > 0 ? 'font-bold' : 'font-medium'}`}>
                          {!chat.isGroupChat ? getSender(user, chat.users) : chat.chatName}
                        </p>
                        <div className="flex items-center gap-2">
                          {chat.unreadCount > 0 && (
                            <span className="bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                              {chat.unreadCount}
                            </span>
                          )}
                          <div className="relative opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => e.stopPropagation()} 
                            className="p-1 rounded-full hover:bg-outline-variant/30 text-on-surface-variant group/menu focus:outline-none"
                          >
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                            <div className="absolute right-0 top-full mt-1 w-40 bg-surface border border-outline-variant/30 rounded-xl shadow-2xl overflow-hidden z-[100] opacity-0 pointer-events-none transition-opacity focus-within:opacity-100 focus-within:pointer-events-auto group-focus-within/menu:opacity-100 group-focus-within/menu:pointer-events-auto">
                              <div onClick={(e) => handleArchiveChat(chat._id, e)} className="w-full flex items-center gap-2 text-left px-3 py-2 font-body-sm hover:bg-surface-container-low transition-colors text-on-surface cursor-pointer">
                                <span className="material-symbols-outlined text-[16px]">{isChatArchivedForMe(chat) ? 'unarchive' : 'archive'}</span>
                                {isChatArchivedForMe(chat) ? 'Unarchive' : 'Archive'}
                              </div>
                              {!chat.isGroupChat && (
                                <>
                                  <div className="h-px w-full bg-outline-variant/30"></div>
                                  <div onClick={(e) => handleRemoveFriend(chat.users.find(u => u.clerkId !== user.id)?._id, e)} className="w-full flex items-center gap-2 text-left px-3 py-2 font-body-sm hover:bg-error-container hover:text-error transition-colors text-error cursor-pointer">
                                    <span className="material-symbols-outlined text-[16px]">person_remove</span> Remove Friend
                                  </div>
                                </>
                              )}
                              <div className="h-px w-full bg-outline-variant/30"></div>
                              <div onClick={(e) => handleDeleteChat(chat._id, e)} className="w-full flex items-center gap-2 text-left px-3 py-2 font-body-sm hover:bg-error-container hover:text-error transition-colors text-error cursor-pointer">
                                <span className="material-symbols-outlined text-[16px]">delete</span> Delete
                              </div>
                            </div>
                          </button>
                        </div>
                        </div>
                      </div>
                      <p className="font-body-sm text-on-surface-variant truncate pr-2">
                        {chat.latestMessage ? (
                          chat.latestMessage.content.startsWith('http') && chat.latestMessage.content.includes('ik.imagekit.io')
                            ? (chat.latestMessage.content.endsWith('.webm') || chat.latestMessage.content.endsWith('.mp3') || chat.latestMessage.content.endsWith('.wav') || chat.latestMessage.content.endsWith('.ogg') ? '🎵 Audio message' : '📎 File attached')
                            : chat.latestMessage.content
                        ) : 'Start a conversation'}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-on-surface-variant mt-10 font-body-sm">
                  No {activeTab.toLowerCase()} found.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Right Panel: Chat Window */}
        <div className={`flex-1 md:h-full ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
          <ChatWindow 
            selectedChat={selectedChat} 
            user={user} 
            onBack={() => setSelectedChat(null)}
            onMessageSent={updateChatWithMessage}
            onFriendRemoved={handleFriendRemoved}
            onChatUpdate={updateChatInList}
            onStartCall={handleStartCall}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className={`md:hidden fixed bottom-0 w-full h-[64px] bg-surface-bright border-t border-outline-variant z-50 flex items-center justify-around px-2 shadow-2xl ${selectedChat ? 'hidden' : 'flex'}`}>
        <button onClick={() => setActiveTab('Direct Messages')} className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${activeTab === 'Direct Messages' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined text-[24px]" style={activeTab === 'Direct Messages' ? { fontVariationSettings: "'FILL' 1" } : {}}>chat_bubble</span>
          <span className="text-[10px] font-medium mt-1">Chats</span>
        </button>
        <button onClick={() => setActiveTab('Channels')} className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${activeTab === 'Channels' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined text-[24px]" style={activeTab === 'Channels' ? { fontVariationSettings: "'FILL' 1" } : {}}>tag</span>
          <span className="text-[10px] font-medium mt-1">Channels</span>
        </button>
        <button onClick={() => setActiveTab('Workspaces')} className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${activeTab === 'Workspaces' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined text-[24px]" style={activeTab === 'Workspaces' ? { fontVariationSettings: "'FILL' 1" } : {}}>grid_view</span>
          <span className="text-[10px] font-medium mt-1">Spaces</span>
        </button>
        <button onClick={() => setActiveTab('Requests')} className={`flex flex-col items-center justify-center w-16 h-full transition-colors relative ${activeTab === 'Requests' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined text-[24px]" style={activeTab === 'Requests' ? { fontVariationSettings: "'FILL' 1" } : {}}>group_add</span>
          <span className="text-[10px] font-medium mt-1">Requests</span>
          {friendsData.friendRequests.length > 0 && <span className="absolute top-1 right-2 w-3 h-3 bg-error rounded-full border-2 border-surface-bright"></span>}
        </button>
        <button onClick={() => setIsSettingsOpen(true)} className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${isSettingsOpen ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined text-[24px]" style={isSettingsOpen ? { fontVariationSettings: "'FILL' 1" } : {}}>settings</span>
          <span className="text-[10px] font-medium mt-1">Profile</span>
        </button>
      </nav>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onUpdate={fetchChats} 
      />
      
      <StatusFeed isOpen={isStatusFeedOpen} onClose={() => setIsStatusFeedOpen(false)} currentUser={user} />
      
      <VideoCallModal 
        isOpen={isVideoCallOpen} 
        onClose={() => {
          setIsVideoCallOpen(false);
          setIncomingCallData(null);
          setTargetUserForCall(null);
        }} 
        socket={socket} 
        targetUser={targetUserForCall}
        incomingCall={incomingCallData}
        currentUser={user}
        isVideo={callIsVideo}
      />
      
      <CreateChannelModal 
        isOpen={isChannelModalOpen} 
        onClose={() => setIsChannelModalOpen(false)} 
        onSuccess={fetchChats}
        onCreated={(newChat) => {
          setChats([newChat, ...chats]);
          setSelectedChat(newChat);
          setActiveTab('Channels');
        }} 
      />

      <ConfirmModal 
        isOpen={!!deleteChatId} 
        onClose={() => setDeleteChatId(null)} 
        onConfirm={confirmDelete}
        title="Delete Chat"
        message="Are you sure you want to permanently delete this chat? This action cannot be undone."
      />
    </div>
  );
}

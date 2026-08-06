import { useState, useEffect, useRef } from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../redux/themeSlice';
import { useNavigate } from 'react-router-dom';
import ChatWindow from '../components/chat/ChatWindow';
import SettingsModal from '../components/chat/SettingsModal';
import CreateChannelModal from '../components/chat/CreateChannelModal';
import ConfirmModal from '../components/common/ConfirmModal';
import StatusFeed from '../components/chat/StatusFeed';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ChatHome() {
  const { user } = useUser();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector(state => state.theme.theme);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState('Direct Messages');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [deleteChatId, setDeleteChatId] = useState(null);

  const fetchChats = async () => {
    try {
      const config = { headers: { 'clerk-id': user.id } };
      const { data } = await axios.get('http://localhost:5001/api/chats', config);
      setChats(data);
    } catch (error) {
      console.error('Error fetching chats', error);
    }
  };

  useEffect(() => {
    if (user) fetchChats();
  }, [user]);

  const handleSearch = async (e) => {
    setSearch(e.target.value);
    if (!e.target.value) {
      setSearchResult([]);
      return;
    }
    try {
      setLoading(true);
      const config = { headers: { 'clerk-id': user.id } };
      const { data } = await axios.get(`http://localhost:5001/api/users?search=${e.target.value}`, config);
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      console.error('Error searching users', error);
    }
  };

  const accessChat = async (userId) => {
    try {
      const config = { headers: { 'clerk-id': user.id } };
      const { data } = await axios.post('http://localhost:5001/api/chats', { userId }, config);
      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
      setSelectedChat(data);
      setSearch('');
      setSearchResult([]);
    } catch (error) {
      console.error('Error accessing chat', error);
    }
  };

  const getSender = (loggedUser, users) => {
    return users[0]?.clerkId === loggedUser?.id ? users[1]?.displayName : users[0]?.displayName;
  };
  const getSenderPic = (loggedUser, users) => {
    return users[0]?.clerkId === loggedUser?.id ? users[1]?.avatarUrl : users[0]?.avatarUrl;
  };

  const handleArchiveChat = async (chatId, e) => {
    e.stopPropagation();
    try {
      await axios.put(`http://localhost:5001/api/chats/${chatId}/archive`, {}, { headers: { 'clerk-id': user.id } });
      toast.success('Chat archived');
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
      await axios.delete(`http://localhost:5001/api/chats/${deleteChatId}`, { headers: { 'clerk-id': user.id } });
      toast.success('Chat deleted');
      fetchChats();
      if(selectedChat?._id === deleteChatId) setSelectedChat(null);
    } catch (err) { toast.error('Error deleting chat'); }
    setDeleteChatId(null);
  };

  return (
    <div className="bg-background text-on-background h-screen overflow-hidden flex antialiased">
      {/* Shared Component: SideNavBar */}
      <aside className="w-[260px] h-screen fixed left-0 top-0 border-r border-outline-variant bg-surface flex flex-col py-lg px-md gap-xs z-20">
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
      <div className="ml-[260px] flex w-[calc(100%-260px)] h-full">
        {/* Left Panel: Chat List */}
        <section className="w-[360px] h-full border-r border-outline-variant bg-surface flex flex-col z-0">
          <div className="px-lg pt-lg pb-sm flex justify-between items-center">
            <h2 className="font-title-sm text-title-sm text-on-surface font-semibold tracking-tight">
              {activeTab === 'Channels' ? 'Channels' : activeTab === 'Direct Messages' ? 'Messages' : activeTab}
            </h2>
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
                onChange={(e) => {setSearch(e.target.value); handleSearch(e.target.value);}}
              />
            </div>
          </div>
          
          <StatusFeed />

          <div className="flex-1 overflow-y-auto px-md pb-lg space-y-1 mt-2">
            {searchResult.length > 0 ? (
              searchResult.map((u) => (
                <div key={u._id} onClick={() => accessChat(u._id)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-low cursor-pointer transition-colors">
                  <img src={u.avatarUrl || '/avatars/avatar_female_light.jpg'} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-body-md text-on-surface font-medium">{u.displayName}</p>
                    <p className="font-body-sm text-on-surface-variant truncate">{u.email}</p>
                  </div>
                </div>
              ))
            ) : chats.filter(c => (activeTab === 'Channels' ? c.isGroupChat : !c.isGroupChat) && !c.archivedBy?.some(u => u.clerkId === user.id)).length > 0 ? (
              chats.filter(c => (activeTab === 'Channels' ? c.isGroupChat : !c.isGroupChat) && !c.archivedBy?.some(u => u.clerkId === user.id)).map((chat) => (
                <div 
                  key={chat._id} 
                  onClick={() => setSelectedChat(chat)} 
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors group relative ${selectedChat?._id === chat._id ? 'bg-surface-container-high' : 'hover:bg-surface-container-low'}`}
                >
                  <img src={chat.isGroupChat ? '/logo.png' : getSenderPic(user, chat.users) || '/avatars/avatar_female_light.jpg'} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex justify-between items-center w-full">
                      <p className="font-body-md text-on-surface font-medium truncate">
                        {!chat.isGroupChat ? getSender(user, chat.users) : chat.chatName}
                      </p>
                      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => e.stopPropagation()} 
                          className="p-1 rounded-full hover:bg-outline-variant/30 text-on-surface-variant group/menu focus:outline-none"
                        >
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                          <div className="absolute right-0 top-full mt-1 w-36 bg-surface border border-outline-variant/30 rounded-xl shadow-2xl overflow-hidden z-[100] opacity-0 pointer-events-none transition-opacity focus-within:opacity-100 focus-within:pointer-events-auto group-focus-within/menu:opacity-100 group-focus-within/menu:pointer-events-auto">
                            <div onClick={(e) => handleArchiveChat(chat._id, e)} className="w-full flex items-center gap-2 text-left px-3 py-2 font-body-sm hover:bg-surface-container-low transition-colors text-on-surface cursor-pointer">
                              <span className="material-symbols-outlined text-[16px]">archive</span> Archive
                            </div>
                            <div className="h-px w-full bg-outline-variant/30"></div>
                            <div onClick={(e) => handleDeleteChat(chat._id, e)} className="w-full flex items-center gap-2 text-left px-3 py-2 font-body-sm hover:bg-error-container hover:text-error transition-colors text-error cursor-pointer">
                              <span className="material-symbols-outlined text-[16px]">delete</span> Delete
                            </div>
                          </div>
                        </button>
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
                </div>
              ))
            ) : (
              <div className="text-center text-on-surface-variant mt-10 font-body-sm">
                No {activeTab.toLowerCase()} found.
              </div>
            )}
          </div>
        </section>

        {/* Right Panel: Chat Window Canvas */}
        <ChatWindow selectedChat={selectedChat} />
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onUpdate={fetchChats} 
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

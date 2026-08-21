import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import Landing from './pages/Landing';
import ChatHome from './pages/ChatHome';
import Onboarding from './pages/Onboarding';
import AdminLayout from './pages/admin/AdminLayout';
import Overview from './pages/admin/Overview';
import Settings from './pages/admin/Settings';
import Workspaces from './pages/admin/Workspaces';
import Channels from './pages/admin/Channels';
import Events from './pages/admin/Events';

import { Toaster } from 'react-hot-toast';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  const theme = useSelector((state) => state.theme.theme);

  useEffect(() => {
    // Apply dark class to html element based on redux state
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  if (!clerkPubKey) {
    return <div className="p-10 text-red-500">Missing Clerk Publishable Key</div>;
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <div className="min-h-[100dvh] w-full bg-background text-on-surface font-title-sm transition-colors duration-200 flex flex-col">
          <Toaster position="bottom-right" toastOptions={{ className: 'font-body-md text-on-surface bg-surface shadow-ambient border border-outline-variant/30' }} />
          <Routes>
            {/* Landing page doubles as the Login page */}
            <Route path="/" element={<Landing />} />
            
            <Route path="/onboarding" element={
              <>
                <SignedIn>
                  <Onboarding />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/" replace />
                </SignedOut>
              </>
            } />

            <Route path="/admin" element={
              <>
                <SignedIn>
                  <AdminLayout />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/" replace />
                </SignedOut>
              </>
            }>
              <Route index element={<Overview />} />
              <Route path="settings" element={<Settings />} />
              <Route path="workspaces" element={<Workspaces />} />
              <Route path="channels" element={<Channels />} />
              <Route path="events" element={<Events />} />
            </Route>

            <Route path="/chat/*" element={
              <>
                <SignedIn>
                  <ChatHome />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/" replace />
                </SignedOut>
              </>
            } />
          </Routes>
        </div>
      </Router>
    </ClerkProvider>
  );
}

export default App;


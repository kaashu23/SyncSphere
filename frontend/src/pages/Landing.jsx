import { SignIn, useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

export default function Landing() {
  const { isSignedIn, isLoaded } = useUser();

  if (isLoaded && isSignedIn) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-title-sm text-on-surface">
      {/* Navbar */}
      <header className="w-full px-lg md:px-xl py-4 flex justify-between items-center bg-surface-lowest border-b border-outline-variant/30">
        <div className="flex items-center gap-sm">
          <img src="/logo.png" alt="SyncSphere Logo" className="w-8 h-8 object-contain rounded-md" />
          <span className="font-headline-md text-[20px] font-bold text-on-surface tracking-tight">SyncSphere</span>
        </div>
        <nav className="hidden md:flex gap-lg">
          <a href="#features" className="text-on-surface-variant hover:text-primary transition-colors font-medium">Platform</a>
          <a href="#security" className="text-on-surface-variant hover:text-primary transition-colors font-medium">Security</a>
          <a href="#about" className="text-on-surface-variant hover:text-primary transition-colors font-medium">Enterprise</a>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-lg md:px-xl py-12 flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* Left Column: Copy */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 text-primary font-label-caps mb-lg">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            NEXT-GEN COMMUNICATION
          </div>
          
          <h1 className="font-display-lg text-5xl lg:text-6xl font-bold text-on-surface leading-tight mb-md tracking-tight">
            Work flows <br className="hidden lg:block"/>
            <span className="text-primary">in harmony.</span>
          </h1>
          
          <p className="w-full md:w-[600px] max-w-full font-body-md text-body-md text-on-surface-variant mb-xl leading-relaxed">
            Experience real-time messaging, crystal-clear WebRTC calls, and a serene digital workspace designed to eliminate friction and elevate your team's focus.
          </p>
          
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-lg text-on-surface-variant font-body-sm">
            <div className="flex items-center gap-xs"><span className="material-symbols-outlined text-primary">bolt</span> Lightning Fast</div>
            <div className="flex items-center gap-xs"><span className="material-symbols-outlined text-primary">lock</span> Secure E2E</div>
            <div className="flex items-center gap-xs"><span className="material-symbols-outlined text-primary">devices</span> Cross Platform</div>
          </div>
        </div>

        {/* Right Column: Login Card */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
          <div className="w-full max-w-[420px]">
            {/* We use Clerk SignIn and style it exactly to match syncsphere_login/screen.png */}
            <SignIn 
              routing="hash"
              appearance={{
                elements: {
                  card: "bg-surface-container-lowest rounded-xl shadow-ambient p-xl flex flex-col items-center w-full shadow-lg border border-outline-variant/20",
                  headerTitle: "font-headline-md text-headline-md text-on-surface mb-xs",
                  headerSubtitle: "font-body-md text-body-md text-on-surface-variant",
                  logoBox: "w-16 h-16 rounded-lg mb-lg object-contain mx-auto hidden", // Hidden because the landing page already has a logo
                  socialButtonsBlockButton: "w-full flex items-center justify-center gap-sm py-3 px-4 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-fixed mb-lg",
                  socialButtonsBlockButtonText: "font-body-md text-body-md font-medium text-on-surface",
                  dividerRow: "w-full flex items-center gap-md mb-lg",
                  dividerLine: "flex-1 h-px bg-outline-variant opacity-50",
                  dividerText: "font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider",
                  formFieldLabel: "font-label-caps text-label-caps text-on-surface-variant",
                  formFieldInput: "w-full px-3 py-3 bg-transparent border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors duration-200",
                  formButtonPrimary: "w-full bg-primary text-on-primary py-3 rounded-lg font-body-md text-body-md font-medium hover:bg-primary-container transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary mt-sm",
                  footerActionText: "font-body-sm text-body-sm text-on-surface-variant",
                  footerActionLink: "text-primary hover:text-primary-container font-medium transition-colors duration-200",
                  formFieldRow: "mb-sm"
                }
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}



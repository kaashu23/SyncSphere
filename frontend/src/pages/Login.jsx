import { SignIn } from '@clerk/clerk-react';

export default function Login() {
  return (
    <div className="h-full min-h-screen bg-background flex items-center justify-center font-title-sm text-on-surface p-margin-mobile md:p-margin-desktop">
      <main className="w-full max-w-[420px]">
        {/* We use Clerk SignIn but apply the exact tailwind classes from the generated template to its inner elements */}
        <SignIn 
          routing="hash"
          appearance={{
            elements: {
              card: "bg-surface-container-lowest rounded-xl shadow-ambient p-xl flex flex-col w-full shadow-none",
              headerTitle: "font-headline-md text-headline-md text-on-surface mb-xs",
              headerSubtitle: "font-body-md text-body-md text-on-surface-variant",
              logoBox: "w-16 h-16 rounded-lg mb-lg object-contain mx-auto",
              socialButtonsBlockButton: "w-full flex items-center justify-center gap-sm py-3 px-4 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-fixed mb-sm",
              socialButtonsBlockButtonText: "font-body-md text-body-md font-medium text-on-surface",
              dividerRow: "w-full flex items-center gap-md mb-lg",
              dividerLine: "flex-1 h-px bg-outline-variant opacity-50",
              dividerText: "font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider",
              formFieldLabel: "font-label-caps text-label-caps text-on-surface-variant",
              formFieldInput: "w-full px-3 py-3 bg-transparent border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors duration-200",
              formButtonPrimary: "w-full bg-primary text-on-primary py-3 rounded-lg font-body-md text-body-md font-medium hover:bg-primary-container transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
              footerActionText: "font-body-sm text-body-sm text-on-surface-variant",
              footerActionLink: "text-primary hover:text-primary-container font-medium transition-colors duration-200",
              formFieldRow: "mb-sm"
            }
          }}
        />
      </main>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, ShieldCheck, Share, PlusSquare, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is already running in standalone PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleIOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleIOS);

    // Listen for beforeinstallprompt on Chrome / Android / Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Check if user dismissed prompt recently (last 24 hours)
      const dismissedTime = localStorage.getItem('jeevan_setu_pwa_dismissed');
      if (!dismissedTime || Date.now() - Number(dismissedTime) > 24 * 60 * 60 * 1000) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS prompt if on Apple browser and not dismissed
    if (isAppleIOS && !isStandalone) {
      const dismissedTime = localStorage.getItem('jeevan_setu_pwa_dismissed');
      if (!dismissedTime || Date.now() - Number(dismissedTime) > 24 * 60 * 60 * 1000) {
        setShowPrompt(true);
      }
    }

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('jeevan_setu_pwa_dismissed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('[Jeevan Setu PWA] User accepted app installation prompt');
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('jeevan_setu_pwa_dismissed', Date.now().toString());
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[9999] animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-sky-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-sky-950/60 text-white relative overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-emerald-400" />
        
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Close install prompt"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3.5">
          {/* App Logo Badge */}
          <div className="relative shrink-0 mt-0.5">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 p-0.5 shadow-lg shadow-sky-500/20 flex items-center justify-center overflow-hidden">
              <img
                src="/pwa-icon.svg"
                alt="Jeevan Setu App Icon"
                className="h-full w-full object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <ShieldCheck className="h-6 w-6 text-sky-200 absolute" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex-1 pr-6">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm sm:text-base text-white">Install Jeevan Setu App</h4>
              <span className="px-1.5 py-0.5 text-[10px] font-black tracking-wider uppercase bg-sky-500/20 text-sky-400 border border-sky-400/30 rounded">Official</span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Add to your phone for instant emergency SOS, offline GIS maps & fast full-screen access.
            </p>

            {/* Action Buttons */}
            <div className="mt-3.5 flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2 px-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/25 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>{isIOS ? 'Install on iPhone' : 'Install App'}</span>
              </button>
              
              <button
                onClick={handleDismiss}
                className="py-2 px-3 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>

        {/* iOS Helper Modal / Guide */}
        {showIOSGuide && (
          <div className="mt-3.5 pt-3 border-t border-slate-800 text-xs text-slate-300 space-y-2 animate-in fade-in">
            <p className="font-bold text-sky-400 flex items-center gap-1.5">
              <Smartphone className="h-4 w-4" />
              How to Install on iPhone / Safari:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li className="flex items-center gap-1.5">
                1. Tap the <Share className="h-3.5 w-3.5 text-sky-400 inline" /> <strong>Share</strong> button in Safari toolbar.
              </li>
              <li className="flex items-center gap-1.5">
                2. Scroll down & tap <PlusSquare className="h-3.5 w-3.5 text-emerald-400 inline" /> <strong>'Add to Home Screen'</strong>.
              </li>
              <li className="flex items-center gap-1.5">
                3. Tap <strong>'Add'</strong> in top right corner.
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

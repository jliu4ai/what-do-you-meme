
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { authService } from '../services/mockBackend';
import Button from './Button';
import { X, Users } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  joiningRoomCode?: string | null;
}

const AuthModal: React.FC<Props> = ({ isOpen, onClose, onLogin, joiningRoomCode }) => {
  const [loading, setLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  // Safe access to env vars to prevent "Cannot read properties of undefined"
  const CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID;

  // Handle Google Sign In
  useEffect(() => {
    if (isOpen && window.google && CLIENT_ID) {
        try {
            window.google.accounts.id.initialize({
                client_id: CLIENT_ID,
                callback: handleCredentialResponse
            });
            
            if (googleButtonRef.current) {
                window.google.accounts.id.renderButton(
                    googleButtonRef.current,
                    { theme: 'outline', size: 'large', width: '100%' }
                );
            }
        } catch (e) {
            console.error("Google Sign In Error", e);
        }
    }
  }, [isOpen, CLIENT_ID]);

  const handleCredentialResponse = async (response: any) => {
      setLoading(true);
      try {
          const user = await authService.loginWithGoogle(response.credential);
          onLogin(user);
          onClose();
      } catch (e) {
          setError("Google Login Failed. Try Mock Login.");
      } finally {
          setLoading(false);
      }
  };

  const handleMockLogin = async () => {
    setLoading(true);
    try {
      const user = await authService.loginMock();
      onLogin(user);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
            <X />
        </button>
        
        <div className="text-center mb-8">
            {joiningRoomCode ? (
                <div className="flex flex-col items-center gap-2 mb-4">
                    <div className="bg-purple-900/50 p-3 rounded-full text-purple-400 border border-purple-500/50">
                        <Users className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-white">Join Room <span className="text-purple-400">{joiningRoomCode}</span></h2>
                    <p className="text-gray-400 text-sm">Sign in to enter the game lobby.</p>
                </div>
            ) : (
                <>
                    <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                        Welcome Back
                    </h2>
                    <p className="text-gray-400 mt-2">Sign in to save your stats and packs.</p>
                </>
            )}
        </div>

        <div className="space-y-4">
            {/* Real Google Button Container */}
            <div ref={googleButtonRef} className="w-full min-h-[40px] flex justify-center">
                {!CLIENT_ID && <span className="text-xs text-yellow-500 bg-yellow-900/20 px-2 py-1 rounded">Google Login Config Missing (Dev Mode)</span>}
            </div>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-700"></div>
                <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">OR TEST WITH</span>
                <div className="flex-grow border-t border-gray-700"></div>
            </div>

            <Button 
                onClick={handleMockLogin} 
                isLoading={loading}
                variant="secondary"
                className="w-full"
            >
                Guest / Demo Account
            </Button>
        </div>

        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}

        <p className="mt-6 text-xs text-center text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default AuthModal;

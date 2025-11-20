
import React, { useState, useEffect } from 'react';
import { User, Room } from '../types';
import { roomService } from '../services/mockBackend';
import Button from './Button';
import Spinner from './Spinner';
import { Crown, Share2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  user: User;
  onGameStart: (room: Room) => void;
  onBack: () => void;
  initialRoomCode?: string | null;
}

const Lobby: React.FC<Props> = ({ user, onGameStart, onBack, initialRoomCode }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [joinCode, setJoinCode] = useState(initialRoomCode || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCreateOption, setShowCreateOption] = useState(false);

  // Auto-join if code provided via props or prop changes
  useEffect(() => {
    if (initialRoomCode && !room) {
        setJoinCode(initialRoomCode);
        joinRoom(initialRoomCode);
    }
  }, [initialRoomCode]);

  // Polling for room updates
  useEffect(() => {
    if (!room) return;
    
    const interval = setInterval(async () => {
        const updated = await roomService.getRoom(room.id);
        if (updated) {
            setRoom(updated);
            if (updated.status === 'PLAYING') {
                onGameStart(updated);
            }
        }
    }, 2000);

    return () => clearInterval(interval);
  }, [room, onGameStart]);

  const createRoom = async () => {
    setLoading(true);
    try {
        const newRoom = await roomService.createRoom('starter'); // Default theme
        setRoom(newRoom);
        setShowCreateOption(false);
    } catch (e) {
        setError('Failed to create room');
    } finally {
        setLoading(false);
    }
  };

  const createSpecificRoom = async (code: string) => {
    setLoading(true);
    try {
        const newRoom = await roomService.createRoomWithCode(code, 'starter');
        setRoom(newRoom);
        setShowCreateOption(false);
        setError('');
    } catch (e) {
        setError('Failed to create this specific room');
    } finally {
        setLoading(false);
    }
  };

  const joinRoom = async (codeToJoin: string = joinCode) => {
    if (!codeToJoin) return;
    setLoading(true);
    setError('');
    setShowCreateOption(false);

    try {
        const existingRoom = await roomService.joinRoom(codeToJoin.toUpperCase());
        if (existingRoom) {
            setRoom(existingRoom);
        } else {
            setError(`Room ${codeToJoin.toUpperCase()} not found.`);
            // If they used a link/code, offer to create it since it's a mock backend
            setShowCreateOption(true); 
        }
    } catch (e) {
        setError('Failed to join room');
    } finally {
        setLoading(false);
    }
  };

  const handleStartGame = async () => {
      if (room) {
          await roomService.startGame(room.id);
      }
  };

  const copyInviteLink = () => {
      if (!room) return;
      // Ensure clean URL generation
      const url = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  if (room) {
      // Waiting Room View
      return (
        <div className="max-w-2xl mx-auto w-full py-12 px-4">
             <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 text-center animate-in fade-in slide-in-from-bottom-4">
                <div className="mb-8 relative">
                    <p className="text-gray-500 uppercase text-sm font-bold tracking-widest mb-2">Room Code</p>
                    <div className="text-5xl font-mono font-black text-purple-400 tracking-widest flex items-center justify-center gap-4 mb-4">
                        {room.code}
                    </div>
                    
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={copyInviteLink}
                        className="mx-auto bg-gray-800 hover:bg-gray-700 border-gray-600"
                    >
                        {copied ? (
                            <>Copied! <CheckCircle2 className="w-4 h-4 text-green-400" /></>
                        ) : (
                            <>Invite Friends <Share2 className="w-4 h-4" /></>
                        )}
                    </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
                    {room.players.map(p => (
                        <div key={p.id} className="flex flex-col items-center p-4 bg-gray-800 rounded-xl animate-in fade-in zoom-in">
                            <img src={p.avatar} className="w-16 h-16 rounded-full bg-gray-700 mb-2" alt={p.name} />
                            <span className="font-bold flex items-center gap-1">
                                {p.name} {p.isHost && <Crown size={14} className="text-yellow-500" />}
                            </span>
                        </div>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - room.players.length) }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center p-4 border border-dashed border-gray-700 rounded-xl opacity-30">
                            <div className="w-16 h-16 rounded-full bg-gray-800 mb-2"></div>
                            <span className="text-sm">Waiting...</span>
                        </div>
                    ))}
                </div>

                {room.hostId === user.id ? (
                    <Button 
                        onClick={handleStartGame} 
                        className="w-full py-4 text-xl" 
                        disabled={room.players.length < 2}
                    >
                        {room.players.length < 2 ? 'Waiting for players...' : 'Start Game'}
                    </Button>
                ) : (
                    <div className="flex items-center justify-center gap-2 text-gray-400 animate-pulse">
                        <Spinner className="w-5 h-5" /> Waiting for host to start...
                    </div>
                )}
             </div>
        </div>
      );
  }

  // Selection View
  return (
    <div className="max-w-md mx-auto w-full py-12 px-4">
        <div className="flex items-center justify-center mb-8">
             <button onClick={onBack} className="text-gray-500 hover:text-white mr-auto">Back</button>
             <h2 className="text-2xl font-bold mr-auto pr-8">Multiplayer</h2>
        </div>

        <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 p-6 rounded-2xl border border-purple-500/30">
                <h3 className="text-lg font-bold mb-4">Create Room</h3>
                <p className="text-sm text-gray-400 mb-4">Host a game and invite friends.</p>
                <Button onClick={createRoom} isLoading={loading} className="w-full">Host Game</Button>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#111827] text-gray-500">Or join existing</span>
                </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <h3 className="text-lg font-bold mb-4">Join Room</h3>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={joinCode}
                        onChange={(e) => {
                            setJoinCode(e.target.value.toUpperCase());
                            setShowCreateOption(false);
                            setError('');
                        }}
                        placeholder="CODE"
                        className="bg-black border border-gray-700 text-white font-mono text-center text-xl rounded-xl flex-1 p-3 focus:border-purple-500 focus:outline-none"
                        maxLength={6}
                    />
                    <Button onClick={() => joinRoom()} disabled={joinCode.length < 3} isLoading={loading}>Join</Button>
                </div>
                
                {error && (
                    <div className="mt-4 bg-red-900/20 border border-red-900/50 p-3 rounded-xl text-center">
                        <div className="flex items-center justify-center gap-2 text-red-400 text-sm mb-2">
                             <AlertCircle size={16} /> {error}
                        </div>
                        {showCreateOption && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <p className="text-xs text-gray-400 mb-2">
                                    (Since this is a demo, rooms aren't shared across devices)
                                </p>
                                <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    onClick={() => createSpecificRoom(joinCode)}
                                    className="w-full"
                                >
                                    Create Room {joinCode}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Lobby;

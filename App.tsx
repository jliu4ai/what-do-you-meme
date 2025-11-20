
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, GameStatus, CaptionCard, MemeImage, User, Room } from './types';
import { MEME_IMAGES } from './constants';
import { generateUserHand, generateAiMove, judgeRound } from './services/geminiService';
import { authService } from './services/mockBackend';
import Card from './components/Card';
import Button from './components/Button';
import Spinner from './components/Spinner';
import AuthModal from './components/AuthModal';
import ShopModal from './components/ShopModal';
import Lobby from './components/Lobby';
import { Trophy, BrainCircuit, RotateCcw, Sparkles, Share2, Link as LinkIcon, ShoppingBag, Users } from 'lucide-react';

type ViewState = 'HOME' | 'GAME_SOLO' | 'GAME_MULTI' | 'LOBBY';

const App: React.FC = () => {
  // --- App State ---
  const [view, setView] = useState<ViewState>('HOME');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [multiplayerRoom, setMultiplayerRoom] = useState<Room | null>(null);

  // --- Game State (Solo) ---
  const [gameState, setGameState] = useState<GameState>({
    status: GameStatus.IDLE,
    currentImage: null,
    userHand: [],
    selectedCard: null,
    aiCard: null,
    roundResult: null,
    totalUserScore: 0,
    totalAiScore: 0,
    roundCount: 0,
  });

  const [isGeneratingHand, setIsGeneratingHand] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [showCopied, setShowCopied] = useState(false);
  
  // Holds the invite code from URL if any
  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(null);

  // --- Initialization ---
  useEffect(() => {
    // 1. Check Auth
    const user = authService.getCurrentUser();
    if (user) setCurrentUser(user);

    // 2. Check URL Params
    const params = new URLSearchParams(window.location.search);
    
    // Check for Invite Room Code
    const roomCode = params.get('room');
    if (roomCode) {
        console.log("Detected room code:", roomCode);
        setPendingRoomCode(roomCode);
        // If user is logged in, go straight to lobby
        if (user) {
            setView('LOBBY');
        } else {
            // If not logged in, show auth modal immediately so they can join
            setShowAuth(true);
        }
    }

    // Check for Challenge Image (Solo mode)
    const imgId = params.get('img');
    if (imgId) {
      const targetImage = MEME_IMAGES.find(img => img.id === imgId);
      if (targetImage) {
        setChallengeId(imgId);
        setView('GAME_SOLO');
        startGameWithImage(targetImage);
      }
    }
  }, []);

  // Watch for login to redirect to pending room
  useEffect(() => {
      if (currentUser && pendingRoomCode) {
          console.log("User logged in with pending room, going to Lobby...");
          setView('LOBBY');
      }
  }, [currentUser, pendingRoomCode]);

  // --- Actions ---

  const startGameWithImage = async (image: MemeImage) => {
    setGameState(prev => ({
      ...prev,
      status: GameStatus.LOADING_HAND,
      currentImage: image,
      selectedCard: null,
      aiCard: null,
      roundResult: null
    }));
    
    setIsGeneratingHand(true);
    
    // Generate User Hand based on image
    const handTexts = await generateUserHand(image.url);
    
    const newHand: CaptionCard[] = handTexts.map((text, idx) => ({
      id: `user-${Date.now()}-${idx}`,
      text
    }));

    setGameState(prev => ({
      ...prev,
      status: GameStatus.PLAYING,
      userHand: newHand,
      roundCount: prev.roundCount + 1
    }));
    
    setIsGeneratingHand(false);
  };

  const startNewRound = useCallback(async () => {
    if (challengeId) {
        setChallengeId(null);
        window.history.pushState({}, '', window.location.pathname);
    }

    // Pick random image based on unlocked themes
    let pool = MEME_IMAGES;
    if (currentUser) {
        pool = MEME_IMAGES.filter(img => !img.themeId || currentUser.unlockedThemes.includes(img.themeId));
    }
    
    const randomImage = pool[Math.floor(Math.random() * pool.length)];
    startGameWithImage(randomImage);
  }, [challengeId, currentUser]);

  const handleSelectCard = (card: CaptionCard) => {
    if (gameState.status !== GameStatus.PLAYING) return;
    setGameState(prev => ({ ...prev, selectedCard: card }));
  };

  const confirmSelection = async () => {
    if (!gameState.selectedCard || !gameState.currentImage) return;

    setGameState(prev => ({ ...prev, status: GameStatus.CALCULATING_AI }));

    const aiText = await generateAiMove(gameState.currentImage.url);
    const aiCard: CaptionCard = {
      id: `ai-${Date.now()}`,
      text: aiText,
      isAi: true
    };

    setGameState(prev => ({ ...prev, aiCard, status: GameStatus.JUDGING }));

    const result = await judgeRound(gameState.currentImage.url, gameState.selectedCard.text, aiCard.text);
    
    setGameState(prev => ({
      ...prev,
      status: GameStatus.RESULT,
      roundResult: result,
      totalUserScore: result.winner === 'user' ? prev.totalUserScore + 1 : prev.totalUserScore,
      totalAiScore: result.winner === 'ai' ? prev.totalAiScore + 1 : prev.totalAiScore
    }));
  };

  const copyChallengeLink = () => {
    if (!gameState.currentImage) return;
    const url = `${window.location.origin}${window.location.pathname}?img=${gameState.currentImage.id}`;
    navigator.clipboard.writeText(url);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  // --- MultiPlayer Handlers ---
  const handleMultiplayerStart = (room: Room) => {
      setMultiplayerRoom(room);
      setView('GAME_MULTI');
  };

  // --- Render Helpers ---

  const renderHeader = () => (
    <header className="flex items-center justify-between px-6 py-4 bg-gray-900/50 border-b border-gray-800 sticky top-0 z-50 backdrop-blur-md">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('HOME')}>
        <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-2 rounded-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-black tracking-tighter hidden sm:block">
          WHAT DO YOU <span className="text-purple-400">AI</span>?
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        {currentUser ? (
             <div className="flex items-center gap-3 bg-gray-800 py-1 px-2 rounded-full border border-gray-700">
                 <img src={currentUser.avatar} className="w-8 h-8 rounded-full" alt="avatar" />
                 <div className="hidden md:block text-sm pr-2">
                     <p className="font-bold leading-none">{currentUser.name}</p>
                     <p className="text-yellow-500 text-xs font-mono">🪙 {currentUser.coins}</p>
                 </div>
             </div>
        ) : (
            <Button size="sm" variant="ghost" onClick={() => setShowAuth(true)}>
                Login
            </Button>
        )}

        {currentUser && (
             <Button size="sm" variant="gold" onClick={() => setShowShop(true)}>
                <ShoppingBag size={18} />
             </Button>
        )}
      </div>
    </header>
  );

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 animate-in fade-in duration-700">
        <h2 className="text-5xl md:text-7xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-lg">
        Meme Battle Arena
        </h2>
        <p className="text-gray-400 max-w-lg mb-12 text-lg">
        The party game where you battle AI or Friends to create the funniest caption.
        </p>
        
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-xl">
            <div className="flex-1 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 hover:border-purple-500 transition-colors cursor-pointer group" onClick={() => { setView('GAME_SOLO'); startNewRound(); }}>
                <div className="bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <BrainCircuit className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Solo vs AI</h3>
                <p className="text-sm text-gray-500">Challenge Gemini 2.5 Flash directly.</p>
            </div>

            <div className="flex-1 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 hover:border-pink-500 transition-colors cursor-pointer group" 
                 onClick={() => currentUser ? setView('LOBBY') : setShowAuth(true)}>
                <div className="bg-pink-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Multiplayer</h3>
                <p className="text-sm text-gray-500">
                    {pendingRoomCode ? 'Join Invited Game' : 'Create or Join Room'}
                </p>
            </div>
        </div>
    </div>
  );

  const renderGameArea = () => {
    return (
      <div className="flex flex-col items-center gap-6 my-6 w-full max-w-3xl mx-auto px-4 pb-32">
        {/* Challenge Banner */}
        {challengeId && (
            <div className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/50 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Playing a Challenge Round
            </div>
        )}

        {/* The Image */}
        <div className="relative w-full rounded-xl overflow-hidden shadow-2xl border-4 border-gray-800 bg-black group">
           {gameState.currentImage && (
             <img 
               src={gameState.currentImage.url} 
               alt="Meme Context" 
               className="w-full max-h-[50vh] object-contain bg-black"
             />
           )}
           
           {/* Loading Overlay */}
           {(isGeneratingHand || gameState.status === GameStatus.CALCULATING_AI || gameState.status === GameStatus.JUDGING) && (
             <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
               <Spinner className="w-12 h-12 text-purple-500 mb-4" />
               <p className="text-white font-bold animate-pulse text-lg">
                 {isGeneratingHand && "Writing funny captions..."}
                 {gameState.status === GameStatus.CALCULATING_AI && "AI is cooking up a response..."}
                 {gameState.status === GameStatus.JUDGING && "AI Judge is deciding the winner..."}
               </p>
             </div>
           )}
        </div>

        {/* Results View */}
        {gameState.status === GameStatus.RESULT && gameState.roundResult && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-10 duration-500">
             <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    {gameState.roundResult.winner === 'user' ? (
                      <span className="text-green-400 flex items-center gap-2"><Trophy className="w-6 h-6" /> YOU WON!</span>
                    ) : gameState.roundResult.winner === 'ai' ? (
                       <span className="text-red-400 flex items-center gap-2"><BrainCircuit className="w-6 h-6" /> AI WON!</span>
                    ) : (
                      <span className="text-yellow-400">IT'S A TIE!</span>
                    )}
                  </h3>
                  
                  <div className="flex gap-2">
                    <Button 
                        variant="secondary" 
                        onClick={copyChallengeLink} 
                        className="text-sm py-2 bg-gray-700 border-gray-600"
                    >
                        {showCopied ? 'Link Copied!' : 'Challenge Friend'} <Share2 className="w-4 h-4" />
                    </Button>

                    <Button onClick={startNewRound} className="text-sm py-2">
                         Next Meme <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                   <div className={`p-4 rounded-xl border ${gameState.roundResult.winner === 'user' ? 'border-green-500 bg-green-900/20' : 'border-gray-700 bg-gray-900/50'}`}>
                      <p className="text-xs uppercase text-gray-500 font-bold mb-2">Your Caption</p>
                      <p className="text-lg font-medium text-white">{gameState.selectedCard?.text}</p>
                      <p className="mt-2 text-sm font-mono opacity-70 text-green-200">Score: {gameState.roundResult.userScore}/100</p>
                   </div>
                   <div className={`p-4 rounded-xl border ${gameState.roundResult.winner === 'ai' ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 bg-gray-900/50'}`}>
                      <p className="text-xs uppercase text-gray-500 font-bold mb-2">Gemini's Caption</p>
                      <p className="text-lg font-medium text-white">{gameState.aiCard?.text}</p>
                      <p className="mt-2 text-sm font-mono opacity-70 text-purple-200">Score: {gameState.roundResult.aiScore}/100</p>
                   </div>
                </div>

                <div className="bg-black/40 p-4 rounded-lg border-l-4 border-purple-500">
                   <p className="text-purple-300 text-sm font-bold mb-1">JUDGE'S COMMENTARY:</p>
                   <p className="italic text-gray-300">"{gameState.roundResult.commentary}"</p>
                </div>
             </div>
          </div>
        )}

        {/* Player Hand */}
        {(gameState.status === GameStatus.PLAYING || gameState.status === GameStatus.CALCULATING_AI || gameState.status === GameStatus.JUDGING) && (
            <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        Your Cards <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-500">Pick the funniest</span>
                    </h3>
                    <Button 
                        disabled={!gameState.selectedCard || gameState.status !== GameStatus.PLAYING} 
                        onClick={confirmSelection}
                        className="shadow-xl shadow-purple-500/20 px-8"
                    >
                        Play Card
                    </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {gameState.userHand.map((card) => (
                        <Card
                        key={card.id}
                        card={card}
                        isSelected={gameState.selectedCard?.id === card.id}
                        onClick={() => handleSelectCard(card)}
                        disabled={gameState.status !== GameStatus.PLAYING}
                        />
                    ))}
                </div>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#111827] text-white font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden">
      {renderHeader()}
      
      <main className="flex-1 w-full flex flex-col">
        {view === 'HOME' && renderHome()}
        {view === 'GAME_SOLO' && renderGameArea()}
        {view === 'LOBBY' && currentUser && (
            <Lobby 
                user={currentUser} 
                onGameStart={handleMultiplayerStart} 
                onBack={() => setView('HOME')} 
                initialRoomCode={pendingRoomCode}
            />
        )}
        {view === 'GAME_MULTI' && multiplayerRoom && (
            <div className="flex items-center justify-center h-[80vh] flex-col text-center p-8">
                <h2 className="text-3xl font-bold mb-4">Multiplayer Room: {multiplayerRoom.code}</h2>
                <p className="text-gray-400">Multiplayer gameplay is simulated in this demo.</p>
                <Button onClick={() => setView('LOBBY')} className="mt-8">Back to Lobby</Button>
            </div>
        )}
      </main>

      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
        onLogin={setCurrentUser}
        joiningRoomCode={pendingRoomCode}
      />
      
      {currentUser && (
        <ShopModal 
            isOpen={showShop}
            onClose={() => setShowShop(false)}
            user={currentUser}
            onPurchase={() => setCurrentUser({ ...currentUser })} // Force re-render
        />
      )}

      <footer className="py-8 text-center text-gray-600 text-xs border-t border-gray-800/50 mt-auto">
        <p>Powered by Google Gemini 2.5 Flash.</p>
      </footer>
    </div>
  );
};

export default App;

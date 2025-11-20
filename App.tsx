import React, { useState, useEffect, useCallback } from 'react';
import { GameState, GameStatus, CaptionCard, JudgeResult, MemeImage } from './types';
import { MEME_IMAGES } from './constants';
import { generateUserHand, generateAiMove, judgeRound } from './services/geminiService';
import Card from './components/Card';
import Button from './components/Button';
import Spinner from './components/Spinner';
import { Trophy, BrainCircuit, RotateCcw, Sparkles, Share2, Link as LinkIcon } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
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

  // --- Initialization ---
  useEffect(() => {
    // Check for challenge link (e.g., ?img=15)
    const params = new URLSearchParams(window.location.search);
    const imgId = params.get('img');
    if (imgId) {
      const targetImage = MEME_IMAGES.find(img => img.id === imgId);
      if (targetImage) {
        setChallengeId(imgId);
        // Auto start if challenge present
        startGameWithImage(targetImage);
      }
    }
  }, []);

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
    // Clear challenge ID if we are starting a random new round
    if (challengeId) {
        setChallengeId(null);
        window.history.pushState({}, '', window.location.pathname);
    }

    // Pick a random image
    const randomImage = MEME_IMAGES[Math.floor(Math.random() * MEME_IMAGES.length)];
    startGameWithImage(randomImage);
  }, [challengeId]);

  const handleSelectCard = (card: CaptionCard) => {
    if (gameState.status !== GameStatus.PLAYING) return;
    setGameState(prev => ({ ...prev, selectedCard: card }));
  };

  const confirmSelection = async () => {
    if (!gameState.selectedCard || !gameState.currentImage) return;

    // Move to AI Turn
    setGameState(prev => ({ ...prev, status: GameStatus.CALCULATING_AI }));

    // Generate AI Card
    const aiText = await generateAiMove(gameState.currentImage.url);
    const aiCard: CaptionCard = {
      id: `ai-${Date.now()}`,
      text: aiText,
      isAi: true
    };

    setGameState(prev => ({ ...prev, aiCard, status: GameStatus.JUDGING }));

    // Judge the round
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

  // --- Render Helpers ---

  const renderHeader = () => (
    <header className="flex items-center justify-between px-6 py-4 bg-gray-900/50 border-b border-gray-800 sticky top-0 z-50 backdrop-blur-md">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
        <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-2 rounded-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-black tracking-tighter hidden sm:block">
          WHAT DO YOU <span className="text-purple-400">AI</span>?
        </h1>
      </div>
      
      <div className="flex items-center gap-6 text-sm font-bold">
        <div className="flex flex-col items-end">
          <span className="text-gray-400 text-xs">HUMAN</span>
          <span className="text-2xl text-white">{gameState.totalUserScore}</span>
        </div>
        <div className="h-8 w-px bg-gray-700"></div>
        <div className="flex flex-col items-start">
          <span className="text-purple-400 text-xs">GEMINI AI</span>
          <span className="text-2xl text-white">{gameState.totalAiScore}</span>
        </div>
      </div>
    </header>
  );

  const renderHeroArea = () => {
    if (gameState.status === GameStatus.IDLE) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-700">
          <h2 className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Meme Battle Arena
          </h2>
          <p className="text-gray-400 max-w-lg mb-8 text-lg">
            Compete against Gemini AI. 
            <br />
            You pick the caption. The AI picks a caption. 
            <br />
            The AI judges who is funnier.
          </p>
          <Button onClick={startNewRound} className="text-xl px-12 py-4 shadow-purple-500/50 hover:shadow-purple-500/80">
            Start Game
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-6 my-6 w-full max-w-3xl mx-auto px-4">
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
      </div>
    );
  };

  const renderPlayerHand = () => {
    if (gameState.status !== GameStatus.PLAYING && gameState.status !== GameStatus.CALCULATING_AI && gameState.status !== GameStatus.JUDGING) {
        return null;
    }

    return (
      <div className="w-full max-w-6xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            Your Cards <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-500">Pick the funniest</span>
          </h3>
          {gameState.status === GameStatus.PLAYING && (
             <Button 
               disabled={!gameState.selectedCard} 
               onClick={confirmSelection}
               className="shadow-xl shadow-purple-500/20 px-8"
             >
               Play Card
             </Button>
          )}
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
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#111827] text-white font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden">
      {renderHeader()}
      
      <main className="flex-1 w-full flex flex-col">
        {renderHeroArea()}
        {renderPlayerHand()}
      </main>

      {/* Footer / Copyright */}
      <footer className="py-8 text-center text-gray-600 text-xs border-t border-gray-800/50 mt-auto">
        <p>Powered by Google Gemini 2.5 Flash. Images sourced from Unsplash.</p>
        <p className="mt-1 opacity-50">Not affiliated with "What Do You Meme?"™ LLC.</p>
      </footer>
    </div>
  );
};

export default App;

import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, GameState, Question, User, Category } from '../types';
import { fetchQuestions, researchTopic } from '../services/geminiService';
import { audioService } from '../services/audioService';
import { ICONS, GOLD_COLOR, REVELATIONS_QUESTIONS, GAME_MODES } from '../constants';
import Markdown from 'react-markdown';

interface GameViewProps {
  mode: GameMode;
  category?: Category;
  user: User;
  onGameEnd: (stats: { score: number; streak: number; won: boolean; grade: string; message: string }) => void;
  onExit: (stats?: { score: number; streak: number }) => void;
}

const GameView: React.FC<GameViewProps> = ({ mode, category, user, onGameEnd, onExit }) => {
  const [state, setState] = useState<GameState>({
    currentQuestionIndex: 0,
    score: 0,
    correctCount: 0,
    incorrectCount: 0,
    isGameOver: false,
    isWon: false,
    timeLeft: mode === GameMode.TIMED ? 120 : undefined,
    questions: [],
    streak: 0,
    maxStreak: 0,
    selectedOption: null,
    showFeedback: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScorePulsing, setIsScorePulsing] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [researchContent, setResearchContent] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (mode === GameMode.REVELATIONS) {
        // Use static questions for Revelations Challenge
        const shuffled = [...REVELATIONS_QUESTIONS].sort(() => Math.random() - 0.5);
        setState(prev => ({ ...prev, questions: shuffled }));
        setIsLoading(false);
        return;
      }

      let count = 36;
      if (mode === GameMode.TIMED) count = 20;
      if (mode === GameMode.SURVIVAL) count = 50; 
      if (mode === GameMode.UME) count = 100;
      if (mode === GameMode.SSCE) count = 70;
      
      const qs = await fetchQuestions(count, category, 1, mode);
      if (qs.length === 0) throw new Error("No questions were generated. Please try again.");
      
      setState(prev => ({ ...prev, questions: qs }));
    } catch (err: any) {
      console.error("Game load error:", err);
      setError(err.message || "Failed to prepare the arena. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, [mode, category]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    let timer: any;
    if (mode === GameMode.TIMED && state.timeLeft !== undefined && state.timeLeft > 0 && !state.isGameOver) {
      timer = setInterval(() => {
        setState(prev => ({ 
          ...prev, 
          timeLeft: prev.timeLeft ? prev.timeLeft - 1 : 0 
        }));
      }, 1000);
    } else if (mode === GameMode.TIMED && state.timeLeft === 0) {
      endGame();
    }
    return () => clearInterval(timer);
  }, [state.timeLeft, state.isGameOver, mode]);

  const endGame = () => {
    const totalQuestions = state.questions.length;
    const correctCount = state.correctCount;
    const percentage = (correctCount / totalQuestions) * 100;
    
    let grade = '';
    let message = '';
    let soundType: 'trophy' | 'fail' | 'none' = 'none';
    let showConfetti = false;

    if (percentage >= 90) {
      grade = 'EXCELLENT';
      message = 'Outstanding! You are a true master of this arena.';
      soundType = 'trophy';
      showConfetti = true;
    } else if (percentage >= 70) {
      grade = 'VERY GOOD';
      message = 'Impressive work! Your knowledge is vast.';
      soundType = 'trophy';
      showConfetti = true;
    } else if (percentage >= 50) {
      grade = 'GOOD';
      message = 'Good, but need more practice.';
      soundType = 'none';
      showConfetti = false;
    } else if (percentage >= 30) {
      grade = 'FAIR';
      message = 'Do better next time.';
      soundType = 'fail';
      showConfetti = false;
    } else {
      grade = 'FAIL';
      message = 'Do better next time.';
      soundType = 'fail';
      showConfetti = false;
    }

    setState(prev => ({ ...prev, isGameOver: true }));
    
    if (soundType === 'trophy') audioService.playTrophy();
    if (soundType === 'fail') audioService.playFail();

    onGameEnd({ 
      score: state.score, 
      streak: state.maxStreak, 
      won: showConfetti,
      grade,
      message
    });
  };

  const handleOptionClick = (index: number) => {
    if (state.selectedOption !== null || state.isGameOver) return;

    const currentQ = state.questions[state.currentQuestionIndex];
    const isCorrect = index === currentQ.correctAnswer;

    if (isCorrect) {
      audioService.playCorrect();
      setIsScorePulsing(true);
      setTimeout(() => setIsScorePulsing(false), 600);
    } else {
      audioService.playWrong();
    }

    setState(prev => {
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        ...prev,
        selectedOption: index,
        showFeedback: true,
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
        correctCount: isCorrect ? prev.correctCount + 1 : prev.correctCount,
        incorrectCount: !isCorrect ? prev.incorrectCount + 1 : prev.incorrectCount,
        score: isCorrect ? prev.score + 3 : prev.score
      };
    });

    setTimeout(() => {
      if (state.currentQuestionIndex + 1 === state.questions.length) {
        endGame();
      } else {
        setState(prev => ({
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          selectedOption: null,
          showFeedback: false,
        }));
      }
    }, 1500);
  };

  const handleResearch = async () => {
    const currentQ = state.questions[state.currentQuestionIndex];
    if (!currentQ) return;
    
    setIsResearching(true);
    try {
      const content = await researchTopic(currentQ.category || category || 'General Knowledge', currentQ.text);
      setResearchContent(content);
    } catch (error) {
      console.error('Research error:', error);
    } finally {
      setIsResearching(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text(`${mode} - ${category || 'General'}`, 14, 22);
      doc.setFontSize(12);
      doc.text(`Generated by Arkumen Quiz Arena`, 14, 30);
      
      const tableData = state.questions.map((q, i) => [
        i + 1,
        q.text,
        q.options.join(', '),
        q.correctAnswer
      ]);

      autoTable(doc, {
        head: [['#', 'Question', 'Options', 'Correct Answer']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 8 },
        columnStyles: { 1: { cellWidth: 80 } }
      });

      doc.save(`${mode}_${category || 'General'}.pdf`);
    } catch (error) {
      console.error('PDF error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050b18]">
        <div className="w-16 h-16 border-4 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin mb-4"></div>
        <p className="text-[#d4af37] font-cinzel tracking-widest animate-pulse">PREPARING ARENA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050b18] p-6 text-center">
        <ICONS.AlertCircle className="w-16 h-16 text-red-500 mb-6 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
        <h2 className="text-2xl font-cinzel text-white font-bold mb-4">ARENA ERROR</h2>
        <p className="text-gray-400 mb-8 max-w-xs">{error}</p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button 
            onClick={loadQuestions}
            className="w-full py-4 gold-gradient text-slate-900 font-bold rounded-xl shadow-xl hover:scale-105 transition-all transform active:scale-95"
          >
            RETRY CONNECTION
          </button>
          <button 
            onClick={() => onExit()}
            className="w-full py-4 bg-slate-800 text-gray-400 font-bold rounded-xl border border-slate-700 hover:bg-slate-700 transition-all"
          >
            RETURN TO LOBBY
          </button>
        </div>
      </div>
    );
  }

  const getFeedbackMessage = () => {
    const percentage = (state.correctCount / state.questions.length) * 100;
    if (percentage === 100) return { title: "CONGRATULATIONS!", subtitle: "PERFECT CHALLENGE COMPLETED", color: "text-green-400" };
    if (percentage >= 90) return { title: "VERY GOOD!", subtitle: "EXCELLENT PERFORMANCE", color: "text-blue-400" };
    if (percentage >= 70) return { title: "GOOD!", subtitle: "GREAT EFFORT", color: "text-yellow-400" };
    if (percentage >= 50) return { title: "FAIR", subtitle: "KEEP PRACTICING", color: "text-orange-400" };
    return { title: "NOT GOOD", subtitle: "NEED MORE STUDY", color: "text-red-400" };
  };

  const feedback = getFeedbackMessage();

  const currentQ = state.questions[state.currentQuestionIndex];

  return (
    <div className="min-h-screen flex flex-col bg-[#050b18] text-white p-6 pb-24">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={() => onExit({ score: state.score, streak: state.maxStreak })} 
          className="group flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 hover:border-[#d4af37]/50 hover:bg-slate-800/80 transition-all text-xs font-bold text-gray-400 hover:text-[#d4af37]"
        >
          <ICONS.X className="w-4 h-4" />
          SAVE & EXIT
        </button>
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[10px] text-[#d4af37] font-bold tracking-widest uppercase mb-1">
            {mode} Mode • {currentQ.category}
          </span>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 transition-transform duration-300 ${isScorePulsing ? 'scale-110' : 'scale-100'}`}>
              <ICONS.Award className="w-4 h-4 text-[#d4af37]" />
              <span className="font-cinzel text-xl gold-text-gradient">{state.score.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="w-10">
          {mode === GameMode.TIMED && (
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${state.timeLeft && state.timeLeft < 10 ? 'border-red-500 text-red-500 animate-pulse' : 'border-[#d4af37] text-[#d4af37]'}`}>
              {state.timeLeft}
            </div>
          )}
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full mb-8 overflow-hidden relative">
        <div 
          className="h-full bg-[#d4af37] transition-all duration-500 ease-out shadow-[0_0_10px_rgba(212,175,55,0.5)]"
          style={{ width: `${((state.currentQuestionIndex) / state.questions.length) * 100}%` }}
        />
        <div className="absolute top-0 right-0 h-full flex items-center pr-2">
          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">
            {state.currentQuestionIndex + 1} / {state.questions.length}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-2xl mx-auto w-full animate-in fade-in zoom-in duration-300">
        <div className="w-full flex justify-end gap-2 mb-[-2rem] z-10">
          <button 
            onClick={handleResearch}
            disabled={isResearching}
            className="p-2 glass-card rounded-lg border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 transition-all disabled:opacity-50"
            title="Research this topic"
          >
            {isResearching ? <div className="w-4 h-4 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div> : <ICONS.Search className="w-4 h-4" />}
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="p-2 glass-card rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all"
            title="Download PDF"
          >
            <ICONS.Download className="w-4 h-4" />
          </button>
        </div>
        <div className="glass-card w-full p-8 rounded-2xl relative overflow-hidden border border-[#d4af37]/20 shadow-2xl min-h-[160px] flex items-center justify-center">
           <div className="absolute top-0 left-0 w-1 h-full bg-[#d4af37]/40"></div>
           <h2 className="text-xl md:text-2xl font-semibold leading-relaxed text-center">
             {currentQ.text}
           </h2>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-4 w-full">
          {currentQ.options.map((option, idx) => {
            let bgColor = "bg-slate-900/50";
            let borderColor = "border-slate-800";
            let textColor = "text-gray-300";

            if (state.selectedOption === idx) {
              if (idx === currentQ.correctAnswer) {
                bgColor = "bg-green-600/20";
                borderColor = "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                textColor = "text-green-400";
              } else {
                bgColor = "bg-red-600/20";
                borderColor = "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                textColor = "text-red-400";
              }
            } else if (state.showFeedback && idx === currentQ.correctAnswer) {
              bgColor = "bg-green-600/20";
              borderColor = "border-green-500";
              textColor = "text-green-400";
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(idx)}
                disabled={state.selectedOption !== null}
                className={`w-full group relative flex items-center p-5 rounded-xl border-2 transition-all duration-300 transform active:scale-[0.98] ${bgColor} ${borderColor} ${textColor}`}
              >
                <div className={`mr-4 w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 transition-colors font-bold ${state.selectedOption === null ? 'group-hover:bg-[#d4af37] group-hover:text-slate-900' : ''}`}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="flex-1 text-left font-medium">{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Research Modal */}
      {researchContent && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-2xl max-h-[80vh] overflow-y-auto p-8 rounded-2xl border border-[#d4af37]/30 shadow-2xl relative">
            <button 
              onClick={() => setResearchContent(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ICONS.X className="w-6 h-6" />
            </button>
            <div className="prose prose-invert max-w-none">
              <div className="markdown-body">
                <Markdown>{researchContent}</Markdown>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Overlay */}
      {state.isGameOver && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-500">
          <div className="text-center w-full max-w-sm">
            <div className="animate-in zoom-in duration-700">
              <div className="relative inline-block mb-6">
                <ICONS.Trophy className={`w-24 h-24 ${state.isWon ? 'text-[#d4af37] drop-shadow-[0_0_20px_rgba(212,175,55,0.7)]' : 'text-gray-500'}`} />
                {state.isWon && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-lg">
                    <ICONS.CheckCircle2 className="w-6 h-6" />
                  </div>
                )}
              </div>
              <h1 className={`text-4xl font-cinzel font-bold mb-2 ${feedback.color === 'text-green-400' ? 'gold-text-gradient' : feedback.color}`}>
                {feedback.title}
              </h1>
              <p className={`${feedback.color} mb-8 uppercase tracking-[0.3em] text-xs font-bold`}>
                {feedback.subtitle}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="glass-card p-4 rounded-xl border-green-500/30">
                 <div className="text-[10px] text-green-500/70 uppercase font-bold">Correct</div>
                 <div className="text-2xl font-cinzel text-green-400">{state.correctCount}</div>
               </div>
               <div className="glass-card p-4 rounded-xl border-red-500/30">
                 <div className="text-[10px] text-red-500/70 uppercase font-bold">Incorrect</div>
                 <div className="text-2xl font-cinzel text-red-400">{state.incorrectCount}</div>
               </div>
               <div className="glass-card p-4 rounded-xl col-span-2 border-[#d4af37]/30">
                 <div className="text-[10px] text-[#d4af37]/70 uppercase font-bold">Total Score</div>
                 <div className="text-3xl font-cinzel gold-text-gradient font-bold">{state.score.toLocaleString()}</div>
               </div>
            </div>

            <button 
              onClick={() => onExit({ score: state.score, streak: state.maxStreak })}
              className="w-full py-4 gold-gradient text-slate-900 font-bold rounded-xl shadow-xl hover:scale-105 transition-all transform active:scale-95"
            >
              CONTINUE JOURNEY
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameView;

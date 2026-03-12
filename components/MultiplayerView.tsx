import React, { useState, useEffect, useRef } from 'react';
import { User, MultiplayerRoom, Question, MultiplayerPlayer } from '../types';
import { ICONS, GOLD_COLOR } from '../constants';

interface MultiplayerViewProps {
  user: User;
  onExit: () => void;
}

const MultiplayerView: React.FC<MultiplayerViewProps> = ({ user, onExit }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [room, setRoom] = useState<MultiplayerRoom | null>(null);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to multiplayer server');
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);

      switch (message.type) {
        case 'room_update':
          setRoom(message.room);
          break;
        case 'game_start':
          setRoom(message.room);
          setSelectedOption(null);
          setShowFeedback(false);
          break;
        case 'timer_update':
          setRoom(prev => prev ? { ...prev, timer: message.timer } : null);
          break;
        case 'next_question':
          setRoom(message.room);
          setSelectedOption(null);
          setShowFeedback(false);
          break;
        case 'game_over':
          setRoom(message.room);
          break;
        case 'error':
          setError(message.message);
          break;
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from multiplayer server');
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, []);

  const joinRoom = (id: string) => {
    if (!socket || !id) return;
    socket.send(JSON.stringify({
      type: 'join',
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar
      },
      roomId: id
    }));
  };

  const setPlayerReady = () => {
    if (!socket || !room) return;
    socket.send(JSON.stringify({ type: 'ready' }));
    setIsReady(true);
  };

  const submitAnswer = (index: number) => {
    if (!socket || !room || room.status !== 'playing' || selectedOption !== null) return;
    setSelectedOption(index);
    setShowFeedback(true);
    socket.send(JSON.stringify({ type: 'submit_answer', answerIndex: index }));
  };

  if (!socket) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050b18] p-6">
        <div className="w-16 h-16 border-4 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin mb-4"></div>
        <p className="text-[#d4af37] font-cinzel tracking-widest">CONNECTING TO ARENA...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050b18] p-6">
        <div className="w-full max-w-md glass-card p-8 rounded-2xl border border-[#d4af37]/20 text-center">
          <ICONS.Users className="w-16 h-16 text-[#d4af37] mx-auto mb-6" />
          <h2 className="text-2xl font-cinzel gold-text-gradient font-bold mb-2">MULTIPLAYER LOBBY</h2>
          <p className="text-gray-400 text-sm mb-8 uppercase tracking-widest">Join or Create a Battle Room</p>

          <div className="space-y-4">
            <input 
              type="text"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
              placeholder="ENTER ROOM CODE"
              className="w-full bg-slate-900 border border-[#d4af37]/30 rounded-xl px-6 py-4 text-center text-xl font-bold tracking-[0.3em] focus:outline-none focus:border-[#d4af37] transition-all"
            />
            <button 
              onClick={() => joinRoom(roomIdInput)}
              className="w-full py-4 gold-gradient text-slate-900 font-bold rounded-xl shadow-xl hover:scale-105 transition-all transform active:scale-95"
            >
              JOIN ROOM
            </button>
            <button 
              onClick={() => joinRoom(Math.random().toString(36).substring(2, 8).toUpperCase())}
              className="w-full py-4 bg-slate-800 text-gray-400 font-bold rounded-xl border border-slate-700 hover:bg-slate-700 transition-all"
            >
              CREATE NEW ROOM
            </button>
            <button 
              onClick={onExit}
              className="w-full py-2 text-gray-500 text-xs font-bold uppercase hover:text-white transition-colors"
            >
              BACK TO MAIN MENU
            </button>
          </div>

          {error && <p className="mt-4 text-red-500 text-xs font-bold uppercase">{error}</p>}
        </div>
      </div>
    );
  }

  if (room.status === 'waiting' || room.status === 'starting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050b18] p-6">
        <div className="w-full max-w-md glass-card p-8 rounded-2xl border border-[#d4af37]/20">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-cinzel gold-text-gradient font-bold">ROOM: {room.id}</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Waiting for challengers...</p>
            </div>
            <button onClick={onExit} className="text-gray-500 hover:text-white"><ICONS.X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4 mb-8">
            {room.players.map(player => (
              <div key={player.id} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <img src={player.avatar} className="w-10 h-10 rounded-full border border-[#d4af37]/30" alt={player.username} />
                <div className="flex-1">
                  <div className="text-sm font-bold">{player.username} {player.id === user.id && "(YOU)"}</div>
                  <div className={`text-[10px] uppercase font-bold ${player.isReady ? 'text-green-500' : 'text-gray-500'}`}>
                    {player.isReady ? 'READY TO BATTLE' : 'PREPARING...'}
                  </div>
                </div>
                {player.isReady && <ICONS.CheckCircle2 className="w-5 h-5 text-green-500" />}
              </div>
            ))}
            {room.players.length < 2 && (
              <div className="p-4 border-2 border-dashed border-slate-800 rounded-xl text-center text-gray-600 text-xs font-bold uppercase">
                Waiting for at least one more player
              </div>
            )}
          </div>

          {!isReady ? (
            <button 
              onClick={setPlayerReady}
              disabled={room.players.length < 2}
              className={`w-full py-4 font-bold rounded-xl shadow-xl transition-all transform active:scale-95 ${room.players.length < 2 ? 'bg-slate-800 text-gray-600 cursor-not-allowed' : 'gold-gradient text-slate-900 hover:scale-105'}`}
            >
              I AM READY
            </button>
          ) : (
            <div className="text-center py-4 text-[#d4af37] font-bold animate-pulse uppercase tracking-widest text-sm">
              {room.status === 'starting' ? 'BATTLE STARTING...' : 'WAITING FOR OTHERS...'}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (room.status === 'playing') {
    const currentQ = room.questions[room.currentQuestionIndex];
    if (!currentQ) return null;

    return (
      <div className="min-h-screen flex flex-col bg-[#050b18] text-white p-6 pb-24">
        {/* Multiplayer Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex -space-x-2">
            {room.players.map(p => (
              <div key={p.id} className="relative">
                <img 
                  src={p.avatar} 
                  className={`w-10 h-10 rounded-full border-2 ${p.id === user.id ? 'border-[#d4af37]' : 'border-slate-700'}`} 
                  alt={p.username} 
                />
                <div className="absolute -bottom-1 -right-1 bg-slate-900 text-[8px] px-1 rounded border border-slate-700 font-bold">
                  {p.score}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-bold transition-colors ${room.timer < 5 ? 'border-red-500 text-red-500 animate-pulse' : 'border-[#d4af37] text-[#d4af37]'}`}>
              {room.timer}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-gray-500 uppercase font-bold">Question</div>
            <div className="text-sm font-bold text-[#d4af37]">{room.currentQuestionIndex + 1} / {room.questions.length}</div>
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-2xl mx-auto w-full">
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

              if (selectedOption === idx) {
                if (idx === currentQ.correctAnswer) {
                  bgColor = "bg-green-600/20";
                  borderColor = "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                  textColor = "text-green-400";
                } else {
                  bgColor = "bg-red-600/20";
                  borderColor = "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                  textColor = "text-red-400";
                }
              } else if (showFeedback && idx === currentQ.correctAnswer) {
                bgColor = "bg-green-600/20";
                borderColor = "border-green-500";
                textColor = "text-green-400";
              }

              return (
                <button
                  key={idx}
                  onClick={() => submitAnswer(idx)}
                  disabled={selectedOption !== null}
                  className={`w-full group relative flex items-center p-5 rounded-xl border-2 transition-all duration-300 transform active:scale-[0.98] ${bgColor} ${borderColor} ${textColor}`}
                >
                  <div className={`mr-4 w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 transition-colors font-bold ${selectedOption === null ? 'group-hover:bg-[#d4af37] group-hover:text-slate-900' : ''}`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="flex-1 text-left font-medium">{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (room.status === 'finished') {
    const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050b18] p-6">
        <div className="w-full max-w-md glass-card p-8 rounded-2xl border border-[#d4af37]/20 text-center">
          <div className="animate-in zoom-in duration-700">
            <div className="relative inline-block mb-6">
              <ICONS.Trophy className="w-24 h-24 text-[#d4af37] drop-shadow-[0_0_20px_rgba(212,175,55,0.7)]" />
              <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-lg">
                <ICONS.CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <h1 className="text-4xl font-cinzel gold-text-gradient font-bold mb-2">BATTLE ENDED</h1>
            <p className="text-gray-500 mb-8 uppercase tracking-widest text-xs font-bold">Final Rankings</p>
          </div>

          <div className="space-y-4 mb-8">
            {sortedPlayers.map((p, idx) => (
              <div key={p.id} className={`flex items-center gap-4 p-4 rounded-xl border ${idx === 0 ? 'bg-[#d4af37]/10 border-[#d4af37]' : 'bg-slate-900/50 border-slate-800'}`}>
                <div className="w-6 text-xl font-cinzel font-bold text-gray-500">{idx + 1}</div>
                <img src={p.avatar} className="w-10 h-10 rounded-full border border-slate-700" alt={p.username} />
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold">{p.username} {p.id === user.id && "(YOU)"}</div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Score: {p.score}</div>
                </div>
                {idx === 0 && <ICONS.Crown className="w-6 h-6 text-[#d4af37]" />}
              </div>
            ))}
          </div>

          <button 
            onClick={onExit}
            className="w-full py-4 gold-gradient text-slate-900 font-bold rounded-xl shadow-xl hover:scale-105 transition-all transform active:scale-95"
          >
            RETURN TO LOBBY
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default MultiplayerView;

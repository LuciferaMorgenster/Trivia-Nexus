import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  X,
  Radio,
  Sparkles,
  MessageSquare,
  Send,
  AlertCircle,
  HelpCircle,
  Flame,
} from 'lucide-react';
import { HostProfile } from '../types/trivia';
import { LiveAudioPlayer, LiveMicRecorder } from '../utils/pcmAudio';

interface LiveVoiceIntercomProps {
  isOpen: boolean;
  onClose: () => void;
  host: HostProfile;
  currentQuestion?: string;
  score?: number;
}

interface MessageHistoryItem {
  sender: 'user' | 'host';
  text: string;
  time: string;
}

export const LiveVoiceIntercom: React.FC<LiveVoiceIntercomProps> = ({
  isOpen,
  onClose,
  host,
  currentQuestion = '',
  score = 0,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMicActive, setIsMicActive] = useState(true);
  const [isHostSpeaking, setIsHostSpeaking] = useState(false);
  const [hostVolume, setHostVolume] = useState(0);
  const [micVolume, setMicVolume] = useState(0);
  const [statusText, setStatusText] = useState('Connecting to Gemini Live...');
  const [messages, setMessages] = useState<MessageHistoryItem[]>([]);
  const [currentUserTranscript, setCurrentUserTranscript] = useState('');
  const [currentHostTranscript, setCurrentHostTranscript] = useState('');
  const [typedMessage, setTypedMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const playerRef = useRef<LiveAudioPlayer | null>(null);
  const recorderRef = useRef<LiveMicRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentUserTranscript, currentHostTranscript]);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    startLiveSession();

    return () => {
      cleanup();
    };
  }, [isOpen, host.id]);

  const cleanup = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.close();
      playerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsHostSpeaking(false);
  };

  const startLiveSession = async () => {
    setErrorMsg(null);
    setStatusText('Connecting to Gemini 3.8 Live API...');

    try {
      const player = new LiveAudioPlayer();
      player.onVolumeUpdate = (vol) => {
        setHostVolume(vol);
        setIsHostSpeaking(vol > 0.05);
      };
      playerRef.current = player;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live-session`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send initialization payload to configure Gemini Live session with Host Persona
        ws.send(
          JSON.stringify({
            type: 'init',
            hostConfig: {
              hostName: host.name,
              hostTone: host.tone,
              voiceName: host.voiceName,
              currentQuestion,
              score,
            },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === 'ready') {
            setIsConnected(true);
            setStatusText(`Live with ${host.name} via gemini-3.8-live`);
            startMicrophone();
          } else if (payload.type === 'audio') {
            playerRef.current?.queueAudioChunk(payload.data);
          } else if (payload.type === 'transcript_user') {
            setCurrentUserTranscript((prev) => prev + ' ' + payload.text);
          } else if (payload.type === 'transcript_host') {
            setCurrentHostTranscript((prev) => prev + ' ' + payload.text);
          } else if (payload.type === 'turn_complete') {
            // Commit transcripts to history
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setMessages((prev) => {
              const updated = [...prev];
              if (currentUserTranscript.trim()) {
                updated.push({ sender: 'user', text: currentUserTranscript.trim(), time });
              }
              if (currentHostTranscript.trim()) {
                updated.push({ sender: 'host', text: currentHostTranscript.trim(), time });
              }
              return updated;
            });
            setCurrentUserTranscript('');
            setCurrentHostTranscript('');
          } else if (payload.type === 'interrupted') {
            playerRef.current?.interrupt();
            setIsHostSpeaking(false);
          } else if (payload.type === 'error') {
            setErrorMsg(payload.error);
            setStatusText('Connection error');
          }
        } catch (err) {
          console.error('Error handling live message:', err);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket Live Error:', e);
        setErrorMsg('Could not establish connection with Live voice server.');
        setStatusText('Disconnected');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setStatusText('Voice session ended');
      };
    } catch (err: any) {
      console.error('Failed to start Live session:', err);
      setErrorMsg(err.message || 'Microphone or WebSocket failed to initialize.');
    }
  };

  const startMicrophone = async () => {
    try {
      const recorder = new LiveMicRecorder();
      recorder.onVolume = (vol) => setMicVolume(vol);

      await recorder.start((base64Pcm) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isMicActive) {
          wsRef.current.send(
            JSON.stringify({
              type: 'audio',
              data: base64Pcm,
            })
          );
        }
      });

      recorderRef.current = recorder;
    } catch (err: any) {
      console.warn('Microphone access warning:', err);
      setErrorMsg(
        'Microphone permission denied or unavailable. You can still type prompts to the host below!'
      );
    }
  };

  const toggleMic = () => {
    setIsMicActive((prev) => !prev);
  };

  const handleInterruptHost = () => {
    playerRef.current?.interrupt();
    setIsHostSpeaking(false);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', text: '[Contestant interrupted host]' }));
    }
  };

  const handleSendTextPrompt = (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'text',
        text,
      })
    );

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender: 'user', text, time }]);
    setTypedMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="flex h-3 w-3 relative">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base font-display">
                  Live Contestant Intercom
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-xs text-slate-400">{statusText}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Audio Visualizer Stage */}
        <div className="p-6 bg-gradient-to-b from-slate-950 to-slate-900 border-b border-slate-800 flex flex-col items-center shrink-0 relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
              isHostSpeaking
                ? 'opacity-25 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-500'
                : 'opacity-5 bg-indigo-500'
            }`}
          />

          <div className="flex items-center justify-around w-full max-w-md relative z-10">
            {/* User Mic Audio Meter */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
                  isMicActive && micVolume > 0.08
                    ? 'border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/30 scale-105'
                    : 'border-slate-700 bg-slate-800/80 text-slate-400'
                }`}
              >
                {isMicActive ? (
                  <Mic size={24} className={micVolume > 0.08 ? 'text-emerald-400' : 'text-slate-400'} />
                ) : (
                  <MicOff size={24} className="text-rose-400" />
                )}
              </div>
              <span className="text-xs font-semibold text-slate-300">You (16kHz Mic)</span>
              {/* Mic Waveform Bars */}
              <div className="flex items-end gap-1 h-4">
                {[0.2, 0.5, 0.9, 0.4, 0.7].map((bar, i) => (
                  <div
                    key={i}
                    style={{
                      height: `${Math.max(3, Math.min(16, micVolume * bar * 30))}px`,
                    }}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isMicActive && micVolume > 0.05 ? 'bg-emerald-400' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Live Audio Link Indicator */}
            <div className="flex flex-col items-center">
              <div className="p-2.5 rounded-full bg-slate-800/90 border border-slate-700 text-indigo-400 flex items-center justify-center shadow-inner">
                <Radio size={20} className={isConnected ? 'animate-pulse text-indigo-400' : 'text-slate-500'} />
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-1">Real-Time Voice</span>
            </div>

            {/* Host Audio Meter */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
                  isHostSpeaking
                    ? 'border-pink-400 bg-pink-500/20 shadow-lg shadow-pink-500/30 scale-110'
                    : 'border-slate-700 bg-slate-800/80 text-slate-400'
                }`}
              >
                <Volume2
                  size={24}
                  className={isHostSpeaking ? 'text-pink-400 animate-bounce' : 'text-slate-400'}
                />
              </div>
              <span className="text-xs font-semibold text-slate-300">{host.name}</span>
              {/* Host Waveform Bars */}
              <div className="flex items-end gap-1 h-4">
                {[0.3, 0.8, 1.0, 0.6, 0.4].map((bar, i) => (
                  <div
                    key={i}
                    style={{
                      height: `${Math.max(3, Math.min(16, hostVolume * bar * 30))}px`,
                    }}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isHostSpeaking ? 'bg-pink-400' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Quick Voice Controls */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={toggleMic}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isMicActive
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                  : 'bg-rose-600/20 text-rose-300 border-rose-500/40 hover:bg-rose-600/30'
              }`}
            >
              {isMicActive ? <Mic size={14} /> : <MicOff size={14} />}
              <span>{isMicActive ? 'Mute Mic' : 'Unmute Mic'}</span>
            </button>

            {isHostSpeaking && (
              <button
                onClick={handleInterruptHost}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-bold transition-all animate-pulse"
              >
                <span>Interrupt Host</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Conversation Transcript Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {currentQuestion && (
            <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-900/60 text-xs text-indigo-200">
              <span className="font-bold text-indigo-400 block mb-0.5">
                Current Question on Screen:
              </span>
              "{currentQuestion}"
            </div>
          )}

          {messages.length === 0 && !currentUserTranscript && !currentHostTranscript && (
            <div className="text-center py-8 text-slate-500 text-xs">
              <Sparkles size={24} className="mx-auto mb-2 text-indigo-400/60" />
              <p>Speak naturally into your microphone to talk directly to {host.name}!</p>
              <p className="mt-1 text-slate-600">
                Ask for hints, debate the answers, or just banter in real time.
              </p>
            </div>
          )}

          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                m.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="text-[10px] text-slate-500 mb-0.5 px-1">
                {m.sender === 'user' ? 'You' : host.name} • {m.time}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* Real-time Streaming Transcripts */}
          {currentUserTranscript && (
            <div className="flex flex-col items-end">
              <div className="text-[10px] text-emerald-400 mb-0.5 px-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>You speaking...</span>
              </div>
              <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-xs bg-indigo-600/80 text-white italic border border-indigo-400/50">
                {currentUserTranscript}
              </div>
            </div>
          )}

          {currentHostTranscript && (
            <div className="flex flex-col items-start">
              <div className="text-[10px] text-pink-400 mb-0.5 px-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
                <span>{host.name} speaking...</span>
              </div>
              <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-xs bg-slate-800/90 text-slate-100 italic border border-pink-500/40">
                {currentHostTranscript}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Conversation Starters */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">
            Quick Banter:
          </span>
          <button
            onClick={() => handleSendTextPrompt('Give me a sneaky hint for this question!')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs shrink-0 flex items-center gap-1"
          >
            <HelpCircle size={12} />
            <span>Ask for a hint</span>
          </button>
          <button
            onClick={() => handleSendTextPrompt('What do you think of my trivia score so far?')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-pink-300 text-xs shrink-0 flex items-center gap-1"
          >
            <Flame size={12} />
            <span>Roast my score</span>
          </button>
          <button
            onClick={() => handleSendTextPrompt('Is this question a trick question?')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs shrink-0"
          >
            Is this a trick?
          </button>
        </div>

        {/* Text Input Row */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendTextPrompt(typedMessage);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder={`Type a message to ${host.name} or speak above...`}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!typedMessage.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

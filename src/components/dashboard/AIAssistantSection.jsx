import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bot, Send, User, Loader2, AlertCircle, Plus, MessageSquare, X, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { chatWithAI } from '@/services/aiService';

const STORAGE_KEY = 'ai_chat_sessions';
const CURRENT_SESSION_KEY = 'ai_current_session_id';

const quickQuestions = [
  'Nguyên tố H là gì?',
  'Phân tử nước có cấu trúc như thế nào?',
  'Bảng tuần hoàn có bao nhiêu nguyên tố?',
  'Phản ứng hóa học là gì?',
];

const INITIAL_MESSAGE = {
      id: 1,
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI chuyên về hóa học. Tôi có thể giúp bạn:\n\n• Giải thích các khái niệm hóa học\n• Tra cứu thông tin về nguyên tố và phân tử\n• Hướng dẫn giải bài tập\n• Trả lời câu hỏi về bảng tuần hoàn\n\nHãy đặt câu hỏi cho tôi nhé!',
};

// Function to parse markdown and convert to React elements
function parseMarkdown(text) {
  if (!text) return [{ type: 'text', content: '' }];
  
  const parts = [];
  let lastIndex = 0;
  
  // Match **bold** first (to avoid conflict with *italic*)
  const boldRegex = /\*\*([^*]+)\*\*/g;
  const italicRegex = /\*([^*]+)\*/g;
  
  // Find all matches with their positions
  const matches = [];
  
  // Find bold matches
  let match;
  while ((match = boldRegex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'bold',
      content: match[1]
    });
  }
  
  // Find italic matches (only if not inside bold)
  while ((match = italicRegex.exec(text)) !== null) {
    const isInsideBold = matches.some(m => 
      m.type === 'bold' && match.index >= m.start && match.index < m.end
    );
    if (!isInsideBold) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'italic',
        content: match[1]
      });
    }
  }
  
  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);
  
  // Build parts array
  matches.forEach(match => {
    // Add text before match
    if (match.start > lastIndex) {
      parts.push({ 
        type: 'text', 
        content: text.substring(lastIndex, match.start) 
      });
    }
    
    // Add match
    parts.push({
      type: match.type,
      content: match.content
    });
    
    lastIndex = match.end;
  });
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }
  
  // If no matches, return original text
  if (parts.length === 0) {
    return [{ type: 'text', content: text }];
  }
  
  return parts;
}

// Component to render formatted text
function FormattedText({ text }) {
  const parts = parseMarkdown(text);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'bold') {
          return <strong key={index} className="font-bold text-gray-900">{part.content}</strong>;
        } else if (part.type === 'italic') {
          return <em key={index} className="italic text-gray-700">{part.content}</em>;
        } else {
          return <span key={index} className="text-gray-800">{part.content}</span>;
        }
      })}
    </>
  );
}

// Component for fade-in line by line effect
function TypingMessage({ content, isTyping }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const lines = useMemo(() => content.split('\n'), [content]);
  const intervalRef = useRef(null);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isTyping) {
      // Nếu không typing, hiển thị tất cả dòng ngay lập tức
      setVisibleLines(lines.map((_, index) => index));
      currentIndexRef.current = lines.length;
      return;
    }

    // Reset khi bắt đầu typing tin nhắn mới
    // Hiển thị dòng đầu tiên ngay lập tức
    if (lines.length > 0) {
      setVisibleLines([0]);
      currentIndexRef.current = 1;
    } else {
      setVisibleLines([]);
      currentIndexRef.current = 0;
    }

    // Bắt đầu typing animation từ dòng thứ 2
    if (lines.length > 1) {
      intervalRef.current = setInterval(() => {
        if (currentIndexRef.current < lines.length) {
          setVisibleLines(prev => {
            // Thêm dòng mới vào cuối (đã được sort)
            const nextIndex = currentIndexRef.current;
            if (prev.includes(nextIndex)) {
              return prev;
            }
            return [...prev, nextIndex].sort((a, b) => a - b);
          });
          currentIndexRef.current++;
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, 200); // Hiển thị mỗi dòng sau 200ms
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [content, isTyping, lines]);

  return (
    <div className="text-sm whitespace-pre-wrap">
      {lines.map((line, index) => {
        const isVisible = !isTyping || visibleLines.includes(index);
        return (
          <div
            key={index}
            className={`transition-opacity duration-500 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              minHeight: isVisible ? 'auto' : '1.25rem' // Giữ không gian cho dòng trống
            }}
          >
            {line ? <FormattedText text={line} /> : '\u00A0'}
          </div>
        );
      })}
    </div>
  );
}

// Helper functions for localStorage
const getChatSessions = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading chat sessions:', error);
    return [];
  }
};

const saveChatSessions = (sessions) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving chat sessions:', error);
  }
};

const saveCurrentChat = (sessionId, messages, title) => {
  const sessions = getChatSessions();
  const existingIndex = sessions.findIndex(s => s.id === sessionId);
  
  const sessionData = {
    id: sessionId,
    title: title || 'Chat mới',
    messages,
    updatedAt: new Date().toISOString(),
    createdAt: existingIndex >= 0 ? sessions[existingIndex].createdAt : new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    sessions[existingIndex] = sessionData;
  } else {
    sessions.unshift(sessionData);
  }

  // Giữ tối đa 50 sessions
  const limitedSessions = sessions.slice(0, 50);
  saveChatSessions(limitedSessions);
};

// Component for typing effect with cursor
function TypingText({ text, speed = 50, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const cursorIntervalRef = useRef(null);

  useEffect(() => {
    // Reset và chạy typing effect mỗi khi component mount
    setDisplayedText('');
    indexRef.current = 0;
    setIsComplete(false);
    setShowCursor(true);
    
    // Clear existing cursor interval
    if (cursorIntervalRef.current) {
      clearInterval(cursorIntervalRef.current);
    }
    
    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.substring(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        setShowCursor(false);
        // Clear cursor interval when complete
        if (cursorIntervalRef.current) {
          clearInterval(cursorIntervalRef.current);
          cursorIntervalRef.current = null;
        }
        if (onComplete) onComplete();
      }
    }, speed);

    // Cursor blink effect - chỉ khi đang typing
    cursorIntervalRef.current = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    return () => {
      clearInterval(interval);
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
        cursorIntervalRef.current = null;
      }
    };
  }, [text, speed, onComplete]);

  return (
    <span>
      {displayedText}
      {showCursor && !isComplete && <span className="animate-pulse">|</span>}
    </span>
  );
}

function AIAssistantSection() {
  const [currentSessionId, setCurrentSessionId] = useState(() => `session_${Date.now()}`);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState(null);
  const [showScrollDownButton, setShowScrollDownButton] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [showTypingText, setShowTypingText] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);
  const animationPlayedRef = useRef(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messagesRef = useRef(messages);
  const sessionIdRef = useRef(currentSessionId);
  const typingTimerRef = useRef(null);

  // Keep refs updated
  useEffect(() => {
    messagesRef.current = messages;
    sessionIdRef.current = currentSessionId;
  }, [messages, currentSessionId]);

  // Function to save current chat
  const saveCurrentChatToStorage = () => {
    if (messagesRef.current.length > 1) {
      const title = messagesRef.current.find(m => m.role === 'user')?.content?.substring(0, 30) || 'Chat mới';
      saveCurrentChat(sessionIdRef.current, messagesRef.current, title);
      // Save current session ID
      try {
        localStorage.setItem(CURRENT_SESSION_KEY, sessionIdRef.current);
      } catch (error) {
        console.error('Error saving current session ID:', error);
      }
    }
  };

  // Animation for initial state (logo fade-in and typing effect) - chạy lại mỗi khi vào trang
  useEffect(() => {
    const isInitialState = messages.length === 1 && messages[0].role === 'assistant' && messages[0].id === INITIAL_MESSAGE.id;
    
    // Reset states khi component mount
    setShowLogo(false);
    setShowTypingText(false);
    setTypingComplete(false);
    animationPlayedRef.current = false;
    
    if (isInitialState) {
      // Chạy animation khi vào trang
      animationPlayedRef.current = true;
      
      // Show logo after a short delay
      const logoTimer = setTimeout(() => {
        setShowLogo(true);
        // Start typing text after logo appears
        setTimeout(() => {
          setShowTypingText(true);
        }, 300);
      }, 200);
      
      return () => {
        clearTimeout(logoTimer);
        // Reset khi component unmount để animation chạy lại khi quay lại
        animationPlayedRef.current = false;
      };
    } else {
      // Nếu không phải initial state, hiển thị ngay
      setShowLogo(true);
      setShowTypingText(true);
      setTypingComplete(true);
    }
  }, []); // Chỉ chạy khi component mount, không phụ thuộc vào messages

  // Cập nhật UI khi messages thay đổi (nhưng không chạy lại animation)
  useEffect(() => {
    const isInitialState = messages.length === 1 && messages[0].role === 'assistant' && messages[0].id === INITIAL_MESSAGE.id;
    
    // Nếu messages thay đổi và không phải initial state, chỉ cần cập nhật UI
    if (!isInitialState) {
      setShowLogo(true);
      setShowTypingText(true);
      setTypingComplete(true);
    }
    // Nếu là initial state, giữ nguyên animation đang chạy (không làm gì)
  }, [messages]); // Chỉ cập nhật UI khi messages thay đổi

  // Load chat sessions and restore current session on mount
  useEffect(() => {
    const sessions = getChatSessions();
    setChatSessions(sessions);
    
    // Restore current session if exists
    try {
      const savedSessionId = localStorage.getItem(CURRENT_SESSION_KEY);
      if (savedSessionId) {
        const savedSession = sessions.find(s => s.id === savedSessionId);
        if (savedSession && savedSession.messages && savedSession.messages.length > 0) {
          setCurrentSessionId(savedSessionId);
          setMessages(savedSession.messages);
        }
      }
    } catch (error) {
      console.error('Error loading current session:', error);
    }
    
    // Save chat when tab becomes hidden (user switches tab)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveCurrentChatToStorage();
      }
    };
    
    // Save chat before page unload
    const handleBeforeUnload = () => {
      saveCurrentChatToStorage();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Auto-save current chat when component unmounts
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveCurrentChatToStorage();
      // Cleanup typing timer
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    };
  }, []);

  // Auto-save chat when messages change
  useEffect(() => {
    if (messages.length > 1) {
      const title = messages.find(m => m.role === 'user')?.content?.substring(0, 30) || 'Chat mới';
      saveCurrentChat(currentSessionId, messages, title);
      
      // Save current session ID
      try {
        localStorage.setItem(CURRENT_SESSION_KEY, currentSessionId);
      } catch (error) {
        console.error('Error saving current session ID:', error);
      }
      
      // Update sessions list
      const sessions = getChatSessions();
      setChatSessions(sessions);
    }
  }, [messages, currentSessionId]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // Scroll đến cuối nhưng không quá sâu, giữ lại một chút khoảng trống
      const scrollPosition = container.scrollHeight - container.clientHeight;
      container.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Delay nhỏ để đảm bảo DOM đã render xong
    const timer = setTimeout(() => {
    scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, typingMessageId]);

  // Handle scroll to show/hide scroll down button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Show button if not at bottom (with 50px threshold)
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShowScrollDownButton(!isAtBottom && messages.length > 1);
    };

    container.addEventListener('scroll', handleScroll);
    // Check initial state
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [messages]);

  const handleScrollToBottom = () => {
    scrollToBottom();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
    };

    const currentInput = input.trim();
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Lấy lịch sử chat (chỉ lấy các message gần đây để tránh request quá dài)
      const recentHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await chatWithAI(currentInput, recentHistory);
      
      if (response.success) {
        const aiResponseId = Date.now() + 1;
        const aiResponse = {
          id: aiResponseId,
          role: 'assistant',
          content: response.response,
        };
        setMessages((prev) => [...prev, aiResponse]);
        setTypingMessageId(aiResponseId);
        
        // Clear typing state after animation completes
        // Tính thời gian dựa trên số dòng (mỗi dòng 200ms, dòng đầu hiển thị ngay)
        const lines = response.response.split('\n');
        const lineCount = lines.length;
        // Clear previous timer if exists
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
        }
        
        // Dòng đầu hiển thị ngay, các dòng còn lại mỗi dòng 200ms
        const typingDuration = lineCount > 1 ? (lineCount - 1) * 200 + 500 : 500; // Add 500ms buffer
        typingTimerRef.current = setTimeout(() => {
          setTypingMessageId(null);
          typingTimerRef.current = null;
        }, typingDuration);
      } else {
        throw new Error(response.error || 'Không thể nhận phản hồi từ AI');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại.');
      
      // Hiển thị thông báo lỗi trong chat
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.',
      };
      setMessages((prev) => [...prev, errorMessage]);
      setTypingMessageId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInput(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    // Show confirmation dialog
    setShowNewChatDialog(true);
  };

  const confirmNewChat = () => {
    // Save current chat before creating new one
    if (messages.length > 1) {
      const title = messages.find(m => m.role === 'user')?.content?.substring(0, 30) || 'Chat mới';
      saveCurrentChat(currentSessionId, messages, title);
    }
    
    // Create new session
    const newSessionId = `session_${Date.now()}`;
    setCurrentSessionId(newSessionId);
    setMessages([INITIAL_MESSAGE]);
    setInput('');
    setError(null);
    setTypingMessageId(null);
    
    // Save new session ID
    try {
      localStorage.setItem(CURRENT_SESSION_KEY, newSessionId);
    } catch (error) {
      console.error('Error saving current session ID:', error);
    }
    
    // Update sessions list
    const sessions = getChatSessions();
    setChatSessions(sessions);
    
    // Close dialog
    setShowNewChatDialog(false);
  };

  const handleLoadChat = (session) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setError(null);
    setShowChatHistory(false);
    setTypingMessageId(null);
    
    // Save loaded session ID
    try {
      localStorage.setItem(CURRENT_SESSION_KEY, session.id);
    } catch (error) {
      console.error('Error saving current session ID:', error);
    }
  };

  const handleDeleteChat = (sessionId, e) => {
    e.stopPropagation();
    const sessions = getChatSessions().filter(s => s.id !== sessionId);
    saveChatSessions(sessions);
    setChatSessions(sessions);
    
    // If deleting current session, create new one (without confirmation)
    if (sessionId === currentSessionId) {
      // Save current chat before creating new one
      if (messages.length > 1) {
        const title = messages.find(m => m.role === 'user')?.content?.substring(0, 30) || 'Chat mới';
        saveCurrentChat(currentSessionId, messages, title);
      }
      
      // Create new session
      const newSessionId = `session_${Date.now()}`;
      setCurrentSessionId(newSessionId);
      setMessages([INITIAL_MESSAGE]);
      setInput('');
      setError(null);
      setTypingMessageId(null);
      
      // Save new session ID
      try {
        localStorage.setItem(CURRENT_SESSION_KEY, newSessionId);
      } catch (error) {
        console.error('Error saving current session ID:', error);
      }
      
      // Update sessions list
      const updatedSessions = getChatSessions();
      setChatSessions(updatedSessions);
    }
  };

  return (
    <section className="h-full flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
      <div className="mb-2 flex-shrink-0 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Trợ lý AI Hóa học</h2>
        <Button
          variant="default"
          size="sm"
          onClick={handleNewChat}
          className="flex items-center gap-1.5 h-7 px-2 text-xs text-white"
          style={{ backgroundColor: '#1689E4' }}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Chat mới</span>
        </Button>
      </div>

      {/* Chat History Sidebar */}
      {showChatHistory && chatSessions.length > 0 && (
        <Card className="border-2 border-blue-200 mb-2 flex-shrink-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-sm">Lịch sử chat</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChatHistory(false)}
                className="h-5 w-5 p-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleLoadChat(session)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between group ${
                    session.id === currentSessionId
                      ? 'bg-blue-100 border border-blue-300'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {session.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(session.updatedAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(session.id, e)}
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-2 text-red-700 text-xs flex-shrink-0 mb-1.5">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
      </div>
      )}

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gradient-to-br from-blue-100 via-blue-50 to-purple-200 animate-gradient relative">
        {/* Scroll Down Button */}
        {showScrollDownButton && messages.length > 1 && (
          <button
            onClick={handleScrollToBottom}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white/90 transition-all duration-200"
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="h-5 w-5 text-gray-700" />
          </button>
        )}
        <CardContent 
          ref={messagesContainerRef}
          className={`flex-1 min-h-0 ${
            messages.length === 1 && messages[0].role === 'assistant' && messages[0].id === INITIAL_MESSAGE.id
              ? 'overflow-hidden flex items-center justify-center'
              : 'overflow-y-auto p-2 space-y-2 pb-4'
          }`}
        >
          {/* Empty state: Logo and greeting */}
          {messages.length === 1 && messages[0].role === 'assistant' && messages[0].id === INITIAL_MESSAGE.id ? (
            <div className="flex flex-col items-center justify-center">
              <div 
                className={`mb-6 transition-opacity duration-500 ${showLogo ? 'opacity-100' : 'opacity-0'}`}
              >
                <img
                  src="/logorutgon.svg"
                  alt="AR Chemistry Logo"
                  className="h-16 w-auto sm:h-20"
                />
              </div>
              {showTypingText && (
                <p 
                  className="text-gray-700 text-center text-base max-w-md px-4 py-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-200 animate-gradient"
                  style={{ fontFamily: "'Momo Signature', sans-serif", fontWeight: 500 }}
                >
                  {typingComplete ? (
                    "Tôi có thể giúp gì cho bạn?"
                  ) : (
                    <TypingText 
                      text="Tôi có thể giúp gì cho bạn?"
                      speed={80}
                      onComplete={() => setTypingComplete(true)}
                    />
                  )}
                </p>
              )}
            </div>
          ) : (
            messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-1.5 ${
                  message.role === 'user'
                    ? 'text-white'
                    : 'text-gray-800'
                }`}
                style={message.role === 'user' ? { backgroundColor: '#1689E4' } : {}}
              >
                {message.role === 'assistant' ? (
                  <TypingMessage 
                    content={message.content} 
                    isTyping={typingMessageId === message.id}
                  />
                ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          )))
          }
          
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="px-3 py-1.5">
                <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Area */}
        <div className="border-t p-2 flex-shrink-0">
          <div className="flex gap-2 items-center">
            <Input
              type="text"
              placeholder="Nhập câu hỏi về hóa học..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1 rounded-full"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-9 w-9 p-0 rounded-full flex items-center justify-center bg-transparent hover:bg-transparent shadow-none"
              variant="ghost"
            >
              {isLoading ? (
                <Loader2 className="h-10 w-10 animate-spin" />
              ) : (
                <img 
                  src="/icon/send.svg" 
                  alt="Gửi"
                  className="h-10 w-10"
                />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* New Chat Confirmation Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm left-1/2 -translate-x-1/2 p-5">
          <DialogHeader className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center">
              <img 
                src="/icon/add.svg" 
                alt="Tạo mới"
                className="h-12 w-12 object-contain"
              />
            </div>
            <DialogTitle className="text-center text-lg font-semibold text-gray-900">
              Tạo chat mới
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-600">
              Chat hiện tại sẽ được lưu tự động. Bạn có muốn tạo chat mới không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 pt-3">
            <Button 
              variant="outline" 
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 h-10"
              onClick={() => setShowNewChatDialog(false)}
            >
              Hủy
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10"
              onClick={confirmNewChat}
            >
              Tạo mới
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default AIAssistantSection;


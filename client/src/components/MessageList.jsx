import React, { useEffect, useState, useContext, useRef } from 'react';
import { ChatContext } from '../context/ChatContext';

const PAGE_SIZE = 20;
const REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '😮'];

const MessageList = () => {
  const { currentRoom, socket, user } = useContext(ChatContext);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastTimestamp, setLastTimestamp] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const listRef = useRef();

  // Fetch initial messages when room changes
  useEffect(() => {
    setMessages([]);
    setHasMore(true);
    setLastTimestamp(null);
    fetchMessages();
    // eslint-disable-next-line
  }, [currentRoom]);

  // Fetch messages from backend
  const fetchMessages = async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    let url = `/api/messages?room=${encodeURIComponent(currentRoom)}&limit=${PAGE_SIZE}`;
    if (lastTimestamp) {
      url += `&before=${encodeURIComponent(lastTimestamp)}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    if (data.length < PAGE_SIZE) setHasMore(false);
    setMessages((prev) => [...data, ...prev]);
    if (data.length > 0) setLastTimestamp(data[0].timestamp);
    setLoading(false);
  };

  // Listen for new messages and updates
  useEffect(() => {
    const handleReceive = (msg) => {
      if (msg.room === currentRoom) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    const handleReaction = ({ messageId, reactions }) => {
      setMessages((prev) => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
    };
    const handleReadUpdate = ({ messageId, readBy }) => {
      setMessages((prev) => prev.map(m => m.id === messageId ? { ...m, readBy } : m));
    };
    const handleTypingUsers = (users) => {
      setTypingUsers(users);
    };
    socket.on('receive_message', handleReceive);
    socket.on('message_reaction_update', handleReaction);
    socket.on('message_read_update', handleReadUpdate);
    socket.on('typing_users', handleTypingUsers);
    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('message_reaction_update', handleReaction);
      socket.off('message_read_update', handleReadUpdate);
      socket.off('typing_users', handleTypingUsers);
    };
  }, [currentRoom, socket]);

  // Mark messages as read
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.readBy && user && !msg.readBy.includes(user.username)) {
        socket.emit('message_read', { messageId: msg.id, room: currentRoom });
      }
    });
    // eslint-disable-next-line
  }, [messages, user, currentRoom]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle reaction click
  const handleReact = (messageId, reaction) => {
    socket.emit('react_message', { messageId, room: currentRoom, reaction });
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50" ref={listRef}>
      {hasMore && (
        <button onClick={fetchMessages} disabled={loading} className="mb-4 bg-gray-200 rounded px-4 py-1 text-gray-600 hover:bg-gray-300 transition-colors">
          {loading ? 'Loading...' : 'Load more'}
        </button>
      )}
      {messages.map((msg) => {
        const isOwn = user && (msg.sender === user.username || msg.senderId === socket.id);
        return (
          <div
            key={msg.id}
            className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mb-4`}
          >
            <div
              className={`rounded-2xl px-5 py-3 max-w-[70%] shadow ${isOwn ? 'bg-blue-100 text-right' : 'bg-white text-left'}`}
            >
              <span className="font-semibold text-gray-700">{msg.sender}</span>
              <span className="text-xs text-gray-400 ml-2">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              <div className="mt-1 text-gray-800">{msg.message}</div>
              {/* Reactions */}
              <div className="mt-2 flex gap-1">
                {REACTION_EMOJIS.map((emoji) => {
                  const reacted = msg.reactions && msg.reactions[emoji] && user && msg.reactions[emoji].includes(user.username);
                  const count = msg.reactions && msg.reactions[emoji] ? msg.reactions[emoji].length : 0;
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReact(msg.id, emoji)}
                      className={`rounded px-2 py-1 text-lg ${reacted ? 'bg-yellow-200 font-bold' : 'bg-transparent'} hover:bg-yellow-100 transition-colors`}
                    >
                      {emoji} {count > 0 ? count : ''}
                    </button>
                  );
                })}
              </div>
              {/* Read receipts */}
              {msg.readBy && (
                <div className="text-green-600 text-xs mt-1">
                  Read by: {msg.readBy.join(', ')}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="text-blue-600 text-sm mt-2">
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}
    </div>
  );
};

export default MessageList;

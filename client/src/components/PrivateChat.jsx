import React, { useEffect, useState, useContext, useRef } from 'react';
import { ChatContext } from '../context/ChatContext';

const PrivateChat = ({ user: targetUser, onClose }) => {
  const { user, socket } = useContext(ChatContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const listRef = useRef();

  // Listen for private messages
  useEffect(() => {
    const handlePrivate = (msg) => {
      if (
        (msg.senderId === socket.id && msg.receiverId === targetUser.id) ||
        (msg.senderId === targetUser.id && msg.receiverId === socket.id) ||
        (msg.sender === user.username && msg.senderId === socket.id) ||
        (msg.sender === targetUser.username && msg.senderId === targetUser.id)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on('private_message', handlePrivate);
    return () => {
      socket.off('private_message', handlePrivate);
    };
  }, [socket, targetUser, user]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      socket.emit('private_message', { to: targetUser.id, message: input });
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex items-center border-b border-gray-200 px-6 py-3 bg-blue-50">
        <strong className="text-blue-700">Private chat with {targetUser.username}</strong>
        <button onClick={onClose} className="ml-auto px-4 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700">Close</button>
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto px-8 py-6">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-3 ${msg.senderId === socket.id ? 'text-right' : 'text-left'}`}> 
            <span className="font-bold text-gray-700">{msg.sender}:</span> <span className="text-gray-800">{msg.message}</span>
            <span className="text-xs text-gray-400 ml-2">{new Date(msg.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center border-t border-gray-200 px-6 py-3 bg-gray-50">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a private message..."
          className="flex-1 mr-3 px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
        />
        <button onClick={handleSend} className="px-5 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">Send</button>
      </div>
    </div>
  );
};

export default PrivateChat;

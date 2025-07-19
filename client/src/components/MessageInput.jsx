import React, { useState, useContext, useRef, useEffect } from 'react';
import { ChatContext } from '../context/ChatContext';

const MessageInput = () => {
  const { currentRoom, user, socket } = useContext(ChatContext);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState(null); // { messageId, status }
  const typingTimeout = useRef();

  // Send message
  const handleSend = () => {
    if (message.trim()) {
      const msgData = { message, room: currentRoom };
      socket.emit('send_message', msgData);
      setMessage('');
      setDeliveryStatus({ messageId: null, status: 'pending' });
    }
  };

  // Listen for delivery acknowledgment
  useEffect(() => {
    const handleDelivered = ({ messageId, room }) => {
      if (room === currentRoom) {
        setDeliveryStatus({ messageId, status: 'delivered' });
      }
    };
    socket.on('message_delivered', handleDelivered);
    return () => {
      socket.off('message_delivered', handleDelivered);
    };
  }, [currentRoom, socket]);

  // Typing indicator
  useEffect(() => {
    if (isTyping) {
      socket.emit('typing', true);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing', false);
      }, 1500);
    } else {
      socket.emit('typing', false);
    }
    // eslint-disable-next-line
  }, [isTyping]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    setIsTyping(true);
  };

  return (
    <div className="flex items-center border-t border-gray-200 px-4 py-3 bg-gray-50">
      <input
        type="text"
        value={message}
        onChange={handleInputChange}
        placeholder={`Message #${currentRoom}`}
        className="flex-1 mr-3 px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
        onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
      />
      <button onClick={handleSend} className="px-5 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">Send</button>
      {deliveryStatus && (
        <span className={`ml-4 text-sm ${deliveryStatus.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
          {deliveryStatus.status === 'delivered' ? 'Delivered' : 'Sending...'}
        </span>
      )}
    </div>
  );
};

export default MessageInput;

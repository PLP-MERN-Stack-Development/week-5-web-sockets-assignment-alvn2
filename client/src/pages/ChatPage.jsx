import React from 'react';
import { ChatProvider } from '../context/ChatContext';
import ChatRoom from '../components/ChatRoom';

const ChatPage = () => (
  <ChatProvider>
    <ChatRoom />
  </ChatProvider>
);

export default ChatPage;

import React, { createContext, useState } from 'react';
import Login from '../components/Login';
import { socket } from '../socket/socket';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentRoom, setCurrentRoom] = useState('General');

  // Login handler: set user, connect socket, emit user_join
  const login = (username) => {
    setUser({ username });
    socket.connect();
    socket.emit('user_join', username, currentRoom);
  };

  // If not authenticated, show login
  if (!user) {
    return <Login onLogin={login} />;
  }

  return (
    <ChatContext.Provider value={{ user, setUser, currentRoom, setCurrentRoom, socket }}>
      {children}
    </ChatContext.Provider>
  );
};

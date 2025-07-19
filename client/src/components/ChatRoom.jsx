import React, { useState } from 'react';
import RoomList from './RoomList';
import UserList from './UserList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import PrivateChat from './PrivateChat';

const ChatRoom = () => {
  const [privateChatUser, setPrivateChatUser] = useState(null);

  return (
    <div className="flex h-screen bg-gray-900">
      <RoomList />
      <div className="flex flex-col flex-1 bg-white rounded-xl m-4 shadow-lg overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4 font-semibold text-xl tracking-wide rounded-t-xl">
          {privateChatUser ? `Private chat with ${privateChatUser.username}` : 'Room Chat'}
        </div>
        <UserList onPrivateChat={setPrivateChatUser} />
        {privateChatUser ? (
          <PrivateChat user={privateChatUser} onClose={() => setPrivateChatUser(null)} />
        ) : (
          <>
            <MessageList />
            <MessageInput />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;

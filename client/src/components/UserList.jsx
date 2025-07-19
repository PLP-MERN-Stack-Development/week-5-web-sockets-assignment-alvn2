import React, { useEffect, useState, useContext } from 'react';
import { ChatContext } from '../context/ChatContext';

const UserList = ({ onPrivateChat }) => {
  const { currentRoom, socket, user } = useContext(ChatContext);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Listen for user_list events
    const handleUserList = (userList) => {
      setUsers(userList);
    };
    socket.on('user_list', handleUserList);
    // Request user list for current room (by rejoining)
    socket.emit('join_room', currentRoom);
    return () => {
      socket.off('user_list', handleUserList);
    };
  }, [currentRoom, socket]);

  return (
    <div className="border-b border-gray-200 px-6 py-2 bg-gray-50">
      <strong className="text-gray-700">Users in {currentRoom}:</strong>
      <ul className="flex gap-4 mt-1">
        {users.map((u) => (
          <li key={u.id}>
            <button
              disabled={user && u.id === socket.id}
              className={`text-blue-600 underline hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed bg-transparent border-none`}
              onClick={() => user && u.id !== socket.id && onPrivateChat && onPrivateChat(u)}
            >
              {u.username}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;

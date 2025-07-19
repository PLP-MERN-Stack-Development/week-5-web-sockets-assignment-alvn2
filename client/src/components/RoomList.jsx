import React, { useEffect, useState, useContext } from 'react';
import { ChatContext } from '../context/ChatContext';

const RoomList = () => {
  const { currentRoom, setCurrentRoom, socket } = useContext(ChatContext);
  const [rooms, setRooms] = useState(['General']);

  useEffect(() => {
    // Fetch rooms from backend
    fetch('/api/rooms')
      .then(res => res.json())
      .then(setRooms)
      .catch(() => setRooms(['General']));
  }, []);

  const handleRoomChange = (room) => {
    if (room !== currentRoom) {
      socket.emit('join_room', room);
      setCurrentRoom(room);
    }
  };

  return (
    <div className="w-56 bg-gray-100 border-r border-gray-200 p-6 flex flex-col min-h-full">
      <h3 className="text-lg font-bold text-gray-400 mb-4">Rooms</h3>
      <ul className="space-y-2">
        {rooms.map((room) => (
          <li key={room}>
            <button
              className={`w-full px-4 py-2 rounded text-left font-semibold transition-colors ${room === currentRoom ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-blue-100'}`}
              onClick={() => handleRoomChange(room)}
            >
              {room}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoomList;

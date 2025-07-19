// server.js - Main server file for Socket.io chat application

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users, messages, and rooms
const users = {};
const typingUsers = {}; // { roomName: { socketId: username } }

// Predefined rooms
const predefinedRooms = ['General', 'Random', 'Tech'];
// Rooms: { roomName: { name, messages: [], users: Set } }
const rooms = {};
predefinedRooms.forEach((room) => {
  rooms[room] = { name: room, messages: [], users: new Set() };
});

// Helper: ensure room exists
function ensureRoom(roomName) {
  if (!rooms[roomName]) {
    rooms[roomName] = { name: roomName, messages: [], users: new Set() };
  }
}

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Track user's current room
  socket.currentRoom = null;

  // Handle user joining (with optional room)
  socket.on('user_join', (username, roomName = 'General') => {
    users[socket.id] = { username, id: socket.id };
    // Join default or specified room
    ensureRoom(roomName);
    socket.join(roomName);
    socket.currentRoom = roomName;
    rooms[roomName].users.add(socket.id);
    io.to(roomName).emit('user_list', Array.from(rooms[roomName].users).map(id => users[id]));
    io.to(roomName).emit('user_joined', { username, id: socket.id, room: roomName });
    console.log(`${username} joined the chat in room ${roomName}`);
  });

  // Handle joining a different room
  socket.on('join_room', (roomName) => {
    const user = users[socket.id];
    if (!user) return;
    // Leave previous room
    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
      if (rooms[socket.currentRoom]) {
        rooms[socket.currentRoom].users.delete(socket.id);
        io.to(socket.currentRoom).emit('user_left', { username: user.username, id: socket.id, room: socket.currentRoom });
        io.to(socket.currentRoom).emit('user_list', Array.from(rooms[socket.currentRoom].users).map(id => users[id]));
      }
    }
    // Join new room
    ensureRoom(roomName);
    socket.join(roomName);
    socket.currentRoom = roomName;
    rooms[roomName].users.add(socket.id);
    io.to(roomName).emit('user_joined', { username: user.username, id: socket.id, room: roomName });
    io.to(roomName).emit('user_list', Array.from(rooms[roomName].users).map(id => users[id]));
  });

  // Handle leaving a room
  socket.on('leave_room', (roomName) => {
    const user = users[socket.id];
    if (!user || !rooms[roomName]) return;
    socket.leave(roomName);
    rooms[roomName].users.delete(socket.id);
    io.to(roomName).emit('user_left', { username: user.username, id: socket.id, room: roomName });
    io.to(roomName).emit('user_list', Array.from(rooms[roomName].users).map(id => users[id]));
    if (socket.currentRoom === roomName) {
      socket.currentRoom = null;
    }
  });

  // Handle chat messages (room-aware)
  socket.on('send_message', (messageData) => {
    const roomName = messageData.room || socket.currentRoom || 'General';
    ensureRoom(roomName);
    const message = {
      ...messageData,
      id: Date.now(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      room: roomName,
      timestamp: new Date().toISOString(),
      readBy: [], // Track users who have read this message
      reactions: {}, // Track reactions per message
    };
    rooms[roomName].messages.push(message);
    // Limit stored messages per room
    if (rooms[roomName].messages.length > 100) {
      rooms[roomName].messages.shift();
    }
    io.to(roomName).emit('receive_message', message);
    // Delivery acknowledgment: notify sender after broadcast
    socket.emit('message_delivered', { messageId: message.id, room: roomName });
  });

  // Handle typing indicator (room-aware)
  socket.on('typing', (isTyping) => {
    const roomName = socket.currentRoom || 'General';
    ensureRoom(roomName);
    if (!typingUsers[roomName]) typingUsers[roomName] = {};
    const username = users[socket.id]?.username;
    if (username) {
      if (isTyping) {
        typingUsers[roomName][socket.id] = username;
      } else {
        delete typingUsers[roomName][socket.id];
      }
      io.to(roomName).emit('typing_users', Object.values(typingUsers[roomName]));
    }
  });

  // Handle private messages (unchanged)
  socket.on('private_message', ({ to, message }) => {
    const messageData = {
      id: Date.now(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      message,
      timestamp: new Date().toISOString(),
      isPrivate: true,
    };
    socket.to(to).emit('private_message', messageData);
    socket.emit('private_message', messageData);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      // Remove from all rooms
      Object.keys(rooms).forEach((roomName) => {
        if (rooms[roomName].users.has(socket.id)) {
          rooms[roomName].users.delete(socket.id);
          io.to(roomName).emit('user_left', { username: user.username, id: socket.id, room: roomName });
          io.to(roomName).emit('user_list', Array.from(rooms[roomName].users).map(id => users[id]));
        }
        if (typingUsers[roomName]) {
          delete typingUsers[roomName][socket.id];
          io.to(roomName).emit('typing_users', Object.values(typingUsers[roomName]));
        }
      });
      console.log(`${user.username} left the chat`);
    }
    delete users[socket.id];
  });

  // User notifies server they've read a message
  socket.on('message_read', ({ messageId, room }) => {
    ensureRoom(room);
    const user = users[socket.id];
    if (!user) return;
    const msg = rooms[room].messages.find((m) => m.id === messageId);
    if (msg && !msg.readBy.includes(user.id)) {
      msg.readBy.push(user.id);
      // Notify sender if online
      if (msg.senderId && io.sockets.sockets.get(msg.senderId)) {
        io.to(msg.senderId).emit('message_read', { messageId, reader: user });
      }
      // Optionally, notify the room (for UI updates)
      io.to(room).emit('message_read_update', { messageId, readBy: msg.readBy });
    }
  });

  // User reacts to a message
  socket.on('react_message', ({ messageId, room, reaction }) => {
    ensureRoom(room);
    const user = users[socket.id];
    if (!user) return;
    const msg = rooms[room].messages.find((m) => m.id === messageId);
    if (!msg) return;
    if (!msg.reactions[reaction]) msg.reactions[reaction] = [];
    // Toggle reaction: add if not present, remove if present
    const idx = msg.reactions[reaction].indexOf(user.id);
    if (idx === -1) {
      msg.reactions[reaction].push(user.id);
    } else {
      msg.reactions[reaction].splice(idx, 1);
      if (msg.reactions[reaction].length === 0) delete msg.reactions[reaction];
    }
    // Broadcast updated reactions to the room
    io.to(room).emit('message_reaction_update', { messageId, reactions: msg.reactions });
  });
});

// API routes
app.get('/api/rooms', (req, res) => {
  res.json(Object.keys(rooms));
});

app.get('/api/messages', (req, res) => {
  const room = req.query.room || 'General';
  ensureRoom(room);
  let msgs = rooms[room].messages;
  // Pagination: limit and before (timestamp)
  const limit = parseInt(req.query.limit, 10) || 20;
  const before = req.query.before;
  if (before) {
    msgs = msgs.filter(m => new Date(m.timestamp) < new Date(before));
  }
  // Return the most recent messages, newest last
  msgs = msgs.slice(-limit);
  res.json(msgs);
});

app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

// Root route
app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io }; 
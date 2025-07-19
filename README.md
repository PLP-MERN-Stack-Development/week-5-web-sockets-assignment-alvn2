# Real-Time Chat Application

A modern, full-featured real-time chat app built with React, Express, and Socket.io, styled with Tailwind CSS.

## Features
- Real-time messaging with Socket.io
- User authentication (username-based)
- Multiple chat rooms (predefined and custom)
- Private messaging between users
- Typing indicators
- Online/offline user status
- Message reactions (emoji)
- Read receipts
- Message delivery acknowledgment
- Message pagination (load more)
- Responsive, modern UI with Tailwind CSS

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Clone the Repository
```sh
git clone <https://github.com/PLP-MERN-Stack-Development/week-5-web-sockets-assignment-alvn2.git>
cd week-5-web-sockets-assignment-alvn2
```

### 2. Install Server Dependencies
```sh
cd server
npm install
```

### 3. Install Client Dependencies
```sh
cd ../client
npm install
```

### 4. Start the Servers
- **Start the backend:**
  ```sh
  cd ../server
  npm start
  ```
- **Start the frontend:**
  ```sh
  cd ../client
  npm run dev
  ```
- The frontend will be available at [http://localhost:5173](http://localhost:5173)

## Usage
- Enter a username to join the chat.
- Select or create a room to chat in.
- Click on a user to start a private chat.
- Send messages, react with emojis, and see who is typing or online.
- Enjoy a modern, responsive UI!

## Technologies Used
- **Frontend:** React, Vite, Tailwind CSS, socket.io-client
- **Backend:** Express, Socket.io, Node.js


## License
MIT 
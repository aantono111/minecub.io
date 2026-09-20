const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const worldState = {
  players: {},
  edits: []
};

io.on('connection', (socket) => {
  console.log('Jugador conectado:', socket.id);

  socket.on('join', (data) => {
    worldState.players[socket.id] = {
      name: data.name || 'Jugador',
      x: 0, y: 30, z: 0,
      yaw: 0, pitch: 0
    };
    socket.emit('world-sync', worldState.edits.slice(-3000));
    io.emit('player-joined', { id: socket.id, ...worldState.players[socket.id] });
  });

  socket.on('player-move', (pos) => {
    if (worldState.players[socket.id]) {
      Object.assign(worldState.players[socket.id], pos);
      socket.broadcast.emit('player-moved', { id: socket.id, ...pos });
    }
  });

  socket.on('block-edit', (edit) => {
    worldState.edits.push(edit);
    if (worldState.edits.length > 3000) worldState.edits.shift();
    socket.broadcast.emit('block-edit', edit);
  });

  socket.on('disconnect', () => {
    delete worldState.players[socket.id];
    io.emit('player-left', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Servidor minecube.io corriendo en puerto', PORT);
});

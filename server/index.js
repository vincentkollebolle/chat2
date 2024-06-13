const port = '3000'
const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http, {
  cors: {
    origins: ['http://localhost:4200']
  }
})
const users = []

// Quelqu'un rejoint le socket
io.on('connection', (socket) => {
  console.log('User is connected')
  // On lui envoie les utilisateurs présents sur le chat
  io.emit('allUsers', users)
  // Il demande à rejoindre le chat avec un pseudo
  socket.on('newUser', (pseudo) => {
    if (users.includes(pseudo)) {
      pseudo = pseudo + Math.floor(Math.random() * 100) + 1
    }
    // On stock le pseudo sur la session du serveur
    socket.pseudo = pseudo
    // On ajoute l'utilisateur à la liste des utilisateurs présents
    users.push(pseudo)
    io.emit('resUser', true)
    // On envoie un message aux autres utilisateurs avec son pseudo
    io.emit('newUser', { pseudo: pseudo, message: '', status: 1 })
    // On met à jour la liste des utilisateurs présents pour tous le monde
    io.emit('allUsers', users)
  })
  // Il envoie un message
  socket.on('message', (message) => {
    // On envoie le message aux autres utilisateurs avec son pseudo récupéré dans la session du serveur
    io.emit('message', { pseudo: socket.pseudo, message: message, status: 0 })
  })
  // Il se deconnecte mais reste sur la page (socket toujours présent)
  socket.on('logout', (message) => {
    // On le supprime de la liste des utilisateurs
    users.splice(users.indexOf(socket.pseudo), 1)
    // Si le message est vide, on en met un par défaut
    if (!message) { message = 'Kenavo!' }
    // On envoie un message aux autres utilisateurs pour prévenir la déconnexion
    io.emit('logout', { pseudo: socket.pseudo, message: message, status: 2 })
    // On mmet à jour la liste des utilisateurs présents pour tout le monde
    io.emit('allUsers', users)
  })
  // Il quitte le navigateur
  socket.on('disconnect', () => {
    console.log('User is disconnected')
    // On vérifie s'il a oublié de se deconnecter
    if (users.includes(socket.pseudo)) {
      users.splice(users.indexOf(socket.pseudo), 1)
      io.emit('logout', { pseudo: socket.pseudo, message: 'Kenavo!', status: 2 })
      io.emit('allUsers', users)
    }
  })
})

http.listen(port, () => {
  console.log(`listening on port : ${port}`)
})

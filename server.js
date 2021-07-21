const express = require('express');
const http = require('http');
const app = express();
const socketio = require('socket.io');
const port = process.env.PORT || 3000;
const formatMessage = require('./utils/messages');
const {userJoin,getCurrentUser,getRoomUsers,userLeave} = require('./utils/users');

app.use(express.static('./public'));

const server = http.createServer(app);
const io = socketio(server);

//Run when a client connects

const botName = "Chatter"

io.on('connection',socket=>{

    socket.on('JoinRoom',({room,username}) =>{

        const user = userJoin(socket.id,username,room);

        socket.join(user.room)

        socket.emit('message',formatMessage(botName, 'Welcome to Chatter'));


        //Broadcast when a user connect(All clients except the one connected)
        socket.broadcast.to(user.room).emit('message',formatMessage(botName,  `${user.username} has joined the chat`));

        io.to(user.room).emit('roomUsers', {
            room : user.room,
            users : getRoomUsers(user.room)
        })

    });

    
    //Runs when the client disconnect
    socket.on('disconnect',()=>{

        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit('message',formatMessage(botName,`${user.username} has left the Chat`));
            io.to(user.room).emit('roomUsers', {
                room : user.room,
                users : getRoomUsers(user.room)
            })
        }
    })

    
    socket.on('chatMessage',(msg)=>{
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });


});

server.listen(port,()=>{
    console.log(`Listening to port ${port}`);
});
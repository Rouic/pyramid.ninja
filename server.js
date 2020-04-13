/*
    ____                                   __   ____
   / __ \____ _      _____  ________  ____/ /  / __ )__  __
  / /_/ / __ \ | /| / / _ \/ ___/ _ \/ __  /  / __  / / / /
 / ____/ /_/ / |/ |/ /  __/ /  /  __/ /_/ /  / /_/ / /_/ /
/_/    \____/|__/|__/\___\_/   \___/\__,_/  /_____/\__, /
      / __ \____  __  __(_)____                   /____/
     / /_/ / __ \/ / / / / ___/
    / _, _/ /_/ / /_/ / / /__
   /_/ |_|\____/\__,_/_/\___/
   
#####//{  ---pyramid.ninja v1---  }\\#####

Author/s: Alex Cottenham

Contact: hello@rouic.com

A digital version of the popular drinking game "pyramid". Live version can be found at https://pyramid.ninja.

*/

var webPort = 3001; //dev port to run on, will automatically pick up PORT environment variable instead


var fs = require('fs'), 
http = require('http'), 
https = require('https'), 
app = require('express')(),
express = require('express'),
server = require('http').Server(app),
io = require('socket.io'),
async = require('async'),
cookieParser = require('cookie-parser'),
moment = require('moment'),
bodyParser = require('body-parser'),
im = require('imagemagick'),
AvatarGenerator = require('initials-avatar-generator').AvatarGenerator;

console.log("[BOOT] Dependancies loaded...");


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(express.static('/assets'));
app.use(express.static('/bower_components'));
// app.use(express.static('/node_modules'));
app.use(express.static('/app'));

app.use('/assets', express.static('assets'));
app.use('/bower_components', express.static('bower_components'));
app.use('/node_modules', express.static('node_modules'));
app.use('/app', express.static('app'));

app.get('/*',function(req,res,next){
    res.header('X-Powered-By' , 'Rouic'); //Powered by Rouic!
    next();
});

//Unique(ish) Avatar generator using game name with a hash colour
app.get('/avatar/:fullName', function(req, res, next){				
	var matches = req.params.fullName.match(/\b(\w)/g);
	var acronym = matches.join('');	
	var colourName = req.params.fullName;					
	var stringToColour = function(str) {
		var hash = 0;
		for (var i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		var colour = '#';
		for (var i = 0; i < 3; i++) {
		 	var value = (hash >> (i * 8)) & 0xFF;
		    colour += ('00' + value.toString(16)).substr(-2);
		}
		return colour;
	}
	var option = {
	    width: 200,
	    text: acronym,
	    font: 'din',
	    color: stringToColour(colourName)
	};
	var avatarGenerator = new AvatarGenerator();
	avatarGenerator.generate(option, function (image) {
		res.setHeader("content-type", "image/png");
	    image.stream('png').pipe(res);   
    });  
});

app.get('/', function(req, res, next) {
	res.sendFile(__dirname +'/app/index.html');
});

//The 404 Route (ALWAYS Keep this as the last route)
app.get('*', function(req, res){
	console.error("[INFO] 404 Not found: "+req.url);
	res.status(404);
	res.sendFile(__dirname +'/app/error/404.html');
});

var httpServer = http.createServer(app);
// var httpsServer = https.createServer(credentials, app); //uncomment for SSL
// httpsServer.listen(secureWebPort);
httpServer.listen(webPort);
app = httpServer;
console.log("[BOOT] Web server listening on port: "+webPort+"...");

io = io(app); //attatch socket to web server
io.on('connection', function(socket){

	socket.on('leave', function(msg){
   		if(socket.clientOf){
	   		socket.leave(socket.clientOf);	
   			if(io.sockets.adapter.rooms[socket.clientOf]){
				var clients = io.sockets.adapter.rooms[socket.clientOf].sockets;  
				var gameClients = []; 
				for (var clientId in clients ) {
				     var clientSocket = io.sockets.connected[clientId];				
					gameClients.push({name: clientSocket.name, type: clientSocket.type, cards: clientSocket.cards});
				
				}			
				io.to(socket.clientOf).emit('newGameClients', {data: gameClients});
				socket.clientOf = null;	
			}		
   		} else if(socket.hostOf){
	   		socket.leave(socket.hostOf);	
   			io.to(socket.hostOf).emit('hostLeft');
   			socket.hostOf = null;
   		} 		
	});


   socket.on('disconnect', function() {
   		if(socket.type == 'client'){
	   		if(socket.clientOf){
				var gameClients = [];
				if(io.sockets.adapter.rooms[socket.clientOf]){
					var clients = io.sockets.adapter.rooms[socket.clientOf].sockets;   
					for (var clientId in clients ) {
					     var clientSocket = io.sockets.connected[clientId];				
						gameClients.push({name: clientSocket.name, type: clientSocket.type, cards: clientSocket.cards});
					}
					console.log("[INFO] informing host about client changes to "+socket.clientOf);	
					io.to(socket.clientOf).emit('newGameClients', {data: gameClients});	   
				}		
	   		}
   		} else if(socket.type == 'host'){
	   		if(socket.hostOf){
	   			io.to(socket.hostOf).emit('hostLeft');
	   		}
	   	}
   });
   
   socket.on('confirmCall', function(msg){
		if(socket.type == 'client'){
			if(msg.sendingTo){
				io.to(socket.clientOf).emit('roundCall', {playerfrom: socket.name, playerto: msg.sendingTo});
				console.log("[INFO] Sending Round Call From: "+socket.name+" to "+msg.sendingTo);
			}
		}
   });    
   
   socket.on('seenCards', function(msg){
		if(socket.type == 'client'){
			io.to(socket.clientOf).emit('clientCardsSeen', {client: socket.name});
			console.log("[INFO] Client seen cards: "+socket.name);
		}
   }); 
   
   socket.on('callDecision', function(msg){
		if(socket.type == 'client'){
			io.to(socket.clientOf).emit('clientCallDecision', msg);
			console.log("[INFO] Client decision made: "+socket.name);
		}
   });     
   
   	socket.on('transaction_update', function(msg){
	  io.to(msg.room).emit('client_transaction_update', msg);
   });     
   
   	socket.on('gameRound', function(msg){
	   console.log("[INFO] Game round update for "+socket.clientOf);
	   io.to(msg.room).emit('gameRoundUpdate', msg);
    });    
    
   
   socket.on('startGame', function(msg){
   		if(socket.type == 'host'){
   			io.to(socket.hostOf).emit('gameStarted');
   			console.log("[INFO] starting game... "+socket.hostOf);
   		} else if(socket.type == 'client'){
	   		io.to(socket.clientOf).emit('gameStarted');
	   		console.log("[INFO] starting game... "+socket.clientOf);
	   	}
   });


	socket.on('newRoom', function(msg){
		
		var emptyString = "";
		var alphabet = "abcdefghijklmnopqrstuvwxyz";
		
		while (emptyString.length < 4) {
		  emptyString += alphabet[Math.floor(Math.random() * alphabet.length)];
		} 		
		
		var roomPIN = emptyString;
		socket.type = 'host';
		socket.hostOf = roomPIN;
		console.log("[INFO] Creating new host with room code: "+roomPIN);
		socket.emit('newRoomSuccess', {room: roomPIN});
		socket.join(roomPIN);
	});
	
	socket.on('playerSetup', function(msg){
		if(msg.room && msg.players){
			io.to(msg.room).emit('playerSetupData', {data: msg.players});
			socket.emit('playerSetupResponse', {validity: true});
		}
	});
	
	socket.on('joinRoom', function(msg){
		if(msg.room && msg.name){
			
			console.log("[INFO] joining "+msg.name+" to "+msg.room);
			
			if(io.nsps["/"].adapter.rooms[msg.room]){
				
				var clients = io.sockets.adapter.rooms[msg.room].sockets;
				
				var newClientExists = false;
				for (var existingClient in clients ) {
					console.log(io.sockets.connected[existingClient].name, msg.name);
					if(io.sockets.connected[existingClient].name == msg.name) newClientExists = true;
				}
				// if((msg.init && msg.init == true) || newClientExists == false){
				
					socket.type = 'client';
					socket.clientOf = msg.room;
					socket.name = msg.name;
					socket.join(msg.room);
									
					var gameClients = [];
					
					var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;
					socket.emit('joinRoomResponce', {validity: true, num: numClients});
					for (var clientId in clients ) {
					
					     var clientSocket = io.sockets.connected[clientId];
					
						gameClients.push({name: clientSocket.name, type: clientSocket.type, cards: clientSocket.cards});
					
					}			
					console.log("[INFO] informing host about client changes to "+msg.room);
					io.to(msg.room).emit('newGameClients', {data: gameClients});
					
				// } else {
				// 	socket.emit('joinRoomResponce', {validity: false, error: 'duplicate name, pick another!'});
				// }
				
			} else {
				socket.emit('joinRoomResponce', {validity: false, error: 'unknown game code'});
			}
		} else {
			socket.emit('joinRoomResponce', {validity: false, error: 'missing details'});
		}
	});	


		
});
   

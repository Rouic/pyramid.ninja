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
   
#####//{  ---trendsGame v1---  }\\#####

Author/s: Alex Cottenham

Contact: hello@rouic.com
*/

var webPort = 3001;


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
bodyParser = require('body-parser');

console.log("[BOOT] Dependancies loaded...");


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(express.static('/assets'));
app.use(express.static('/bower_components'));
app.use(express.static('/node_modules'));
app.use(express.static('/app'));

app.use('/assets', express.static('assets'));
app.use('/bower_components', express.static('bower_components'));
app.use('/node_modules', express.static('node_modules'));
app.use('/app', express.static('app'));


//Add any headers you want to send with ALL requests here
app.get('/*',function(req,res,next){
    res.header('X-Powered-By' , 'Rouic'); //Powered by Rouic of cource!
    next();
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
// var httpsServer = https.createServer(credentials, app);
// httpsServer.listen(secureWebPort);
httpServer.listen(webPort);
app = httpServer;
console.log("[BOOT] Web server listening on port: "+webPort);

io = io(app);
io.on('connection', function(socket){

	socket.on('leave', function(msg){
						
	   		if(socket.clientOf){
		   		socket.leave(socket.clientOf);	
	   			if(io.sockets.adapter.rooms[socket.clientOf]){
					var clients = io.sockets.adapter.rooms[socket.clientOf].sockets;  
					var gameClients = []; 
					for (var clientId in clients ) {
					     var clientSocket = io.sockets.connected[clientId];				
						gameClients.push({name: clientSocket.name, type: clientSocket.type});
					
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
						gameClients.push({name: clientSocket.name, type: clientSocket.type});
					
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


	socket.on('newRoom', function(msg){
		
		var emptyString = "";
		var alphabet = "abcdefghijklmnopqrstuvwxyz";
		
		while (emptyString.length < 4) {
		  emptyString += alphabet[Math.floor(Math.random() * alphabet.length)];
		} 		
		
		var roomPIN = emptyString;
		socket.type = 'host';
		socket.hostOf = roomPIN;
		console.log("New Room Pin: "+roomPIN);
		console.log("[INFO] Creating new host with room code: "+roomPIN);
		socket.emit('newRoomSuccess', {room: roomPIN});
		socket.join(roomPIN);
	});
	
	socket.on('joinRoom', function(msg){
		if(msg.room && msg.name){
			
			
			console.log("[INFO] joining "+msg.name+" to "+msg.room);
			
			if(io.nsps["/"].adapter.rooms[msg.room]){
				socket.type = 'client';
				socket.clientOf = msg.room;
				socket.name = msg.name;
				socket.join(msg.room);
				socket.emit('joinRoomResponce', {validity: true});
				
				var gameClients = [];
				var clients = io.sockets.adapter.rooms[msg.room].sockets;   
				var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;
				for (var clientId in clients ) {
				
				     var clientSocket = io.sockets.connected[clientId];
// 				     clientSocket.emit('new event', "Updates");
				
					gameClients.push({name: clientSocket.name, type: clientSocket.type});
				
				}			
				console.log("[INFO] informing host about client changes to "+msg.room);
				io.to(msg.room).emit('newGameClients', {data: gameClients});
			} else {
				socket.emit('joinRoomResponce', {validity: false, error: 'unknown game code'});
			}
		} else {
			socket.emit('joinRoomResponce', {validity: false, error: 'missing details'});
		}
	});	


		
});
   

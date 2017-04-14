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
io.on('connection', function(socket){ //waiting for socket connection, on connection, get socket
		console.log("[INFO] A user connected to socket.io!");
		
});
   

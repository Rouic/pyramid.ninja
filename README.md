![pyramid.ninja logo](https://pyramid.ninja/assets/img/pyramid.ninja.png)

# Pyramid.Ninja 🔺
A digital version of the popular drinking game "pyramid". Live version can be found at https://pyramid.ninja.

## How it Works
* Pyramid.ninja uses websockets (socket.io) bridged with a NodeJS server to connect client devices to a single "host" device. The host's screen needs to be seen by all players who join with a random code. Oh, you thought this would explain the actual game? Nah that's a trade secret  😎
* There is no database involved, and all game state information is stored on the host device... until they reload which resets the game and connected clients.
* Find out how to play Pyramid the game at hhttps://pyramid.ninja/#!/about

## Dependancies
* Node 8 (specifically, maybe use `NVM use 8` to get the right one. Others probably work but not tested...)
* Bower

## Install Instructions
* Clone the repo into a lovely folder of your choosing
* Run `npm install` from the source folder to install node modules
* Run `bower install` from the source folder to install bower components
* Run `node server` to start the web server, default port is 3001.
* Navigate to http://localhost:3001 in your favourite websocket supporting browser (anything modern) to see pretty things.

If you can't tell, this thing is still super alpha, so feel free to submit issues and other fun stuff!

Powered By Rouic!
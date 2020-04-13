![pyramid.ninja logo](https://storage.googleapis.com/rouic-storage/pyramid.ninja/logo_dark%404x.png)

# Pyramid.Ninja 🔺
A digital version of the popular drinking game "pyramid". Live version can be found at https://pyramid.ninja.

## How it Works
* Pyramid.ninja uses websockets (socket.io) bridged with a NodeJS server to connect client devices to a single "host" device. The host needs to be seen by all players who join with a random code. Oh, you thought this would explain the actual game? Nah that's a trade secret  😎

## Dependancies
* Node 8 (specifically, maybe use `NVM` to get the right one)
* Bower

## Install Instructions
* Clone the repo into a lovely folder of your choosing
* Run `npm install` from the source folder to install node modules
* Run `bower install` from the source folder to install bower components
* Run `node server` to start the web server, default port is 3001.
* Navigate to http://localhost:3001 to see pretty things.

This thing is still super alpha, so feel free to submit issues and other fun stuff
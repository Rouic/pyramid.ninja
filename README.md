![pyramid.ninja logo](https://pyramid-ninja.web.app/assets/img/pyramid.ninja.png)

# Pyramid.Ninja (v2) 🔺
A digital version of the popular drinking game "pyramid". Live version can be found at https://pyramid.ninja.

## How it Works
* Pyramid.ninja is powered by Firebase and uses Firestore to hold and sync game data across devices. A host's screen should be seen by all players who join with a random generated game code.
* Firebase uses anonymous accounts but could be extended with login and history.
* Find out how to play Pyramid the game at https://pyramid.ninja/about

## Dependancies
* Webpack
* Firebase
* Node > 10

## Install Instructions
* You will need an active Firebase project to deploy to. It's also recommended to have a local Firebase environment setup for testing, this project relies upon Firestore.
* Clone the repo into a lovely folder of your choosing.
* Run `npm install` from the `root` folder and `functions` folder to install relevant node modules.
* Run `webpack` or `npm run build` to package and populate the `dist` folder.
* Run `firebase serve` to start a local server, the default port is 5000.
* Navigate to http://localhost:5000 in your favourite modern browser to see pretty things.


If you can't tell, this thing is a bit beta, so feel free to submit issues and other fun stuff!

Powered by Rouic! www.rouic.com

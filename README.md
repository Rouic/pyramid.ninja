![pyramid.ninja logo](https://pyramid-ninja.web.app/assets/img/pyramid.ninja.png)

# Pyramid.Ninja (v2) 🔺
A digital version of the popular drinking game "pyramid". Live version can be found at https://pyramid.ninja.

## How it Works
* Pyramid.ninja is powered by Firebase and uses Firestore to hold values across devices. The host's screen should be seen by all players who join with a random code. Oh, you thought this would explain the actual game? Nah that's a trade secret  😎
* Firebase uses anonymous accounts but could be extended with login and history.
* Find out how to play Pyramid the game at https://pyramid.ninja/#!/about

## Dependancies
* Firebase
* Bower
* Node > 8

## Install Instructions
* First you need an active Firebase project and account to deploy to - a free one will work fine. It's also recommended to have a local Firebase environment setup for testing.
* Clone the repo into a lovely folder of your choosing.
* Run `bower install` from the public folder to install public bower components.
* Run `npm install` from the functions folder to install node modules for Firebase functions.
* Run `firebase serve` to start the local server, default port is 5000.
* Navigate to http://localhost:5000 in your favourite modern browser to see pretty things.



If you can't tell, this thing is a bit beta, so feel free to submit issues and other fun stuff!

Powered By Rouic! www.rouic.com

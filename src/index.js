import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/material-kit.css';
import './assets/css/style.css';

import 'bootstrap';
import angular from 'angular';
import uirouter from 'angular-ui-router';
import ngCookies from 'angular-cookies';

import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/performance';
import 'firebase/analytics';
import 'firebase/firestore';

import './assets/js/material.min.js';
import './assets/js/material-kit.js';
import Deck from './assets/js/deck.js';

/* Firebase config start */
const firebaseConfig = {
  apiKey: "AIzaSyDyk-FE8w0yd82WduMP6KVmvRPt0-4miS8",
  authDomain: "pyramid-ninja.firebaseapp.com",
  databaseURL: "https://pyramid-ninja.firebaseio.com",
  projectId: "pyramid-ninja",
  storageBucket: "pyramid-ninja.appspot.com",
  messagingSenderId: "668178102663",
  appId: "1:668178102663:web:bc247d167d2cab96adfb22",
  measurementId: "G-VCPEBG1XK7"
};
firebase.default.initializeApp(firebaseConfig);
global.perf = firebase.default.performance();
global.analytics = firebase.default.analytics();
global.db = firebase.default.firestore();
global.auth = firebase.default.auth();
global.firebaseAll = firebase.default;
/* Firebase config end */

global.Deck = Deck();

global.Pyramid = angular.module('Pyramid', [uirouter, ngCookies]);
global.currentGame = null;
global.canContinue = false;
Pyramid.controller('root', ['$state', '$scope', '$rootScope', '$stateParams', function($state, $scope, $rootScope, $stateParams){
  
	$rootScope.randomBackground = Math.floor(Math.random() * 10) + 1;
	if(!window.__prerender){
			auth.signInAnonymously().catch(function(error) {
		  var errorCode = error.code;
		  var errorMessage = error.message;
		  console.log(error);
		});    
		auth.onAuthStateChanged(function(user) {
		  if (user) {
			var isAnonymous = user.isAnonymous;
			$rootScope.user_uid = user.uid;
		  } else {
			$rootScope.user_uid = null;
		  }
		});  
		$rootScope.soundEffect = new Audio();
	}
}]);

Pyramid.controller('header', ['$state', '$scope', '$rootScope', '$stateParams', function($state, $scope, $rootScope, $stateParams){}]);

Pyramid.controller('start', ['$state', '$scope', '$rootScope', '$stateParams', '$timeout', function($state, $scope, $rootScope, $stateParams, $timeout){
	$rootScope.pageClass = 'signup-page';
	$.material.init();
	if(currentGame){
		currentGame = null;
		canContinue = false;
	}
	if(!window.__prerender) analytics.logEvent('ViewedSplash');
	const event = new Event('render-ready');
	document.dispatchEvent(event);
  
}]);

Pyramid.controller('about', ['$state', '$scope', '$rootScope', '$stateParams', function($state, $scope, $rootScope, $stateParams){
	$rootScope.pageClass = 'about-us';
	$.material.init();
	const event = new Event('render-ready');
	document.dispatchEvent(event);
}]);

import './controllers/app.controllers.host';
import './controllers/app.controllers.client';
import './controllers/app.controllers.join';
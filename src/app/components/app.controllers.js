Pyramid.controller('root', ['$state', '$scope', '$rootScope', '$stateParams', function($state, $scope, $rootScope, $stateParams){
  
	$rootScope.randomBackground = Math.floor(Math.random() * 10) + 1;
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
}]);

Pyramid.controller('header', ['$state', '$scope', '$rootScope', '$stateParams', function($state, $scope, $rootScope, $stateParams){}]);

Pyramid.controller('start', ['$state', '$scope', '$rootScope', '$stateParams', '$timeout', function($state, $scope, $rootScope, $stateParams, $timeout){
	$rootScope.pageClass = 'signup-page';
	$.material.init();
	if(currentGame){
		currentGame = null;
		canContinue = false;
	}
	analytics.logEvent('ViewedSplash');
	
  
}]);

Pyramid.controller('about', ['$state', '$scope', '$rootScope', '$stateParams', function($state, $scope, $rootScope, $stateParams){
	$rootScope.pageClass = 'about-us';
	$.material.init();
}]);

Pyramid.controller('privacy', ['$state', '$scope', '$rootScope', '$stateParams', function($state, $scope, $rootScope, $stateParams){
  $rootScope.pageClass = 'about-us';
	$.material.init();
	$timeout(function(){
	  (function (w,d) {var loader = function () {var s = d.createElement("script"), tag = d.getElementsByTagName("script")[0]; s.src="https://cdn.iubenda.com/iubenda.js"; tag.parentNode.insertBefore(s,tag);}; if(w.addEventListener){w.addEventListener("load", loader, false);}else if(w.attachEvent){w.attachEvent("onload", loader);}else{w.onload = loader;}})(window, document);
	});
}]);

import './controllers/app.controllers.host';
import './controllers/app.controllers.client';
import './controllers/app.controllers.join';
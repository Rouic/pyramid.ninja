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

#####//{  ---Pyramid.Ninja---  }\\#####

Author/s: Alex Cottenham (alex@rouic.com)

Contact: hello@rouic.com

*/

Pyramid.run(['$window', '$rootScope', '$state', '$stateParams', '$transitions', function($window, $rootScope, $state, $stateParams, $transitions){
	$rootScope.$state = $state;
	$rootScope.$stateParams = $stateParams;
  
  $rootScope.year = new Date().getFullYear();
	
	$rootScope.goBack = function(){
    	$window.history.back();
	};	
	
  $transitions.onSuccess({}, function($transition){
    $rootScope.title = '| '+ $state.current.title || 'Unknown Page';
  });		
	
}]);
Pyramid.directive('onSizeChanged', ['$window', function ($window) {
    return {
        restrict: 'A',
        scope: {
            onSizeChanged: '&'
        },
        link: function (scope, $element, attr) {
            var element = $element[0];

            cacheElementSize(scope, element);
            $window.addEventListener('resize', onWindowResize);

            function cacheElementSize(scope, element) {
                scope.cachedElementWidth = element.offsetWidth;
                scope.cachedElementHeight = element.offsetHeight;
            }

            function onWindowResize() {
                var isSizeChanged = scope.cachedElementWidth != element.offsetWidth || scope.cachedElementHeight != element.offsetHeight;
                if (isSizeChanged) {
                    var expression = scope.onSizeChanged();
                    expression();
                }
            };
        }
    }
}]);
Pyramid.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function($stateProvider, $urlRouterProvider, $locationProvider) { 
    
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && !window.MSStream) {
	    $urlRouterProvider.otherwise('/join');
    } else {
	    $urlRouterProvider.otherwise('/');
    }
    
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
    $locationProvider.hashPrefix('!');        
    
    $stateProvider   
  	.state('root', {
  	    views: {
  		    '@' : {
   			    templateUrl: '/templates/layout.html',
   			    controller: 'root',
  		    },
  		    'header': {
  			    templateUrl: '/templates/header.html',
  			    controller: 'header'
  		    }
  	    }
  	})	                
    .state('start', {
 	    parent: 'root',
 	    title: 'Online version of the drinking card game.',
        url: '/',
        views: {
	        'view': {
 		        templateUrl: '/templates/start.html',
		        controller: 'start'
		    }
        }     
    })
    .state('host', {
 	    parent: 'root',
 	    title: 'Host',
        url: '/host',
        views: {
	        'view': {
 		        templateUrl: '/templates/host.html',
		        controller: 'host'
		    }
        }     
    })
    .state('join', {
 	    parent: 'root',
 	    title: 'Join',
        url: '/join',
        views: {
	        'view': {
 		        templateUrl: '/templates/join.html',
		        controller: 'join'
		    }
        }     
    })    
    .state('game', {
 	    parent: 'root',
        url: '/game/:gameID?',
        views: {
	        'view': {
 		        templateUrl: '/templates/game.html',
		        controller: 'game'
		    }
        },
	 	    title: ['$stateParams', function($stateParams){
		 	    return 'Game '+$stateParams.gameID.toUpperCase();
		 	  }],
        params: {
          itemList: {
            showContinue: null
          }
        }        
    })      
    .state('privacy', {
       parent: 'root',
       title: 'Privacy',
        url: '/privacy',
        views: {
          'view': {
             templateUrl: '/templates/privacy.html',
            controller: 'privacy'
        }
        }    
    }) 
    .state('about', {
 	    parent: 'root',
 	    title: 'About',
        url: '/about',
        views: {
	        'view': {
 		        templateUrl: '/templates/about.html',
		        controller: 'about'
		    }
        }      
    });    
  
}]);

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

Pyramid.controller('join', ['$cookies', '$state', '$scope','$rootScope', '$stateParams', function($cookies, $state, $scope, $rootScope, $stateParams){
	$rootScope.pageClass = 'signup-page';
	$.material.init();	
	
	$scope.join = {};
	
	$scope.joinGame = function(){
		if($scope.join.roomcode && $scope.join.name){
            
            db.collection("games").doc($scope.join.roomcode.toUpperCase()).set({
                [$rootScope.user_uid]: {
                    admin: true,
                    uid: $rootScope.user_uid,
                    name: $scope.join.name.toUpperCase(),
                    drinks: 0
                }
            }, {merge: true})
            .then(function() {
                console.log("Player data successfully written!");
                currentGame = $scope.join.roomcode;
                $cookies.put('name', $scope.join.name.toUpperCase());
                $rootScope.soundEffect.play();
                $state.go('game', {gameID: $scope.join.roomcode, showContinue: true});
            })
            .catch(function(error) {
                $scope.joinError = error;
                console.error("Error writing game: ", error);
		    });                

		} else {
			$scope.joinError = 'Name or Code cannot be empty.'
		}	
	};
	
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
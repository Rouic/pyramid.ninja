var Pyramid = angular.module('Pyramid', ['ui.router', 'ngCookies']);
var socket = io();
var currentGame = null;
var canContinue = false;

Pyramid.run(['$window', '$rootScope', '$state', '$stateParams', function($window, $rootScope, $state, $stateParams){
	$rootScope.$state = $state;
	$rootScope.$stateParams = $stateParams;	
	
	$rootScope.goBack = function(){
    	$window.history.back();
	};	
	
	socket.on('connect', function(){
	    $rootScope.socketID = socket.io.engine.id;
	});
	
    $rootScope.$on('$stateChangeSuccess', function (event, current, previous) {       
        $rootScope.title = '| '+$state.current.title || 'Pyramid.Ninja';
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
Pyramid.config(function($stateProvider, $urlRouterProvider) { 
    
    if(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream){
	    $urlRouterProvider.otherwise('/join');
    } else {
	    $urlRouterProvider.otherwise('/start');
    }     
    
    $stateProvider   
	.state('root', {
	    views: {
		    '@' : {
 			    templateUrl: 'app/templates/layout.html',
 			    controller: 'root',
		    },
		    'header': {
			    templateUrl: 'app/templates/header.html',
			    controller: 'header'
		    }
	    }
	})	                
    .state('start', {
 	    parent: 'root',
 	    title: 'Start',
        url: '/start',
        views: {
	        'view': {
 		        templateUrl: 'app/templates/start.html',
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
 		        templateUrl: 'app/templates/host.html',
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
 		        templateUrl: 'app/templates/join.html',
		        controller: 'join'
		    }
        }        
    })    
    .state('game', {
 	    parent: 'root',
        url: '/game/:gameID?',
        views: {
	        'view': {
 		        templateUrl: 'app/templates/game.html',
		        controller: 'game'
		    }
        },
 	    resolve: {
	 	    title: function($stateParams){
		 	    return 'Game '+$stateParams.gameID.toUpperCase();
		 	}
	 	},        
        params: {
          itemList: {
            showContinue: null
          }
        }        
    })       
    .state('about', {
 	    parent: 'root',
 	    title: 'About',
        url: '/about',
        views: {
	        'view': {
 		        templateUrl: 'app/templates/about.html',
		        controller: 'about'
		    }
        }        
    });    
  
});

Pyramid.controller('root', function($state, $scope, $rootScope, $stateParams){});

Pyramid.controller('header', function($state, $scope, $rootScope, $stateParams){});

Pyramid.controller('start', function($state, $scope, $rootScope, $stateParams){
	$rootScope.pageClass = 'signup-page';
	$.material.init();
	if(currentGame){
		socket.emit('leave', {room: currentGame});
		currentGame = null;
		canContinue = false;
	}
	
});

Pyramid.controller('join', ['$cookies', '$state', '$scope','$rootScope', '$stateParams', function($cookies, $state, $scope, $rootScope, $stateParams){
	$rootScope.pageClass = 'signup-page';
	$.material.init();	
	
	$scope.join = {};
	
	$scope.joinGame = function(){
		if($scope.join.roomcode && $scope.join.name){
            $rootScope.soundEffect = new Audio();
            $rootScope.soundEffect.play();
			socket.emit('joinRoom', {room: $scope.join.roomcode.toLowerCase(), name: $scope.join.name.toUpperCase(), init: true});
			socket.on('joinRoomResponce', function(msg){
				if(msg.validity == true){
					currentGame = $scope.join.roomcode;
					$cookies.put('name', $scope.join.name.toUpperCase());
					if(msg.num == 2) canContinue = true;
					$state.go('game', {gameID: $scope.join.roomcode, showContinue: true});
				} else {
					$scope.joinError = msg.error;
					console.log(msg.error);
					$scope.$apply();
				}
			});	
		} else {
			$scope.joinError = 'Name or Code cannot be empty.'
		}	
	};
	
}]);

Pyramid.controller('about', function($state, $scope, $rootScope, $stateParams){
	$rootScope.pageClass = 'about-us';
    $.material.init();
    window_width = $(window).width();
    if($('.navbar-color-on-scroll').length != 0){
        $(window).on('scroll', materialKit.checkScrollForTransparentNavbar)
    }
    if (window_width >= 768){
        big_image = $('.page-header[data-parallax="active"]');
        if(big_image.length != 0){
            $(window).on('scroll', materialKitDemo.checkScrollForParallax);
        }

    }
});
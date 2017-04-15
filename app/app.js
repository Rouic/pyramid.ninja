var Rouic = angular.module('Rouic', ['ui.router', 'ngCookies']);
var socket = io();
var currentGame = null;
var canContinue = false;

Rouic.run(['$window', '$rootScope', '$state', '$stateParams', function($window, $rootScope, $state, $stateParams){
	$rootScope.$state = $state;
	$rootScope.$stateParams = $stateParams;	
	
	$rootScope.goBack = function(){
    	$window.history.back();
	};	
	
	socket.on('connect', function(){
	    $rootScope.socketID = socket.io.engine.id;
	});		
	
}]);

Rouic.config(function($stateProvider, $urlRouterProvider) { 
    
    if(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream){
	    $urlRouterProvider.otherwise('/join');
    } else {
	    $urlRouterProvider.otherwise('/start');
    }
    
     
    
    $stateProvider   
	.state('root', {
// 	    abstract: true,
	    views: {
		    '@' : {
 			    templateUrl: 'app/layout.html',
 			    controller: 'root',
		    },
		    'header': {
			    templateUrl: 'app/header.html',
			    controller: 'header'
		    }
	    }
	})	                
    .state('start', {
 	    parent: 'root',
        url: '/start',
        views: {
	        'view': {
 		        templateUrl: 'app/start.html',
		        controller: 'start'
		    }
        }        
    })
    .state('host', {
 	    parent: 'root',
        url: '/host',
        views: {
	        'view': {
 		        templateUrl: 'app/host.html',
		        controller: 'host'
		    }
        }        
    })
    .state('join', {
 	    parent: 'root',
        url: '/join',
        views: {
	        'view': {
 		        templateUrl: 'app/join.html',
		        controller: 'join'
		    }
        }        
    })    
    .state('game', {
 	    parent: 'root',
        url: '/game/:gameID?',
        views: {
	        'view': {
 		        templateUrl: 'app/game.html',
		        controller: 'game'
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
        url: '/about',
        views: {
	        'view': {
 		        templateUrl: 'app/about.html',
		        controller: 'about'
		    }
        }        
    });    

  
});



Rouic.controller('root', function($state, $scope, $rootScope, $stateParams){
	
});

Rouic.controller('header', function($state, $scope, $rootScope, $stateParams){

});

Rouic.controller('start', function($state, $scope, $rootScope, $stateParams){
	$rootScope.pageClass = 'signup-page';
	$.material.init();
	if(currentGame){
		socket.emit('leave', {room: currentGame});
		currentGame = null;
		canContinue = false;
	}
	
});

Rouic.controller('host', function($state, $scope, $rootScope, $stateParams, $interval){
	$rootScope.pageClass = 'signup-page';
	$.material.init();
	$scope.domain = window.location.hostname;
	
	socket.emit('newRoom');
	socket.on('newRoomSuccess', function(msg){
		currentGame = msg.room;
		$scope.roomCode = msg.room.toUpperCase();
		$scope.$apply();
	});
	
	socket.on('newGameClients', function(msg){
		$scope.players = msg.data;
		console.log(msg.data);
		$scope.$apply();
	});
	
});

Rouic.controller('join', ['$cookies', '$state', '$scope','$rootScope', '$stateParams', function($cookies, $state, $scope, $rootScope, $stateParams){
	$rootScope.pageClass = 'signup-page';
	$.material.init();	
	
	$scope.join = {};
	
	$scope.joinGame = function(){
		if($scope.join.roomcode && $scope.join.name){
			socket.emit('joinRoom', {room: $scope.join.roomcode.toLowerCase(), name: $scope.join.name.toUpperCase()});
			socket.on('joinRoomResponce', function(msg){
				socket.off('joinRoomResponce');
				if(msg.validity == true){
					currentGame = $scope.join.roomcode;
					$cookies.put('name', $scope.join.name.toUpperCase());
					if(msg.num == 3) canContinue = true;
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

Rouic.controller('game', ['$cookies', '$state', '$scope','$rootScope', '$stateParams', function($cookies, $state, $scope, $rootScope, $stateParams){
	$rootScope.pageClass = 'signup-page';
	$.material.init();

	$scope.continueButton = canContinue;
		
	if(!$stateParams.gameID){
		$state.go('start');
	} else {
		roomCode = $stateParams.gameID;
		currentGame = $stateParams.gameID;
		console.log("Loading Game: "+$stateParams.gameID);
		
		if($cookies.get('name')){
			socket.emit('joinRoom', {room: $stateParams.gameID.toLowerCase(), name: $cookies.get('name')});
			socket.on('joinRoomResponce', function(msg){
				socket.off('joinRoomResponce');
				if(msg.validity == true){
					if(msg.num == 3) $scope.continueButton = true;
					currentGame = $stateParams.gameID;
				} else {
					$scope.joinError = msg.error;
					console.log(msg.error);
					$scope.$apply();
				}
			});
		} else {
			$state.go('join');
		}					
	}
	
	socket.on('hostLeft', function(){
		$state.go('join');
	})
	
	
}]);

Rouic.controller('about', function($state, $scope, $rootScope, $stateParams){
	$rootScope.pageClass = 'about-us';
    $.material.init();

    window_width = $(window).width();

    //  Activate the Tooltips
    $('[data-toggle="tooltip"], [rel="tooltip"]').tooltip();

    // Activate Datepicker
    if($('.datepicker').length != 0){
        $('.datepicker').datepicker({
             weekStart:1
        });
    }

    //    Activate bootstrap-select
    $(".select").dropdown({ "dropdownClass": "dropdown-menu", "optionClass": "" });

    // Activate Popovers
    $('[data-toggle="popover"]').popover();

    // Active Carousel
	$('.carousel').carousel({
      interval: 400000
    });

    //Activate tags
    if($(".tagsinput").length != 0){
        $(".tagsinput").tagsInput();
    }

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
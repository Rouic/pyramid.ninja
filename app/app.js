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
	
    $rootScope.$on('$stateChangeSuccess', function (event, current, previous) {       
        $rootScope.title = '| '+$state.current.title || 'Boop';
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
 	    title: 'Start',
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
 	    title: 'Host',
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
 	    title: 'Join',
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
		$scope.roomDeck = msg.deck;
		
		$scope.deck = Deck(true);
		
		$scope.$apply();
	});
	
	socket.on('newGameClients', function(msg){
		$scope.players = msg.data;
		$scope.clients = $scope.players.filter(function(el){
			return el.type == 'client';
		});
		// if($scope.playerCards[player.name])
		$scope.players.forEach(function (player, i) {
			if(player.type == 'client' && $scope.gameHasStarted == true){
				if($scope.deck && $scope.deck.cards && $scope.deck.cards.length > 4){
					if(!$scope.playerCards[player.name]){
						$scope.playerCards[player.name] = $scope.deck.cards.splice(0, 4);
						player.cards = $scope.playerCards[player.name].map(function (obj) {
							return obj.i;
						});						
					} else {
						player.cards = $scope.playerCards[player.name].map(function (obj) {
							return obj.i;
						})
					}
					
					
				} else {
					console.log("Run out of cards to give!");
					//error, deck not setup yet, or we've run out of cards!
				}
				
			}
		});
		console.log($scope.players);
		socket.emit('playerSetup', {gamestarted: true, room: $scope.roomCode.toLowerCase(), players: $scope.players});
		
		$scope.$apply();
	});
	
	$scope.startGame = function(){
		socket.emit('startGame');
	};
	
	$scope.countdown = 0;
	$scope.step = 1;
	$scope.playerCards = [];
		
	socket.on('gameStarted', function(msg){
		$scope.gameStarted = true;
		$scope.$apply();
		
		
		//step 1, start countdown to display 

		
		$scope.information = 'Generating Deck...';
		
		$interval(function(){
			if($scope.countdown > 0) $scope.countdown--;
		}, 1000);
		
		//15 cards make pyrampid
		//5, 4, 3, 2, 1
		//4 cards to each player, new card 
		
		$scope.$container = document.getElementById('cardcontainer');
		$scope.$containerparent = document.getElementById('containerparent');		
		
		var pyramidCards = [];
		
		$scope.pyramidCoords = function(i){
			switch(i) {
				case 0: return {x:179, y:442};
				case 1: return {x:81, y:442};
				case 2: return {x:-17, y:442};
				case 3: return {x:-115, y:442};
				case 4: return {x:-217, y:442};
				case 5: return {x:123, y:310};
				case 6: return {x:29, y:310};
				case 7: return {x:-69, y:310};
				case 8: return {x:-166, y:310};
				case 9: return {x:73, y:190};
				case 10: return {x:-23, y:190};
				case 11: return {x:-116, y:190};
				case 12: return {x:37, y:65};
				case 13: return {x:-57, y:65};
				case 14: return {x:-10, y:-59};
				default: return {x:-10, y:-59};
			}					
		};
		
	    $scope.$watch('countdown', function() {
	        if($scope.countdown == 0 && $scope.step == 1){
				
				$scope.deck.mount($scope.$container);
				$scope.deck.fan();
				$scope.countdown = 3;
				$scope.step = 2;
						
	        	
	    	}
			if($scope.countdown == 0 && $scope.step == 2){
				$scope.information = 'Shuffling...';
				$scope.deck.flip();
				$scope.deck.shuffle();
				$scope.deck.fan();
				$scope.countdown = 3;
				$scope.step = 3;				
			}
			if($scope.countdown == 0 && $scope.step == 3){
				$scope.deck.unmount();
				$scope.deck = Deck(true);
				$scope.deck.shuffle();		
				$scope.information = 'Building Pyramid';
				pyramidCards = $scope.deck.cards.splice(0, 15);
				
				
	            pyramidCards.forEach(function (card, i) {
																				
					card.disableDragging();
					card.enableFlipping();					
					
					card.mount($scope.$container);
					card.animateTo({
					    delay: 1000 + i * 2, // wait 1 second + i * 2 ms
					    duration: 500,
					    ease: 'quartOut',
					    x: $scope.pyramidCoords(i).x,
					    y: $scope.pyramidCoords(i).y
				    });
				});
				$scope.players.forEach(function (player, i) {
					if(player.type == 'client'){
						if($scope.deck.cards.length > 4){
							$scope.playerCards[player.name] = $scope.deck.cards.splice(0, 4);
							player.cards = $scope.playerCards[player.name].map(function (obj) {
  						  		return obj.i;
							});
						} else {
							//error, we've run out of cards!
						}
						
					}
				});
				console.log("Starting players:", $scope.players);
				$scope.gameHasStarted = true;
				$scope.cardsleft = $scope.deck.cards.length;
				$scope.information = 'Follow the steps shown on your device to continue!';							
				socket.emit('playerSetup', {room: $scope.roomCode.toLowerCase(), players: $scope.players});
			}		
		});
		
		//request game configuration
		//setup countdown
		//display information page
		
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

Rouic.controller('game', ['$cookies', '$state', '$scope','$rootScope', '$stateParams', 'title', function($cookies, $state, $scope, $rootScope, $stateParams, title){
	$rootScope.pageClass = 'signup-page';
	$.material.init();

	$scope.continueButton = false;
		
	$rootScope.title = '| '+title+' Loading...';	
	if(!$stateParams.gameID){
		$state.go('start');
	} else {
		$scope.roomCode = $stateParams.gameID.toUpperCase();
		$scope.instruction = 'Waiting for deck!';
		console.log("Loading Game: "+$scope.roomCode);
		$scope.cardSet = [];
		if($cookies.get('name')){
			socket.emit('joinRoom', {room: $scope.roomCode.toLowerCase(), name: $cookies.get('name')});
			socket.on('joinRoomResponce', function(msg){
				if(msg.validity == true){
					if(msg.num == 2) {
						$scope.continueButton = true;
					}
					$scope.registerCheck();
					$rootScope.title = '| '+title+' Waiting...';
					$scope.$apply();
				} else {
					$scope.joinError = msg.error;
					console.log(msg.error);
					$rootScope.title = '| '+title+' Error...';
					$state.go('join');
				}
			});
		} else {
			$state.go('join');
		}					
	}
	
	$scope.registerCheck = function(){
			
		$scope.myCardsCoords = function(i){
			switch(i) {
				case 0: return {x:193, y:50};
				case 1: return {x:49, y:50};
				case 2: return {x:-89, y:50};
				case 3: return {x:-226, y:50};
				default: return {x:143, y:50};
			}					
		};
		
		socket.on('playerSetupData', function(msg){
					
			var clientDeck = Deck(true);
			$scope.$container = document.getElementById('clientcardcontainer');
			$scope.$containerparent = document.getElementById('clientcontainerparent');							
					
					
			if(msg.data && $cookies.get('name')){
				
				$scope.mydata = msg.data.filter(function(obj){
					return obj.name == $cookies.get('name');
				});
												
				if($scope.mydata[0] && $scope.mydata[0].cards) {
					$scope.gameStarted = true; 
					console.log("Nearly there...", $scope.cardSet);
					if(!$scope.cardSet || !$scope.cardSet.length > 0){
						$scope.instruction = 'You will now have 20 seconds to view your cards!';
						$scope.cardSet = clientDeck.cards.filter(function(obj){
							return ($scope.mydata[0].cards.includes(obj.i));
						});				
						
						$scope.cardSet.forEach(function (card, i) {
							card.enableDragging();
							card.disableFlipping();		
							card.animateTo({
								delay: 1000 + i * 2, // wait 1 second + i * 2 ms
								duration: 500,
								ease: 'quartOut',
								x: $scope.myCardsCoords(i).x,
								y: $scope.myCardsCoords(i).y
							});	
							card.mount($scope.$container);			
						});	
						$scope.$apply();	
					}				
				}
																					 
			}
		});	
	
	};
	
	socket.on('hostLeft', function(){
		$state.go('join');
	});
	
	$scope.startGame = function(){
		socket.emit('startGame');				
	};
	
	socket.on('gameStarted', function(msg){
		$scope.gameStarted = true;
		$rootScope.title = '| '+title;
		$scope.$apply();
	});	
	
	
}]);

Rouic.controller('about', function($state, $scope, $rootScope, $stateParams){
	$rootScope.pageClass = 'about-us';
    $.material.init();
    window_width = $(window).width();
    $('[data-toggle="tooltip"], [rel="tooltip"]').tooltip();
    if($('.datepicker').length != 0){
        $('.datepicker').datepicker({
             weekStart:1
        });
    }
    $(".select").dropdown({ "dropdownClass": "dropdown-menu", "optionClass": "" });
    $('[data-toggle="popover"]').popover();
	$('.carousel').carousel({
      interval: 400000
    });
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
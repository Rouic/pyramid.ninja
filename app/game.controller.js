Rouic.controller('game', ['$cookies', '$state', '$scope','$rootScope', '$stateParams', 'title', '$interval', function($cookies, $state, $scope, $rootScope, $stateParams, title, $interval){
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
					if(!$scope.cardSet || !($scope.cardSet.length > 0)) $scope.registerCheck();
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
	
	$interval(function(){
		if($scope.countdown > 0) $scope.countdown--;
	}, 1000);	
	
	
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
		
		socket.on('gameRoundUpdate', function(msg){
			if(msg.round && msg.card){
				$scope.instruction = 'Round '+msg.round+'! If you want to make a call click the button below!';
			} else {
				$scope.instruction = 'Waiting for host to continue...';
			}
			
			$scope.$apply();
		});
		
		socket.on('playerSetupData', function(msg){
					
			var clientDeck = Deck(true);
			$scope.$container = document.getElementById('clientcardcontainer');
			$scope.$containerparent = document.getElementById('clientcontainerparent');							
			$scope.instruction = 'Waiting for your cards...';		
					
			if(msg.data && $cookies.get('name')){
				
				$scope.mydata = msg.data.filter(function(obj){
					return obj.name == $cookies.get('name');
				});
				console.log($scope.mydata);								
				if($scope.mydata[0] && $scope.mydata[0].cards) {
					if(!$scope.cardSet || !$scope.cardSet.length > 0){
						$scope.gameStarted = true; 
						
						
						$scope.mydata[0].cardsState.forEach(function (cardState, i) {
							if(cardState == false) {
								$scope.instruction = 'Press the button below to view your cards. You will have just 15 seconds to remember them!! Tip: You can drag your cards around to re-order them,';
								$scope.allowViewAll = true;
							} else {
								$scope.instruction = 'Waiting for host to continue...';
								$scope.allowViewAll = false;
							}
						});
						
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
																		
						$('.playingcard').each(function(x) {
						    $($('.playingcard')[x]).click(function(){
								console.log("Clicked Card:", $scope.cardSet[x]);
						    });
						});						
											
					}				
				}
																					 
			}
		});	
	
	};
	
	$scope.showAllMyCards = function(){
		$scope.allowViewAll = false;
		$scope.doingCardShow = true;
		$scope.countdown = 15;
		$scope.instruction = 'Remember your cards now! You will NOT be able to view them again!';
		$scope.cardSet.forEach(function (card, i) {
			card.setSide('front');
		});
	};

	
	$scope.$watch('countdown', function() {
		if($scope.doingCardShow && $scope.countdown == 0){
			$scope.doingCardShow = false;
			$scope.instruction = 'Waiting for host to continue...';
			$scope.cardSet.forEach(function (card, i) {
				card.setSide('back');
			});	
			socket.emit('seenCards');
		}
	});
	
	$scope.$watch('cardSet', function() {
		if($scope.cardSet && $scope.cardSet.length > 0){
			//cards in play and ready...
		}
	});
	
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

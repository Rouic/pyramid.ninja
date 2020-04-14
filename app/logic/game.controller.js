Pyramid.controller('game', ['$cookies', '$state', '$scope','$rootScope', '$stateParams', 'title', '$interval', function($cookies, $state, $scope, $rootScope, $stateParams, title, $interval){
	$rootScope.pageClass = 'signup-page';
	$.material.init();

	$scope.continueButton = false;
	$scope.allowCalling = false;
	$scope.selectedplayer = {
		name: null
	}
		
	$rootScope.title = '| '+title+' Loading...';	
	if(!$stateParams.gameID){
		$state.go('start');
	} else {
		$scope.myName = $cookies.get('name');
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
				case 0: return {x:49, y:0};
				case 1: return {x:-89, y:0};
				case 2: return {x:49, y:175};
				case 3: return {x:-89, y:175};
				default: return {x:49, y:0};			
				
			}					
		};
		
		socket.on('gameRoundUpdate', function(msg){
			$scope.allowViewAll = false;
			if(msg.round && msg.card){
				$scope.allowDecision = false;
				$scope.allowCalling = true;
				$scope.currentRound = msg.round;
				$scope.instruction = 'Round '+msg.round+'! To call someone to drink on this card click the button below!';
			} else {
				$scope.allowCalling = false;
				$scope.instruction = 'Waiting for host to continue...';
			}
			
			$scope.$apply();
		});
		
		socket.on('client_transaction_update', function(msg){
						
			if($scope.currentRound && msg.transactions && msg.transactions.length > 0){
				$scope.beenCalledCount = 0;
				$scope.bullShitCount = 0;
				$scope.myBeenCalls = [];
				$scope.myBullshitReponses = [];
				$scope.bullshitReply = false;
				msg.transactions.forEach(function (transaction, i) {
					console.log(transaction.result);
					if((transaction.to_player == $cookies.get('name')) && (transaction.result == null)){
						$scope.myBeenCalls.push(transaction);
						$scope.beenCalledCount++;
					}
					if((transaction.from_player == $cookies.get('name')) && (transaction.result == 'bullshit')){
						
						$scope.myBullshitReponses.push(transaction);
						$scope.bullShitCount++;						
						
					}						
				});
				
				if($scope.bullShitCount != 0){
					
					$scope.currentDecision = $scope.myBullshitReponses[0];
					
					$scope.instruction = 'Uh Oh! '+$scope.currentDecision.to_player+' has called BULLSHIT! Select a card below with the same rank below - or drink double!';
					$scope.allowDecision = false;
					$scope.allowCalling = false;
					$scope.bullshitReply = true;
					
					
				} else if($scope.beenCalledCount != 0){
										
					$scope.allowCalling = false;
					$scope.currentDecision = $scope.myBeenCalls[0];
					
					if($scope.myBeenCalls.length > 1){
						$scope.instruction = 'You have been called to drink by several other players! Let\'s start with '+$scope.currentDecision.from_player+'. Decide what to do by choosing a button below.';
						$scope.allowDecision = true;
					} else {
						$scope.instruction = 'You have been called to drink by '+$scope.currentDecision.from_player+'! Decide what to do by choosing a button below.';
						$scope.allowDecision = true;
					}
										
				} else {
					$scope.allowDecision = false;
					$scope.allowCalling = true;
					$scope.instruction = 'Round '+$scope.currentRound+'! To call someone to drink on this card click the button below!';					
				}				
				$scope.$apply();	
			}
			
		});		
		
		$scope.decision = function(move){
			socket.emit('callDecision', {decision: move, currentMove: $scope.currentDecision});
		};
		
		
		socket.on('playerSetupData', function(msg){
					
			var clientDeck = Deck(true);
			$scope.$container = document.getElementById('clientcardcontainer');
			$scope.$containerparent = document.getElementById('clientcontainerparent');							
			$scope.instruction = 'Waiting for your cards...';		
					
			if(msg.data && $cookies.get('name')){
				
				$scope.otherPlayers = msg.data.filter(function(obj){
					return obj.name != $cookies.get('name');
				});
				console.log("Other players:", $scope.otherPlayers);
				$scope.mydata = msg.data.filter(function(obj){
					return obj.name == $cookies.get('name');
				});
				console.log($scope.mydata);								
				if($scope.mydata[0] && $scope.mydata[0].cards) {
					if($scope.cardSet.length == 0){
						$scope.gameStarted = true; 
						
						
						$scope.mydata[0].cardsState.forEach(function (cardState, i) {
							if(cardState == false) {
								$scope.instruction = 'Press the button below to view your cards. You will have just 10 seconds to remember them! Tip: You can drag your cards around to re-order them.';
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
								if($scope.bullshitReply == true){
									socket.emit('bullshitDecision', {decision: $scope.currentDecision, card: $scope.cardSet[x]});
									console.log("Card click allowed:", $scope.cardSet[x]);
								} else {
								}
								
						    });
						});						
											
					}				
				}
																					 
			}
		});	
	
	};
	
	$scope.callPlayer = function(){
		$scope.selectedplayer.name = null;
		$('#callModel').modal();
		$('.selectplayerradio').prop('checked', false);
		$.material.init();
	};
	
	$scope.confirmCall = function(){
		console.log('Sending confirm call to :', $scope.selectedplayer.name);
		socket.emit('confirmCall', {sendingTo: $scope.selectedplayer.name});
		$('#callModel').modal('hide');
	}
	
	$scope.showAllMyCards = function(){
		$scope.allowViewAll = false;
		$scope.doingCardShow = true;
		$scope.countdown = 10;
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

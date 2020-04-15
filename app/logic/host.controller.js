Pyramid.controller('host', function($state, $scope, $rootScope, $stateParams, $interval){
	$rootScope.pageClass = 'signup-page';
	$.material.init();
	$scope.domain = window.location.hostname;
	var temp_deck = Deck(true);
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

		$scope.players.forEach(function (player, i) {
			if(player.type == 'client' && $scope.gameHasStarted == true){
				console.log(player);
				if($scope.deck && $scope.deck.cards && $scope.deck.cards.length > 4){
					
					
					if(!$scope.playerCards[player.name] || !$scope.playerCards[player.name].cards){
						$scope.playerCards[player.name].cards = $scope.deck.cards.splice(0, 4);					
						player.cards = $scope.playerCards[player.name].cards.map(function (obj) {
							return obj.i;
						});						
					} else {					
						player.cards = $scope.playerCards[player.name].cards.map(function (obj) {
							return obj.i;
						})
					}
										
					if(!$scope.playerCards[player.name] || !$scope.playerCards[player.name].cardsState){
						player.cardsState = [];
						player.cards.forEach(function (card, i) {
							player.cardsState[i] = false;
							player.cardsState = player.cardsState.filter(function (e) {return e !== null;});
						});						
					} else {
						player.cardsState = $scope.playerCards[player.name].cardsState;
					} 
					
				} else {
					console.log("Run out of cards to give!");
					//error, deck not setup yet, or we've run out of cards!
				}
				
			}
		});
		console.log($scope.players);
		$scope.cardsleft = $scope.deck.cards.length;
		socket.emit('playerSetup', {gamestarted: true, room: $scope.roomCode.toLowerCase(), players: $scope.players});
		
		$scope.$apply();
	});
	
	socket.on('clientCardsSeen', function(msg){
		console.log('Cards seen:', msg.client);
		$scope.players.forEach(function (player, i) {
			if(player.name == msg.client){
				player.cards.forEach(function (card, i) {
					player.cardsState[i] = true;
				});		
				$scope.playerCards[player.name].cardsState = player.cardsState;		
			}
		});	
		$scope.information = 'Once ready, select the first card below to begin the round.';	
		$scope.$apply();
	});
	
	$scope.startGame = function(){
		socket.emit('startGame');
	};
	
	$scope.countdown = 0;
	$scope.step = 1;
	$scope.round_number = 0;
	$scope.playerCards = [];
		
	socket.on('gameStarted', function(msg){
		$scope.gameStarted = true;
		$scope.$apply();
				
		$scope.information = 'Generating Deck...';
		
		$interval(function(){
			if($scope.countdown > 0) $scope.countdown--;
		}, 1000);
		
		$scope.$container = document.getElementById('cardcontainer');
		$scope.$modalcontainer = document.getElementById('modalcardcontainer');
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
		
		$scope.pyramidRow = function(i){
			switch(true) {
				case (i <= 4): return 1;
				case (i <= 8): return 2;
				case (i <= 11): return 3;
				case (i <= 13): return 4;
				case (i == 14): return 5;
				default: return 1;
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
					card.disableFlipping();					
					
					card.mount($scope.$container);
					card.animateTo({
						delay: 1000 + i * 2, // wait 1 second + i * 2 ms
						duration: 500,
						ease: 'quartOut',
						x: $scope.pyramidCoords(i).x,
						y: $scope.pyramidCoords(i).y
					});
				});
				
				
				$('.playingcard').each(function(x) {
					$($('.playingcard')[x]).bind("click touchstart", function(){
						
						$scope.round_number++;
						$scope.information = '';
						$scope.round_row = $scope.pyramidRow(x);
						$scope.round_transactions = [];
						$scope.drink_log = [];
						
						$scope.showCards = temp_deck.cards.filter(function(obj){
							return pyramidCards[x].i == obj.i;
						});							
						
						console.log("Clicked Card:", pyramidCards[x]);
						pyramidCards[x].setSide('front');
						$scope.$apply();
						
						$('#roundModal').modal({keyboard: false, backdrop: 'static'});
						socket.emit('transaction_update', {room: $scope.roomCode.toLowerCase(), transactions: null});
						socket.emit('gameRound', {room: $scope.roomCode.toLowerCase(), round: $scope.round_number, card: $scope.showCards[0]});
						$scope.currentRound = {
							num: $scope.round_number,
							card: $scope.showCards[0]
						};
						
						$scope.showCards[0].disableDragging();
						$scope.showCards[0].disableFlipping();		
						$scope.showCards[0].mount($scope.$modalcontainer);
						$scope.showCards[0].setSide('front');					
						
						
					});
				});	
				$('#roundModal').on('hidden.bs.modal', function () {
					$scope.round_transactions = [];
					$scope.information = 'Select another card from the pyramid to continue...';
					$scope.currentRound = null;
					$scope.showCards[0].unmount($scope.$modalcontainer);
					socket.emit('gameRound', {room: $scope.roomCode.toLowerCase(), round: null, card: null});
				});
									
				
				socket.on('clientNewCard', function(msg){
					
					var newCard = $scope.deck.cards.splice(0, 1);
					$scope.playerCards[msg.client].cards[msg.cardIndex] = newCard;
					console.log('Giving new card to:', msg.client)
					socket.emit('newcard_update', {room: $scope.roomCode.toLowerCase(), cardIndex: msg.cardIndex, card: newCard, client: msg.client});
					
				});
								
								
				socket.on('clientBullshitDecision', function(msg){
					if($scope.currentRound){	
						
						var foundIndex = $scope.round_transactions.findIndex(x => x.trans_num == msg.currentMove.trans_num);
						
						if(msg.card){
																					
							if(msg.card.rank == $scope.currentRound.card.rank){
								
								var foundDrinkIndex = $scope.drink_log.findIndex(x => x.name == msg.currentMove.to_player);
								if($scope.drink_log[foundDrinkIndex]){
									$scope.drink_log[foundDrinkIndex].drinks = $scope.drink_log[foundDrinkIndex].drinks+(2*$scope.round_row);
								} else {
									$scope.drink_log.push({
										name: msg.currentMove.to_player,
										drinks: 2*$scope.round_row
									});					
								}									
								
								$scope.round_transactions[foundIndex].result = 'bullshit_correct';
								console.log($scope.drink_log);
							} else {
								
								var foundDrinkIndex = $scope.drink_log.findIndex(x => x.name == msg.currentMove.from_player);
								if($scope.drink_log[foundDrinkIndex]){
									$scope.drink_log[foundDrinkIndex].drinks = $scope.drink_log[foundDrinkIndex].drinks+(2*$scope.round_row);
								} else {
									$scope.drink_log.push({
										name: msg.currentMove.from_player,
										drinks: 2*$scope.round_row
									});					
								}								
								
								console.log($scope.drink_log);
								$scope.round_transactions[foundIndex].result = 'bullshit_wrong';
							}
							
							socket.emit('transaction_update', {room: $scope.roomCode.toLowerCase(), transactions: $scope.round_transactions});
						}						
						
						
					} else {
						console.log("Error, no round in play!");
					}	
					$scope.$apply();
				});				
				
								
				socket.on('clientCallDecision', function(msg){
					if($scope.currentRound){	
						
						var foundIndex = $scope.round_transactions.findIndex(x => x.trans_num == msg.currentMove.trans_num);
						if(msg.decision == 1){
																					
							var foundDrinkIndex = $scope.drink_log.findIndex(x => x.name == msg.currentMove.to_player);
							if($scope.drink_log[foundDrinkIndex]){
								$scope.drink_log[foundDrinkIndex].drinks = $scope.drink_log[foundDrinkIndex].drinks+(1*$scope.round_row);
							} else {
								$scope.drink_log.push({
									name: msg.currentMove.to_player,
									drinks: 1*$scope.round_row
								});					
							}
							
							$scope.round_transactions[foundIndex].result = 'accepted';
							console.log($scope.drink_log);
							
						} else {
							
							$scope.round_transactions[foundIndex].result = 'bullshit';
						}
						socket.emit('transaction_update', {room: $scope.roomCode.toLowerCase(), transactions: $scope.round_transactions});
						
					} else {
						console.log("Error, no round in play!");
					}
					$scope.$apply();	
				});	
				
				socket.on('bullshitResponse', function(msg){
					console.log(msg);
					
					//either pass bullshit or fail bullshit
					
					
				});	
				
				socket.on('roundCall', function(msg){
					if($scope.currentRound){
						if(msg.playerfrom && msg.playerto){
							
							$scope.round_transactions.push({
								trans_num: $scope.round_transactions.length + 1,
								from_player: msg.playerfrom,
								to_player: msg.playerto,
								can_win: ($scope.playerCards[msg.playerfrom].cards.filter(e => e.rank === $scope.currentRound.card.rank).length > 0),
								result: null
							});
							
							console.log('Round Tranaction Update:', $scope.round_transactions);
							$scope.$apply();
							socket.emit('transaction_update', {room: $scope.roomCode.toLowerCase(), transactions: $scope.round_transactions});
							
						} else {
							console.log("Error, no player from or to!");
						}
					} else {
						console.log("Error, no round in play!");
					}
					
				});
										
				
				$scope.players.forEach(function (player, i) {
					if(player.type == 'client'){
						if($scope.deck.cards.length > 4){
							$scope.playerCards[player.name] = {
								cards: [],
								cardsState: []
							};
							$scope.playerCards[player.name].cards = $scope.deck.cards.splice(0, 4);
							player.cards = $scope.playerCards[player.name].cards.map(function (obj) {
									return obj.i;
							});						
							player.cardsState = [];
							player.cards.forEach(function (card, i) {
								$scope.playerCards[player.name].cardsState[i] = false;
								player.cardsState[i] = false;
								player.cardsState = player.cardsState.filter(function (e) {return e !== null;});
							});
						} else {
							//error, we've run out of cards!
						}
						
					}
				});
				console.log("Starting players:", $scope.players);
				$scope.gameHasStarted = true;
				$scope.cardsleft = $scope.deck.cards.length;
				$scope.information = 'Press the button on your device to view your cards!';							
				socket.emit('playerSetup', {room: $scope.roomCode.toLowerCase(), players: $scope.players});
			}		
		});
		
		//request game configuration
		//setup countdown
		//display information page
		
	});
	
	
});

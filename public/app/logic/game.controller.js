Pyramid.controller('game', ['$cookies', '$state', '$scope','$rootScope', '$stateParams', 'title', '$interval', function($cookies, $state, $scope, $rootScope, $stateParams, title, $interval){
	$rootScope.pageClass = 'signup-page';
	$.material.init();
	
	$scope.$container = document.getElementById('clientcardcontainer');
	$scope.$containerparent = document.getElementById('clientcontainerparent');		
	
	$scope.clientDeck = Deck();
	
	$scope.initalLoad = true;
	$scope.continueButton = false;
	$scope.allowCalling = false;
	
	$scope.myCardsCoords = function(i){
		switch(i) {
			case 0: return {x:49, y:0};
			case 1: return {x:-89, y:0};
			case 2: return {x:49, y:175};
			case 3: return {x:-89, y:175};
			default: return {x:49, y:0};			
			
		}					
	};	
		
	$rootScope.title = '| '+title+' Loading...';	
	if(!$stateParams.gameID){
		$state.go('start');
	} else {
		$scope.myName = $cookies.get('name');
		$scope.roomCode = $stateParams.gameID.toUpperCase();
		$scope.instruction = 'Waiting for deck!';
		$scope.cardSet = [];
		
		if($cookies.get('name')){
			
			console.log($scope.roomCode);
			
			db.collection("games").doc($scope.roomCode).onSnapshot(function(doc) {
				
				console.log("Data Change", doc.data());
				
				if(doc.data()){
					if(doc.data()[$rootScope.user_uid]){
						
						if(doc.data()[$rootScope.user_uid].initial_deal == false || !doc.data()[$rootScope.user_uid].cards){
							
							$scope.newDeck = doc.data()['__pyramid.deck'].splice(4, doc.data()['__pyramid.deck'].length);
							$scope.myCards = doc.data()['__pyramid.deck'].splice(0, 4);
							var myCardSet = [];
							$scope.myCards.forEach(function (card, i) {
								myCardSet.push({i: card, seen: false});
							});
							
							db.collection("games").doc($scope.roomCode).set({
								'__pyramid.deck': $scope.newDeck,
								[$rootScope.user_uid]: {
									initial_deal: true,
									cards: myCardSet
								}
							}, {merge: true})
							.then(function() {
								console.log("Player cards successfully updated!");
							})
							.catch(function(error) {
								console.error("Error writing game: ", error);
							});									
							
						}						
						
						
						console.log(doc.data()[$rootScope.user_uid]);
						
						const peopleArray = Object.keys(doc.data()).map(i => doc.data()[i]);
						$scope.players = peopleArray.filter(function(el){
							return el.name;
						});
						
						$rootScope.title = '| '+title+' Waiting...';
						
						if(doc.data()['__pyramid.meta'].started == true){
							console.log("Game Started!");	
							$scope.instruction = 'Waiting on host...';		
							$scope.continueButton = false;
							
							if(doc.data()[$rootScope.user_uid].initial_deal == false || !doc.data()[$rootScope.user_uid].cards){
																
								$scope.newDeck = doc.data()['__pyramid.deck'].splice(4, doc.data()['__pyramid.deck'].length);
								$scope.myCards = doc.data()['__pyramid.deck'].splice(0, 4);
								var myCardSet = [];
								$scope.myCards.forEach(function (card, i) {
									myCardSet.push({i: card, seen: false});
								});
								
								db.collection("games").doc($scope.roomCode).set({
									'__pyramid.deck': $scope.newDeck,
									[$rootScope.user_uid]: {
										initial_deal: true,
										cards: myCardSet
									}
								}, {merge: true})
								.then(function() {
									console.log("Player cards successfully updated!");
								})
								.catch(function(error) {
									console.error("Error writing game: ", error);
								});									
								
							} else {
								$scope.myCards = doc.data()[$rootScope.user_uid].cards;
								if(doc.data()[$rootScope.user_uid].cards.length < 4){
									
									var needed_cards = 4 - doc.data()[$rootScope.user_uid].cards.length;
									
									for(var i=0; i < needed_cards; i++){
										console.log('Get card');
									}									
									
								} else {
									$scope.gameStarted = true;
									doc.data()[$rootScope.user_uid].cards.forEach(function (card, i) {
										if(card.seen == false) {
											$scope.instruction = 'Press the button below to view your cards. You will have just 10 seconds to remember them! Tip: You can drag your cards around to re-order them.';
											$scope.allowViewAll = true;
											$scope.allowCalling = false;
										} else {
											$scope.instruction = 'Waiting for host to continue...';
											$scope.allowViewAll = false;
											$scope.allowCalling = false;
										}
									});
									
									
									$scope.clientDeck.cards.forEach(function(card, i) {
										
										let a = doc.data()[$rootScope.user_uid].cards.find(m=>m.i===card.i);			
										if(!a){
											$scope.clientDeck.cards = $.grep($scope.clientDeck.cards, function(e){ 
												return e.i != card.i; 
											});										
										}
									});									
																		
									$scope.clientDeck.cards.forEach(function (card, i) {
										card.unmount();	
										card.enableDragging();
										card.disableFlipping();
										if($scope.initalLoad){
											card.animateTo({
												delay: 1000 + i * 2, // wait 1 second + i * 2 ms
												duration: 500,
												ease: 'quartOut',
												x: $scope.myCardsCoords(i).x,
												y: $scope.myCardsCoords(i).y
											});
										}
										card.mount($scope.$container);			
									});	
									$scope.initalLoad = false;
									$scope.$apply();	
									
									$('.playingcard').each(function(x) {
										var yIndex = x;
										$($('.playingcard')[yIndex]).unbind("click touchstart");
										$($('.playingcard')[yIndex]).bind("click touchstart", function(){
											if($scope.bullshitReply == true){
												$scope.selectedCard = yIndex;
												//socket.emit('bullshitDecision', {card: $scope.cardSet[$scope.selectedCard], currentMove: $scope.currentDecision});
												$scope.cardSet[$scope.selectedCard].setSide('front');
												$scope.needsNewCard = true;
												$scope.$apply();
											}
											
										});							
										
									});	
									
									const peopleArray = Object.keys(doc.data()).map(i => doc.data()[i]);
									$scope.players = peopleArray.filter(function(el){
										return el.name;
									});									
									
									$scope.otherPlayers = $scope.players.filter(function(obj){
										return obj.name != $cookies.get('name');
									});
									$scope.otherPlayersCopy = $scope.otherPlayers;
									console.log($scope.otherPlayersCopy);
									$scope.mydata = $scope.players.filter(function(obj){
										return obj.name == $cookies.get('name');
									});																		
									
									if(doc.data()['__pyramid.currentRound']){
										$scope.soundsLock = null;
										$scope.allowNewCard = false;
										$scope.lockNewCall = false;
										$scope.doneNewCard = false;
										$scope.allowDecision = false;
										$scope.allowCalling = true;
										$scope.currentRound = doc.data()['__pyramid.currentRound'].round_number;
										$scope.roundTransactions = doc.data()['__pyramid.rounds'][$scope.currentRound].round_transactions;
																				
										$scope.instruction = 'Round '+doc.data()['__pyramid.currentRound'].round_number+'! To call someone to drink on this card click the button below!';
									}
									
									
									
									
									
									
																								
								}

								
							}

							
						} else {
							if($scope.players.length == 1){
								$scope.continueButton = true;
							}
						}
						
						$scope.$apply();
						
						
						
					}
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
		
		socket.on('gameRoundUpdate', function(msg){
			$scope.allowViewAll = false;
			if(msg.round && msg.card){
				$scope.soundsLock = null;
				$scope.allowNewCard = false;
				$scope.lockNewCall = false;
				$scope.doneNewCard = false;
				$scope.allowDecision = false;
				$scope.allowCalling = true;
				$scope.currentRound = msg.round;
				
				$scope.instruction = 'Round '+msg.round+'! To call someone to drink on this card click the button below!';
				
			} else {
				$scope.allowCalling = false;
				if(($scope.selectedCard !== undefined || $scope.selectedCard !== null) && $scope.doneNewCard == false && $scope.needsNewCard == true){
					socket.emit('getNewCard', {cardNumber: $scope.selectedCard});					
					$scope.instruction = 'Getting new card...';
					$scope.allowNewCard = true;
				} else {
					$scope.allowNewCard = false;
					$scope.instruction = 'Waiting for host to continue...';
				}				
				
			}
			
			$scope.$apply();
		});
		
		socket.on('client_newcard_update', function(msg){
			if(msg.client == $cookies.get('name') && msg.cardIndex !== undefined && msg.card && $scope.clientDeck){
				$scope.clientDeck.unmount();
				$scope.allowNewCard = false;
				$scope.doneNewCard = true;
				$scope.countdown = 5;
				$scope.instruction = 'You have 5 seconds to look at your new card!';
				$scope.selectedCard = null;
				$scope.cardSet[msg.cardIndex].unmount();
							
				$scope.cardSet[msg.cardIndex] = $scope.clientDeck.cards.filter(function(obj){
					return obj.i == msg.card[0].i;
				})[0];				
							
				$scope.cardSet[msg.cardIndex].enableDragging();
				$scope.cardSet[msg.cardIndex].disableFlipping();		
				$scope.cardSet[msg.cardIndex].animateTo({
					delay: 0, // wait 1 second + i * 2 ms
					duration: 0,
					ease: 'quartOut',
					x: $scope.myCardsCoords(msg.cardIndex).x,
					y: $scope.myCardsCoords(msg.cardIndex).y
				});	
				$scope.cardSet[msg.cardIndex].mount($scope.$container);	
				$scope.cardSet[msg.cardIndex].setSide('front');
					
				$scope.$apply();	
				
				$scope.cardSet.forEach(function (card, i) {
					card.enableDragging();
					card.disableFlipping();		
					if(i == msg.cardIndex){
						card.animateTo({
							delay: 0,
							duration: 500,
							ease: 'quartOut',
							x: $scope.myCardsCoords(i).x,
							y: $scope.myCardsCoords(i).y
						});							
					}
					card.mount($scope.$container);			
				});	
				$scope.$apply();
																
				$('.playingcard').each(function(x) {
					var xIndex = x;
					$($('.playingcard')[xIndex]).unbind("click touchstart");
					$($('.playingcard')[xIndex]).bind("click touchstart", function(){
						if($scope.bullshitReply == true){
							$scope.selectedCard = xIndex;
							socket.emit('bullshitDecision', {card: $scope.cardSet[$scope.selectedCard], currentMove: $scope.currentDecision});
							$scope.cardSet[$scope.selectedCard].setSide('front');
							$scope.needsNewCard = true;
							$scope.$apply();
						}
						
					});							
				
				});					
						
	
			}
		});
		
		socket.on('client_transaction_update', function(msg){
						
			if($scope.currentRound && msg.transactions && msg.transactions.length > 0){
				
				$scope.beenCalledCount = 0;
				$scope.bullShitCount = 0;
				$scope.bullshitOutcomesCount = 0;
				$scope.myBeenCalls = [];
				$scope.myBullshitReponses = [];
				$scope.bullshitOutcomes = [];
				$scope.bullshitReply = false;
				
				msg.transactions.forEach(function (transaction, i) {
					if((transaction.to_player == $cookies.get('name')) && (transaction.result == null)){
						$scope.myBeenCalls.push(transaction);
						$scope.beenCalledCount++;
					}
					if((transaction.from_player == $cookies.get('name')) && (transaction.result == 'bullshit')){
						
						$scope.myBullshitReponses.push(transaction);
						$scope.bullShitCount++;						
						
					}	
					if((transaction.from_player == $cookies.get('name')) && (transaction.result == 'bullshit_wrong' || transaction.result == 'bullshit_correct')){
						
						$scope.bullshitOutcomes.push(transaction);
						$scope.bullshitOutcomesCount++;						
						
					}											
				});
								
				if($scope.bullShitCount != 0){
					
					$scope.currentDecision = $scope.myBullshitReponses[0];
					
					var randomBullshit = Math.floor(Math.random() * 7) + 1;

					$scope.soundEffect.src = '/assets/sounds/bullshit/'+randomBullshit+'.mp3'

					if(!$scope.soundsLock){
						$scope.soundEffect.play();
						$scope.soundsLock = true;
					}
					
					$scope.instruction = 'bullshit';
					$scope.allowDecision = false;
					$scope.allowCalling = false;
					$scope.bullshitReply = true;
					
				} else if($scope.beenCalledCount != 0){
										
					$scope.allowCalling = false;
					$scope.currentDecision = $scope.myBeenCalls[0];
					
					if($scope.myBeenCalls.length > 1){
						$scope.instruction = 'several_drink';
						$scope.allowDecision = true;
					} else {
						$scope.instruction = 'drink';
						$scope.allowDecision = true;
					}
										
				} else {
					$scope.allowDecision = false;
					if($scope.lockNewCall == true){
						$scope.allowCalling = false;
						if($scope.bullshitOutcomesCount > 0 && $scope.doneNewCard == false){
							$scope.allowNewCard = true;
							$scope.instruction = 'Round '+$scope.currentRound+'. Click the button below to get a new card, or wait till the end of the round.';		
						} else {
							$scope.instruction = 'Waiting for host to continue...';		
						}
											
					} else {
						$scope.allowCalling = true;
						$scope.instruction = 'Round '+$scope.currentRound+'! To call someone to drink on this card click the button below!';							
					}
				
				}				
				$scope.$apply();	
			}
			
		});		
		
		$scope.decision = function(move){
			// socket.emit('callDecision', {decision: move, currentMove: $scope.currentDecision});
		};
			
	};
	
	$scope.selectP = function(player){
		$scope.selectedplayer = player;
	};
	
	$scope.callPlayer = function(){
		$scope.selectedplayer = null;
		$('#callModel').modal();
		$('.selectplayerradio').prop('checked', false);
		$.material.init();
	};
	
	$scope.confirmCall = function(){
		$scope.lockNewCall = true;
		
		$scope.roundTransactions.push({
			t_to: $scope.selectedplayer.uid,
			t_from: $rootScope.user_uid,
			status: 'waiting'
		});
		
		db.collection("games").doc($scope.roomCode).set({
			'__pyramid.rounds': {
				[$scope.currentRound]: {
					round_transactions: $scope.roundTransactions
				}
			}
		}, {merge: true})
		.then(function() {
			console.log("Submitting transactions");
		})
		.catch(function(error) {
			console.error("Error writing game data: ", error);
		});			
		
		$('#callModel').modal('hide');
	}
	
	$scope.showAllMyCards = function(){
		$scope.allowViewAll = false;
		$scope.doingCardShow = true;
		$scope.countdown = 10;
		$scope.instruction = 'Remember your cards now! You will NOT be able to view them again!';
		$scope.clientDeck.cards.forEach(function (card, i) {
			card.setSide('front');
		});
	};
	
	$scope.getNewCard = function(){
		if($scope.selectedCard !== undefined || $scope.selectedCard !== null){
			$scope.needsNewCard = false;
			//socket.emit('getNewCard', {cardNumber: $scope.selectedCard});
		} else {
			$scope.instruction = 'Hmm, no selected card!';
		}
	};
	
	$scope.$watch('countdown', function() {
		if(($scope.doingCardShow || ($scope.selectedCard !== undefined || $scope.selectedCard !== null)) && $scope.countdown == 0){
			$scope.doingCardShow = false;
			$scope.selectedCard = null;
			$scope.instruction = 'Waiting for host to continue...';
			$scope.clientDeck.cards.forEach(function (card, i) {
				card.setSide('back');
			});	
			
			var newCardSet = [];
			$scope.myCards.forEach(function (card, i) {
				newCardSet.push({i: card.i, seen: true});
			});
		
			db.collection("games").doc($scope.roomCode).set({
				[$rootScope.user_uid]: {
					cards: newCardSet
				}
			}, {merge: true})
			.then(function() {
				console.log("Updated card set with seen values!");
			})
			.catch(function(error) {
				console.error("Error writing card data: ", error);
			});
			
		}
	});
	
	$scope.startGame = function(){
		db.collection("games").doc($scope.roomCode).set({
			'__pyramid.meta': {
				started: true
			}
		}, {merge: true})
		.then(function() {
				
		})
		.catch(function(error) {
			console.error("Error writing game data: ", error);
		});			
	};

	
}]);

Pyramid.controller('game', ['$cookies', '$state', '$scope','$rootScope', '$stateParams', 'title', '$interval', function($cookies, $state, $scope, $rootScope, $stateParams, title, $interval){
	$rootScope.pageClass = 'signup-page';
	$.material.init();
	
	$scope.$container = document.getElementById('clientcardcontainer');
	$scope.$containerparent = document.getElementById('clientcontainerparent');		
	
	$scope.clientDeck = Deck();
	$scope.temp_deck = Deck();
	
	$scope.initalLoad = true;
	$scope.roundsStarted = false;
	$scope.continueButton = false;
	$scope.allowCalling = false;
	$scope.newRoundLock = true;
	$scope.hasIntialLooked = false;
	$scope.transactionLock = false;
	
	$scope.myCardsCoords = function(i){
		switch(i) {
			case 0: return {x:49, y:0};
			case 1: return {x:-89, y:0};
			case 2: return {x:49, y:175};
			case 3: return {x:-89, y:175};
			default: return {x:49, y:0};			
			
		}					
	};	
		
	$scope.cardIndexTranslation = function(value){
		var card = null;
		value = value+1;
		  switch(value) {
			case 1: case 14: case 27: case 40:
			  card = "an Ace";
			  break;
			case 2: case 15: case 28: case 41:
			  card = "a Two";
			  break;
			case 3: case 16: case 29: case 42:
			  card = "a Three";
			  break;
			case 4: case 17: case 30: case 43:
			  card = "a Four";
			  break;
			case 5: case 18: case 31: case 44:
			  card = "a Five";
			  break;
			case 6: case 19: case 32: case 45:
			  card = "a Six";
			  break;
			case 7: case 20: case 33: case 46:
			  card = "a Seven";
			  break;
			case 8: case 21: case 34: case 47:
			  card = "an Eight";
			  break;
			case 9: case 22: case 35: case 48:
			  card = "a Nine";
			  break;
			case 10: case 23: case 36: case 49:
			  card = "a Ten";
			  break;
			case 11: case 24: case 37: case 50:
			  card = "a Jack";
			  break;
			case 12: case 25: case 38: case 51:
			  card = "a Queen";
			  break;
			case 13: case 26: case 39: case 52:
			  card = "a King";
			  break;
			default:
			  card = null;
		  }
		  return card;
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
			analytics.logEvent('JoinedGame');
			db.collection("games").doc($scope.roomCode).onSnapshot(function(doc) {
								
				if(doc.data()){
					if(doc.data()[$rootScope.user_uid]){
						
						if(doc.data()['__pyramid.meta'].finished){
							$state.go('join');
						}
						
						$scope.currentRound = null;
						$scope.allowDecision = false;
						
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
							})
							.catch(function(error) {
								console.error("Error writing game: ", error);
							});									
							
						}						
						
												
						const peopleArray = Object.keys(doc.data()).map(i => doc.data()[i]);
						$scope.players = peopleArray.filter(function(el){
							return el.name;
						});
						
						$rootScope.title = '| '+title+' Waiting...';
						
						if(doc.data()['__pyramid.meta'].started == true){
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
								})
								.catch(function(error) {
									console.error("Error writing game: ", error);
								});									
								
							} else {
								$scope.myCards = doc.data()[$rootScope.user_uid].cards;
								
									$scope.gameStarted = true;
									$scope.instruction = 'Waiting for host to pick a card...';
									$scope.drinkNumber = 0;
									
									if($scope.newRoundLock == false) {
										$scope.newRoundLock = true;
										$scope.getNewCard();
									}
									
									$scope.allowViewAll = false;
									$scope.allowCalling = false;
									
									var hiddenCardNum = 0;
									function callback(){
										if(hiddenCardNum == 4){
											if($scope.roundsStarted == false && $scope.hasIntialLooked == false){
												$scope.instruction = 'Press the button below to view your cards. You will have just 10 seconds to remember them! Tip: You can drag your cards around to re-order them.';
												if(!doc.data()['__pyramid.currentRound']) $scope.allowViewAll = true;
												$scope.allowCalling = false;
											}
										} else {
											$scope.allowViewAll = false;
											if($scope.getNewCard) $scope.getNewCard();
										}
									}
									doc.data()[$rootScope.user_uid].cards.forEach(function (card, i) {
										if(card.seen == false) {
											hiddenCardNum++;
										}
										if(hiddenCardNum == doc.data()[$rootScope.user_uid].cards.length){
											callback()
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
									
									const peopleArray = Object.keys(doc.data()).map(i => doc.data()[i]);
									$scope.players = peopleArray.filter(function(el){
										return el.name;
									});									
									
									$scope.otherPlayers = $scope.players.filter(function(obj){
										return obj.name != $cookies.get('name');
									});
									$scope.otherPlayersCopy = $scope.otherPlayers;
									$scope.mydata = $scope.players.filter(function(obj){
										return obj.name == $cookies.get('name');
									});
									
									$('.playingcard').each(function(x) {
										$($('.playingcard')[x]).off();
									});								
									
									if(doc.data()['__pyramid.currentRound']){
										$scope.roundsStarted = true;
										$scope.soundsLock = null;
										$scope.allowNewCard = false;
										$scope.lockNewCall = false;
										$scope.doneNewCard = false;
										$scope.allowDecision = false;
										$scope.allowCalling = true; 
										$scope.drinkNumber = 0;
										$scope.currentCard = $scope.cardIndexTranslation(doc.data()['__pyramid.currentRound'].round_card);
										$scope.currentRow = doc.data()['__pyramid.currentRound'].round_row;
										$scope.currentRound = doc.data()['__pyramid.currentRound'].round_number;
										$scope.roundTransactions = doc.data()['__pyramid.rounds'][$scope.currentRound].round_transactions;
										
										$scope.instruction = 'To call someone to drink use the button below!';
									}									
									
									if(doc.data()['__pyramid.currentRound'] && doc.data()['__pyramid.currentRound'].round_number && doc.data()['__pyramid.rounds'] && doc.data()['__pyramid.rounds'][doc.data()['__pyramid.currentRound'].round_number] && doc.data()['__pyramid.rounds'][doc.data()['__pyramid.currentRound'].round_number].round_transactions && doc.data()['__pyramid.rounds'][doc.data()['__pyramid.currentRound'].round_number].round_transactions.length > 0){										
										
										doc.data()['__pyramid.rounds'][doc.data()['__pyramid.currentRound'].round_number].round_transactions.forEach(function(transaction, i) {
											if(transaction.t_to == $rootScope.user_uid && transaction.status == 'accepted'){
												$scope.drinkNumber = ($scope.drinkNumber + (doc.data()['__pyramid.currentRound'].round_row * 1));
											}
											
											if(transaction.t_from == $rootScope.user_uid && transaction.status == 'bullshit_wrong'){
												$scope.drinkNumber = ($scope.drinkNumber + (doc.data()['__pyramid.currentRound'].round_row * 2));
											}
											
											if(transaction.t_to == $rootScope.user_uid && transaction.status == 'bullshit_correct'){
												$scope.drinkNumber = ($scope.drinkNumber + (doc.data()['__pyramid.currentRound'].round_row * 2));
											}
											
											
										});
																				
										$scope.decision = function(move){
											var temp_rounds = angular.copy(doc.data()['__pyramid.rounds']);
											temp_rounds[doc.data()['__pyramid.currentRound'].round_number].round_transactions[$scope.transactionIteration].status = (move == 1) ? 'accepted' : 'bullshit';
											
											db.collection("games").doc($scope.roomCode).set({
												'__pyramid.rounds': temp_rounds
											}, {merge: true})
											.then(function() {
											})
											.catch(function(error) {
												console.error("Error writing game data: ", error);
											});												
										};	
										
										$scope.getNewCard = function(){
											$scope.newRoundLock = true;
											$scope.allowNewCard = false;
											$('.playingcard.hearts, .playingcard.spades, .playingcard.diamonds, .playingcard.clubs').remove();	
																						
											doc.data()[$rootScope.user_uid].cards.forEach(function(setcard, ii) {
												
												Deck().cards.forEach(function(card, i) {
													if(setcard.seen == false && i == setcard.i){
														
														$scope.clientDeck.cards.push(card);
														
														$scope.clientDeck.cards.find(x => x.i === i).enableDragging();
														$scope.clientDeck.cards.find(x => x.i === i).disableFlipping();
														$scope.clientDeck.cards.find(x => x.i === i).setSide('front');
														$scope.clientDeck.cards.find(x => x.i === i).mount($scope.$container);
																												
													}
												});

											});	
											
											$scope.revealNewCard();												
											
										};																				
											
											
										if ((doc.data()['__pyramid.rounds'][doc.data()['__pyramid.currentRound'].round_number].round_transactions).filter(e => e.t_from === $rootScope.user_uid).length > 0) {
											$scope.instruction = 'You have already sent drinks - send again or please wait for round to finish...';
											
											if($scope.allowNewCard == true){
												$scope.allowDecision = false;
												$scope.allowCalling = false;
												$scope.instruction = 'Looks like you need more cards! Click the button below to get a new one, or wait until the end of the round.';	

											} else {
												$scope.allowCalling = true;
												$scope.allowDecision = true;
											}
											
											
										}
																				
										
										var callsOnUs = 0;
										(doc.data()['__pyramid.rounds'][doc.data()['__pyramid.currentRound'].round_number].round_transactions).forEach(function(transaction, i) {
											
																						
											if(transaction.t_to == $rootScope.user_uid && transaction.status == 'waiting'){
												//someone sent us a transaction! Need to block all options until we reply.
												if($scope.transactionLock == false){
													$scope.transactionIteration = i;
													$scope.currentDecision = {
														from_player: doc.data()[transaction.t_from].name,
														to_player: doc.data()[transaction.t_to].name
													};	
																										
													$rootScope.soundEffect.src = '/assets/sounds/notification/1.mp3';
													
													if(!$scope.soundsLock){
														$rootScope.soundEffect.play();
														$scope.soundsLock = true;
													}
													
													callsOnUs++;
													if(callsOnUs > 1){
														$scope.instruction = 'several_drink';
														$scope.allowDecision = true;
														$scope.allowCalling = false;
													} else {
														$scope.instruction = 'drink';
														$scope.allowDecision = true;
														$scope.allowCalling = false;
													}												
												}	
											}
											if(transaction.t_from == $rootScope.user_uid && transaction.status == 'bullshit'){
												if($scope.transactionLock == false){
													$scope.transactionLock = true;
													$scope.transactionIteration = i;
													$scope.currentDecision = {
														from_player: doc.data()[transaction.t_from].name,
														to_player: doc.data()[transaction.t_to].name
													};	
													
													var randomBullshit = Math.floor(Math.random() * 7) + 1;
													
													$rootScope.soundEffect.src = '/assets/sounds/bullshit/'+randomBullshit+'.mp3'
													
													if(!$scope.soundsLock){
														$rootScope.soundEffect.play();
														$scope.soundsLock = true;
													}
													
													$scope.instruction = 'bullshit';
													$scope.allowDecision = false;
													$scope.allowCalling = false;
													$scope.bullshitReply = true;
												
													$('.playingcard').each(function(x) {
													var xIndex = x;
													$scope.selectedIndex = x;
													$($('.playingcard')[xIndex]).off();
													$($('.playingcard')[xIndex]).bind("click touchstart", function(){
														if($scope.bullshitReply == true){
															$scope.selectedCard = xIndex;
															
															//work out if card has same value as one in play, adjust 
															//bullshit_correct bullshit_wrong
															
															var currentCardRank = Deck().cards.filter(obj => {
  														  		return obj.i === doc.data()['__pyramid.currentRound'].round_card
															})[0];
																														
															var updated_rounds = angular.copy(doc.data()['__pyramid.rounds']);
															
															if($scope.clientDeck.cards[$scope.selectedCard].rank == currentCardRank.rank){
																var randomWrong = Math.floor(Math.random() * 2) + 1;
																
																$rootScope.soundEffect.src = '/assets/sounds/wrong/'+randomWrong+'.mp3'
																
																if(!$scope.soundsLock){
																	$rootScope.soundEffect.play();
																	$scope.soundsLock = true;
																}
															} else {
																var randomSuccess = Math.floor(Math.random() * 3) + 1;
																
																$rootScope.soundEffect.src = '/assets/sounds/success/'+randomSuccess+'.mp3'
																
																if(!$scope.soundsLock){
																	$rootScope.soundEffect.play();
																	$scope.soundsLock = true;
																}
															}
															
															updated_rounds[doc.data()['__pyramid.currentRound'].round_number].round_transactions[$scope.transactionIteration].status = ($scope.clientDeck.cards[$scope.selectedCard].rank == currentCardRank.rank) ? 'bullshit_correct' : 'bullshit_wrong';
																																
																var updatedCardSet = [];
																$scope.clientDeck.cards.forEach(function (card, i) {
																	if(card.i != $scope.clientDeck.cards[$scope.selectedCard].i){
																		updatedCardSet.push({i: card.i, seen: true});
																	}
																
																});									
																
																updatedCardSet.push({i:angular.copy(doc.data()['__pyramid.deck']).splice(0, 1)[0], seen: false});
																var updatedDeck = angular.copy(doc.data()['__pyramid.deck']).splice(1, angular.copy(doc.data()['__pyramid.deck']).length);
																
																db.collection("games").doc($scope.roomCode).set({
																	[$rootScope.user_uid]: {
																		cards: updatedCardSet
																	},
																	'__pyramid.deck': updatedDeck,
																	'__pyramid.rounds': updated_rounds
																}, {merge: true})
																.then(function() {
																	$scope.newRoundLock = false;
																	$scope.allowDecision = false;
																	$scope.allowCalling = false;
																	$scope.allowNewCard = true;
																	$scope.transactionLock = false;
																})
																.catch(function(error) {
																	console.error("Error writing game data: ", error);
																});														
															

															$scope.clientDeck.cards[$scope.selectedCard].setSide('front');
															$scope.needsNewCard = true;
															$scope.$apply();
														}
														
													});							
													
												});																						
												}		
												
											}
		
										});
										
										
										
									}
									if(doc.data()['__pyramid.summary']){
										$scope.ended = true;
										$('.playingcard').off();
										$scope.clientDeck.cards.forEach(function (card, i) {
											card.setSide('front');
										});
									}

								
							}
							
						} else {
							if($scope.players.length > 1){
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
			$scope.allowCalling = false;
		})
		.catch(function(error) {
			console.error("Error writing game data: ", error);
		});			
		
		$('#callModel').modal('hide');
	};
	
	$scope.showAllMyCards = function(){
		$scope.hasIntialLooked = true;
		$scope.allowViewAll = false;
		$scope.allowNewCard = false;
		$scope.doingCardShow = true;
		$scope.countdown = 10;
		$scope.instruction = 'Remember your cards now! You will NOT be able to view them again!';
		$scope.clientDeck.cards.forEach(function (card, i) {
			card.setSide('front');
		});
	};
	
	$scope.revealNewCard = function(){
		$scope.doingCardShow = true;
		$scope.allowNewCard = false;
		$scope.countdown = 15;
		$scope.instruction = 'Remember your new card! You will NOT be able to view it again!';
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

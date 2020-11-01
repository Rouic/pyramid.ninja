Pyramid.controller('game', ['$cookies', '$state', '$scope','$rootScope', '$stateParams', 'title', '$interval', function($cookies, $state, $scope, $rootScope, $stateParams, title, $interval){
	$rootScope.pageClass = 'signup-page';
	$.material.init();
	
	$scope.$container = document.getElementById('clientcardcontainer');
	$scope.$containerparent = document.getElementById('clientcontainerparent');		
	
	$scope.clientDeck = Deck();
	$scope.temp_deck = Deck();
	
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
								console.log("Wrote myCards");
								$scope.myCards = doc.data()[$rootScope.user_uid].cards;
								
									$scope.gameStarted = true;
									$scope.instruction = 'Waiting for host to continue...';
									$scope.allowViewAll = false;
									$scope.allowCalling = false;
									doc.data()[$rootScope.user_uid].cards.forEach(function (card, i) {
										if(card.seen == false) {
											$scope.instruction = 'Press the button below to view your cards. You will have just 10 seconds to remember them! Tip: You can drag your cards around to re-order them.';
											$scope.allowViewAll = true;
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
									
									console.log("CURRENT HAND 1", $scope.clientDeck.cards);
															
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
									console.log("CURRENT HAND 2", $scope.clientDeck.cards);
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
									
									if(doc.data()['__pyramid.currentRound'] && doc.data()['__pyramid.currentRound'].round_number && doc.data()['__pyramid.rounds'] && doc.data()['__pyramid.rounds'][doc.data()['__pyramid.currentRound'].round_number] && doc.data()['__pyramid.rounds'][doc.data()['__pyramid.currentRound'].round_number].round_transactions && doc.data()['__pyramid.rounds'][doc.data()['__pyramid.currentRound'].round_number].round_transactions.length > 0){
										console.log("New transaction data!");		
										
										$scope.decision = function(move){
											var temp_rounds = angular.copy(doc.data()['__pyramid.rounds']);
											temp_rounds[doc.data()['__pyramid.currentRound'].round_number].round_transactions[$scope.transactionIteration].status = (move == 1) ? 'accepted' : 'bullshit';
											
											db.collection("games").doc($scope.roomCode).set({
												'__pyramid.rounds': temp_rounds
											}, {merge: true})
											.then(function() {
												console.log("Round data updated!");
											})
											.catch(function(error) {
												console.error("Error writing game data: ", error);
											});												
										};	
										
										$scope.getNewCard = function(){
											
												$scope.clientDeck.cards[$scope.selectedCard].unmount();
																								
												$scope.newDeck = doc.data()['__pyramid.deck'].splice(1, doc.data()['__pyramid.deck'].length);	
												$scope.newCard = doc.data()['__pyramid.deck'].splice(0, 1);							
																										
																										
												console.log(currentHand);
												db.collection("games").doc($scope.roomCode).set({
													'__pyramid.deck': $scope.newDeck,
													[$rootScope.user_uid]: {
														cards: currentHand
													}
												}, {merge: true})
												.then(function() {
													console.log("Round cards updated!");
												})
												.catch(function(error) {
													console.error("Error writing game: ", error);
												});													
												
											
											//unmount all cards.
											//find out how many cards we need
											//splice x cards from the deck
											//remount
											
											
										};																				
											
											
										if ((doc.data()['__pyramid.rounds'][doc.data()['__pyramid.currentRound'].round_number].round_transactions).filter(e => e.t_from === $rootScope.user_uid).length > 0) {
											$scope.instruction = 'Round '+doc.data()['__pyramid.currentRound'].round_number+'! You have sent drinks already - please wait for round to finish...';
											
											$scope.allowCalling = false;
											$scope.allowDecision = false;
										}
										
										if(doc.data()[$rootScope.user_uid].cards.length < 4){
											
											var needed_cards = 4 - doc.data()[$rootScope.user_uid].cards.length;
											
											for(var i=0; i < needed_cards; i++){
												console.log('Get card');
												$scope.allowDecision = false;
												$scope.allowCalling = false;
												$scope.allowNewCard = true;
												$scope.instruction = 'Round '+doc.data()['__pyramid.currentRound'].round_number+'. Looks like you need more cards! Click the button below to get a new one, or wait until the end of the round.';	
												
											}									
											
										}																					
										
										var callsOnUs = 0;
										(doc.data()['__pyramid.rounds'][doc.data()['__pyramid.currentRound'].round_number].round_transactions).forEach(function(transaction, i) {
											$scope.transactionIteration = i;
											$scope.currentDecision = {
												from_player: doc.data()[transaction.t_from].name,
												to_player: doc.data()[transaction.t_to].name
											};
											
											if(transaction.t_to == $rootScope.user_uid && transaction.status == 'waiting'){
												//someone sent us a transaction! Need to block all options until we reply.
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
											if(transaction.t_from == $rootScope.user_uid && transaction.status == 'bullshit'){
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
													$($('.playingcard')[xIndex]).off();
													$($('.playingcard')[xIndex]).bind("click touchstart", function(){
														if($scope.bullshitReply == true){
															$scope.selectedCard = xIndex;
															
															//work out if card has same value as one in play, adjust 
															//bullshit_correct bullshit_wrong
															
															var currentCardRank = $scope.temp_deck.cards.filter(obj => {
  														  		return obj.i === doc.data()['__pyramid.currentRound'].round_card
															});
															
															var updated_rounds = angular.copy(doc.data()['__pyramid.rounds']);
															updated_rounds[doc.data()['__pyramid.currentRound'].round_number].round_transactions[$scope.transactionIteration].status = ($scope.clientDeck.cards[$scope.selectedCard].rank == currentCardRank.rank) ? 'bullshit_correct' : 'bullshit_wrong';
																
																var updatedCardSet = [];
																$scope.clientDeck.cards.forEach(function (card, i) {
																	if(card.i != $scope.clientDeck.cards[$scope.selectedCard].i){
																		updatedCardSet.push({i: card.i, seen: true});
																	}
																
																});									
																
																updatedCardSet.push({i:angular.copy(doc.data()['__pyramid.deck']).splice(0, 1)[0], seen: false});
																var updatedDeck = angular.copy(doc.data()['__pyramid.deck']).splice(1, angular.copy(doc.data()['__pyramid.deck']).length);
																
																
																console.log(updatedCardSet, updatedDeck, updated_rounds);
																
																db.collection("games").doc($scope.roomCode).set({
																	[$rootScope.user_uid]: {
																		cards: updatedCardSet
																	},
																	'__pyramid.deck': updatedDeck,
																	'__pyramid.rounds': updated_rounds
																}, {merge: true})
																.then(function() {
																	console.log("Round data updated!");
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
		
										});
										
										
										
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
	};
	
	
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
			console.log("Submitting transactions");
			$scope.allowCalling = false;
		})
		.catch(function(error) {
			console.error("Error writing game data: ", error);
		});			
		
		$('#callModel').modal('hide');
	};
	
	$scope.showAllMyCards = function(){
		$scope.allowViewAll = false;
		$scope.doingCardShow = true;
		$scope.countdown = 10;
		$scope.instruction = 'Remember your cards now! You will NOT be able to view them again!';
		$scope.clientDeck.cards.forEach(function (card, i) {
			card.setSide('front');
		});
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

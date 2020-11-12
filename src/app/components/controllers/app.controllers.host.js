import SeededShuffle from 'seededshuffle';

Pyramid.controller('host', ['$state', '$scope', '$rootScope', '$stateParams', '$interval', function($state, $scope, $rootScope, $stateParams, $interval){
	$rootScope.pageClass = 'signup-page';
	$.material.init();
	$scope.domain = window.location.hostname;
	
		$interval(function(){
			if($scope.countdown > 0) $scope.countdown--;
		}, 1000);	
		
		 $scope.information = 'Generating Deck...';
		 
		 $scope.$container = document.getElementById('cardcontainer');
		 $scope.$modalcontainer = document.getElementById('modalcardcontainer');
		 $scope.$containerparent = document.getElementById('containerparent');		
		 
		 var pyramidCards = [];

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
					default: return {x:-1000, y:-1000};
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
			 
			$scope.randoString = function(arr){
				return SeededShuffle.shuffle(arr, $scope.roomPIN.toUpperCase())[0];
			};
			 
			$scope.roundTaunt = function(i){
				switch(i) {
					case 0: return $scope.randoString(['Time to get wrecked!', 'Time to turn our livers to coral!']);
					case 1: return $scope.randoString(['I hear round 2 is spicy!', 'Enjoy the hangover!']);
					case 2: return $scope.randoString(['Your liver will thank you!', 'Q: Whats the difference between a dog and a fox? A: 2 drinks.']);
					case 3: return $scope.randoString(['Sponsored by crippling depression.', 'Be kind to your friends!']);
					case 4: return $scope.randoString(['You alcoholic!', 'So a dyslexic walks into a bra...', 'I wonder if this is how Scientology started?']);
					case 5: return $scope.randoString(['Who lives in a pineapple under the sea?', 'Try to gang up on eachother.']);
					case 6: return $scope.randoString(['Round 6 is going to get heated!', 'Beauty is in the eye of the beer holder.']);
					case 7: return $scope.randoString(['Yay lockdown!', 'Two men walked into a bar. The third one ducked.']);
					case 8: return $scope.randoString(['The youngest person should double their drinks...', 'Ever thought about a career in politics?']);
					case 9: return $scope.randoString(['Ready to die?', 'The past, present, and future walk into a bar. It was tense.']);
					case 10: return $scope.randoString(['Green is not a creative colour.', 'Not drunk enough? Time to call bullshit on everything!']);
					case 11: return $scope.randoString(['Vote liver failure!', 'Ran out? Just drink hand sanitiser...']);
					case 12: return $scope.randoString(['The drinks get serious now.', 'Alcohol is a perfect solvent: It dissolves marriages, families and careers.']);
					case 13: return $scope.randoString(['Someone is going to be sick...', 'Nanananana Batman.']);
					case 14: return $scope.randoString(['Nearly there!', 'Vodka isn’t always the answer. But it’s worth a shot.']);
					case 15: return $scope.randoString(['Last one!', 'You\'ve climbed the alcoholic mountain!']);
					default: return '';
				}
			};
	
		
	$scope.players = [];
	$scope.setupGame = function(){
		
		analytics.logEvent('HostedGame');
		
		var emptyString = "";
		var alphabet = "abcdefghijklmnopqrstuvwxyz";
		
		while (emptyString.length < 4) {
			emptyString += alphabet[Math.floor(Math.random() * alphabet.length)];
		}		 
		
		$scope.roomPIN = emptyString.toUpperCase();		
		
		$scope.deck = Deck();
		$scope.temp_deck = Deck();
		
		$scope.deck.cards = SeededShuffle.shuffle($scope.deck.cards, $scope.roomPIN.toUpperCase());
				
		$scope.pyramidCards = $scope.deck.cards.splice(0, 15);
		$scope.deckArray = [];
		$scope.cardsArray = [];
		$scope.drink_log = [];
		
				
		$scope.deck.cards.forEach(function (card, i) {
			$scope.deckArray.push(card.i);
		});
		
		$scope.pyramidCards.forEach(function (card, i) {
			$scope.cardsArray.push({
				id: card.i,
				shown: false
			});
		});
				
		
		db.collection("games").doc($scope.roomPIN).set({
		    '__pyramid.meta': {
				started: false,
				total_drinks: 0,
				created_at: new Date(),
				fancy_shown: false
			},
			'__pyramid.cards': angular.copy($scope.cardsArray),
			'__pyramid.deck': angular.copy($scope.deckArray)
		}, {merge: true})
		.then(function() {
			$scope.roomCode = $scope.roomPIN.toUpperCase();
			$scope.$apply();			
		})
		.catch(function(error) {
		    console.error("Error writing game: ", error);
		});	
	};
	
	$scope.setupGame();

    $scope.logResize = function () {
       $('#maingamecontainer').height($('#cardcontainer').height() + 400);
    };	
	
	
	db.collection("games").doc($scope.roomPIN).onSnapshot(function(doc) {
				
		const peopleArray = Object.keys(doc.data()).map(i => doc.data()[i]);
		$scope.players = peopleArray.filter(function(el){
			 return el.name;
		});
		
		$scope.allRounds = doc.data()['__pyramid.rounds'];
		
		if(doc.data()['__pyramid.summary']){
			$scope.information = 'That\'s the end of the game! Let\'s look at our cards!'; 
			$scope.gameEnded = true;
			$('.playingcard').off();
		} else if(doc.data()['__pyramid.meta'].started == true){

				if($scope.gameStarted != true){
					$scope.pyramidDeck = Deck();
					$scope.pyramidDeck.cards = SeededShuffle.shuffle($scope.pyramidDeck.cards, $scope.roomPIN.toUpperCase());
				}
				$scope.information = $scope.roundTaunt((doc.data()['__pyramid.rounds']) ? Object.keys(doc.data()['__pyramid.rounds']).length : 0);
				$scope.step = 2;
				$scope.cardsleft = doc.data()['__pyramid.deck'].length;


					function genPyramid(){
						if($scope.gameStarted != true){
							$scope.pyramidDeck.cards = $scope.pyramidDeck.cards.splice(0, 15);
							$scope.pyramidDeck.cards.forEach(function (card, i) {
								if(card){													 
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
								} 
							});
						}
					};

					//convert entire new deck to match cards store in Firebase
					$scope.pyramidDeck.cards.forEach(function(card, i) {
						
						let a = doc.data()['__pyramid.cards'].find(m=>m.id===card.i);			
						if(!a){
							$scope.pyramidDeck.cards = jQuery.grep($scope.pyramidDeck.cards, function(e){ 
							     return e.i != card.i; 
							});	
						} else {
							if(a.shown) card.setSide('front');
							if(i+1 == doc.data()['__pyramid.cards'].length) {
								genPyramid();
								$('#maingamecontainer').height($('#cardcontainer').height() + 400);
							}
						}
						
					});
									 
						$scope.gameStarted = true;
						$scope.drink_log = [];
						$scope.round_transactions = [];
						if($scope.round_number && doc.data()['__pyramid.rounds'] && doc.data()['__pyramid.rounds'][$scope.round_number] && doc.data()['__pyramid.rounds'][$scope.round_number].round_transactions){
							
							(doc.data()['__pyramid.rounds'][$scope.round_number].round_transactions).forEach(function(transaction, i) {
																								
								if(transaction.status == 'waiting'){
									var trans_status = null;
								} else if(transaction.status == 'bullshit'){
									var trans_status = 'bullshit';
								} else if(transaction.status == 'bullshit_wrong'){
									var trans_status = 'bullshit_wrong';
									
									if($scope.drink_log.find(x => x.name == doc.data()[transaction.t_from].name)){
										$scope.drink_log[$scope.drink_log.findIndex(x => x.name == doc.data()[transaction.t_from].name)].drinks = $scope.drink_log[$scope.drink_log.findIndex(x => x.name == doc.data()[transaction.t_from].name)].drinks + (2 * $scope.round_row);
									} else {
										$scope.drink_log.push({
											name: doc.data()[transaction.t_from].name,
											drinks: 2 * $scope.round_row
										});
									}
									
								} else if(transaction.status == 'bullshit_correct'){
									var trans_status = 'bullshit_correct';
									
									if($scope.drink_log.find(x => x.name == doc.data()[transaction.t_to].name)){
										$scope.drink_log[$scope.drink_log.findIndex(x => x.name == doc.data()[transaction.t_to].name)].drinks = $scope.drink_log[$scope.drink_log.findIndex(x => x.name == doc.data()[transaction.t_to].name)].drinks + (2 * $scope.round_row);
									} else {
										$scope.drink_log.push({
											name: doc.data()[transaction.t_to].name,
											drinks: 2 * $scope.round_row
										});
									}
									
								} else if(transaction.status == 'accepted'){
									var trans_status = 'accepted';

									if($scope.drink_log.find(x => x.name == doc.data()[transaction.t_to].name)){
										$scope.drink_log[$scope.drink_log.findIndex(x => x.name == doc.data()[transaction.t_to].name)].drinks = $scope.drink_log[$scope.drink_log.findIndex(x => x.name == doc.data()[transaction.t_to].name)].drinks + (1 * $scope.round_row);
									} else {
										$scope.drink_log.push({
											name: doc.data()[transaction.t_to].name,
											drinks: 1 * $scope.round_row
										});
									}

									
								} else {
									var trans_status = null;
								}
								
								$scope.round_transactions.push({
									from_player: doc.data()[transaction.t_from].name,
									to_player: doc.data()[transaction.t_to].name,
									result: trans_status
								});
																			
								
							});
							
							
							
						}							
						
						 
						$('#cardcontainer .playingcard').each(function(x) {
							$($('.playingcard')[x]).off();
							$($('.playingcard')[x]).bind("click touchstart", function(){
									 
									 $scope.round_number++;
									 $scope.information = '';
									 $scope.round_row = $scope.pyramidRow(x);
									
									 $scope.drink_log = [];
									 
									 $scope.pyramidDeck.cards[x].setSide('front');
									 
										 $scope.showCards = $scope.temp_deck.cards.filter(function(obj){
											 return $scope.pyramidDeck.cards[x].i == obj.i;
										 });							
										 										 	
										 
											$('#roundModal').modal({keyboard: false, backdrop: 'static'});
																						
											var updateDeck = [];
											angular.copy($scope.pyramidDeck.cards).forEach(function (card, i) {
												updateDeck.push({
													id: card.i,
													shown: (i == x || doc.data()['__pyramid.cards'][i].shown == true) ? true : false
												});
											});
											
											$scope.currentCard = $scope.cardIndexTranslation($scope.showCards[0].i);
																				
											db.collection("games").doc($scope.roomPIN).set({
												'__pyramid.currentRound':{
													round_number: $scope.round_number,
													round_row: $scope.round_row,
													round_card: $scope.showCards[0].i
												},
												'__pyramid.rounds': {
													[$scope.round_number]: {
														round_row: $scope.round_row,
														round_card: $scope.showCards[0].i,
														round_transactions: [],
														drink_log: []
													}
												},
												'__pyramid.cards':updateDeck
											}, {merge: true})
											.then(function() {
												
											})
											.catch(function(error) {
												console.error("Error writing card: ", error);
											});														
																				
										    $scope.currentRound = {
												num: $scope.round_number,
												card: $scope.showCards[0]
											};
																				
											 
											$scope.showCards[0].disableDragging();
											$scope.showCards[0].disableFlipping();		
											$scope.showCards[0].mount($scope.$modalcontainer);
											$scope.showCards[0].setSide('front');				
											 
											$scope.$apply();
							});
						});	
						$('#roundModal').on('hidden.bs.modal', function () {
							
							db.collection("games").doc($scope.roomPIN).set({
								'__pyramid.currentRound': firebaseAll.firestore.FieldValue.delete()
							}, {merge: true});
						
							 $scope.information = 'Select another card from the pyramid to continue...';
							 $scope.currentRound = null;
							 $scope.showCards[0].unmount($scope.$modalcontainer);
							 
							 if($scope.round_number == 15){
								 $scope.information = 'That\'s the end of the game! Let\'s look at our cards!';
								 $scope.gameEnded = true;
								 $('.playingcard').off();
								 
								 var summary = {};
								 if($scope.allRounds.length){
									 $scope.allRounds.forEach(function (round, i) {
										 
										 round.round_transactions.forEach(function (round_transaction, r) {
											 
											if(round_transaction.status == 'bullshit_wrong'){
												if(summary[round_transaction.t_from]){
													summary[round_transaction.t_from] = summary[round_transaction.t_from] + (round.round_row * 2);
												} else {
													summary[round_transaction.t_from] = (round.round_row * 2);
												}
											}
											if(round_transaction.status == 'accepted'){
												if(summary[round_transaction.t_to]){
													summary[round_transaction.t_to] = summary[round_transaction.t_to] + (round.round_row * 1);
												} else {
													summary[round_transaction.t_to] = (round.round_row * 1);
												}	  
											}
											if(round_transaction.status == 'bullshit_correct'){
												if(summary[round_transaction.t_to]){
													summary[round_transaction.t_to] = summary[round_transaction.t_to] + (round.round_row * 2);
												} else {
													summary[round_transaction.t_to] = (round.round_row * 2);
												}		   
											}
											 
											 
										 });									 
									 });								 
							 	}
								 db.collection("games").doc($scope.roomPIN).set({
									 '__pyramid.summary': summary
								 }, {merge: true});
							 }
							 
						});					
				
			
		}
		
		
		$scope.$apply();
		
    });

	$rootScope.$on('$stateChangeStart', 
	  function(event, toState, toParams, fromState, fromParams){ 
		db.collection("games").doc($scope.roomCode).set({
			'__pyramid.meta': {
				finished: true
			}
		}, {merge: true})
		.then(function() {
			return null;
		})
		.catch(function(error) {
			console.error("Error writing game data: ", error);
		});
	});

	window.addEventListener("beforeunload", function(e){
		db.collection("games").doc($scope.roomCode).set({
			'__pyramid.meta': {
				finished: true
			}
		}, {merge: true})
		.then(function() {
			return null;
		})
		.catch(function(error) {
			console.error("Error writing game data: ", error);
		});	
	}, false);
	
	
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
	
	$scope.countdown = 0;
	$scope.step = 1;
	$scope.round_number = 0;
	$scope.playerCards = [];
		
	
	
}]);

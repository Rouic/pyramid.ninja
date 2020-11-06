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
		$scope.deck.shuffle();
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
		
		
		//TO-DO: Cache the PIN on reload?
		
		db.collection("games").doc($scope.roomPIN).set({
		    '__pyramid.meta': {
				started: false,
				total_drinks: 0,
				created_at: new Date(),
				fancy_shown: false
			},
			'__pyramid.cards': $scope.cardsArray,
			'__pyramid.deck': $scope.deckArray
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
			$('.playingcard').off();
			console.log("Game already ended!");
		} else if(doc.data()['__pyramid.meta'].started == true){

				if($scope.gameStarted != true){
					$scope.pyramidDeck = Deck();
				}

				$scope.information = "Time to get Wrecked...";
				$scope.step = 2;
				$scope.cardsleft = doc.data()['__pyramid.deck'].length;

					$scope.pyramidDeck.cards.forEach(function(card, i) {
						
						let a = doc.data()['__pyramid.cards'].find(m=>m.id===card.i);			
						if(!a){
							$scope.pyramidDeck.cards = $.grep($scope.pyramidDeck.cards, function(e){ 
							     return e.i != card.i; 
							});										
						} else if(a.shown) card.setSide('front'); 
					});
			
				
					if($scope.gameStarted != true){
						$scope.pyramidDeck.cards.forEach(function (card, i) {
																					 
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
					}
						 
						$scope.gameStarted = true;
						console.log("Game update!");						 
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
						
						 
						$('.playingcard').each(function(x) {
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
												console.log("Card successfully updated!");	
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
								'__pyramid.currentRound': firebase.default.firestore.FieldValue.delete()
							}, {merge: true});
						
							 $scope.information = 'Select another card from the pyramid to continue...';
							 $scope.currentRound = null;
							 $scope.showCards[0].unmount($scope.$modalcontainer);
							 
							 if($scope.round_number == 15){
								 $scope.information = 'That\'s the end of the game! Let\'s look at our cards!';
								 
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

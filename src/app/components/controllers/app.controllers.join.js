Pyramid.controller('join', ['$cookies', '$state', '$scope','$rootScope', '$stateParams', function($cookies, $state, $scope, $rootScope, $stateParams){
	$rootScope.pageClass = 'signup-page';
	$.material.init();	
	
	$scope.join = {};
	
	const event = new Event('render-ready');
	document.dispatchEvent(event);
	
	$scope.joinGame = function(){
		if(!window.__prerender){
			if($scope.join.roomcode && $scope.join.name){
				
				db && db.collection("games").doc($scope.join.roomcode.toUpperCase()).get().then((gameSnapshot) => {
				  if (gameSnapshot.exists) {
					db.collection("games").doc($scope.join.roomcode.toUpperCase()).set({
						[$rootScope.user_uid]: {
							admin: true,
							uid: $rootScope.user_uid,
							name: $scope.join.name.toUpperCase(),
							drinks: 0
						}
					}, {merge: true})
					.then(function() {
						currentGame = $scope.join.roomcode;
						$cookies.put('name', $scope.join.name.toUpperCase(), {samesite: 'strict'});
						$rootScope.soundEffect.play();
						$state.go('game', {gameID: $scope.join.roomcode, showContinue: true});
					})
					.catch(function(error) {
						$scope.joinError = error;
						console.error("Error writing game: ", error);
						$scope.$evalAsync();
					});
				  } else {
					$scope.joinError = 'Cannot find game with that code!';
					$scope.$evalAsync();
				  }
				});
				
			} else {
				$scope.joinError = 'Name or Code cannot be empty.';
			}	
		} else {
			$scope.joinError = 'Prerendering error.';
		}
	};
	
}]);
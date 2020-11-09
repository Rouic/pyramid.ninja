Pyramid.run(['$window', '$rootScope', '$state', '$stateParams', '$transitions', function($window, $rootScope, $state, $stateParams, $transitions){
	$rootScope.$state = $state;
	$rootScope.$stateParams = $stateParams;
  
  $rootScope.year = new Date().getFullYear();
	
	$rootScope.goBack = function(){
		$window.history.back();
	};	
	
  $transitions.onSuccess({}, function($transition){
	$rootScope.title = ' - '+ $state.current.title || 'Unknown Page';
  });		
	
}]);
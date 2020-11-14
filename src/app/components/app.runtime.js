Pyramid.run(['$window', '$rootScope', '$state', '$stateParams', '$transitions', function($window, $rootScope, $state, $stateParams, $transitions){
	$rootScope.$state = $state;
	$rootScope.$stateParams = $stateParams;
	$rootScope.version = '[AIV]{version}[/AIV]';
  
  	if ('serviceWorker' in navigator) {
	   window.addEventListener('load', () => {
		 navigator.serviceWorker.register('/sw.js').then(registration => {
		 }).catch(registrationError => {
		   console.log('SW registration failed: ', registrationError);
		 });
	   });
	}	
	$rootScope.goBack = function(){
		$window.history.back();
	};	
	
  $transitions.onSuccess({}, function($transition){
	$rootScope.title = ' - '+ $state.current.title || 'Unknown Page';
  });		
	
}]);
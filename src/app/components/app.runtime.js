Pyramid.run(['$window', '$rootScope', '$state', '$stateParams', '$transitions', function($window, $rootScope, $state, $stateParams, $transitions){
	$rootScope.$state = $state;
	$rootScope.$stateParams = $stateParams;
  
if ('serviceWorker' in navigator) {
	   window.addEventListener('load', () => {
		 navigator.serviceWorker.register('/sw10.js').then(registration => {
		   //console.log('SW registered: ', registration);
		 }).catch(registrationError => {
		   console.log('SW registration failed: ', registrationError);
		 });
	   });
	 }
  
  $rootScope.year = new Date().getFullYear();
	
	$rootScope.goBack = function(){
		$window.history.back();
	};	
	
  $transitions.onSuccess({}, function($transition){
	$rootScope.title = ' - '+ $state.current.title || 'Unknown Page';
  });		
	
}]);
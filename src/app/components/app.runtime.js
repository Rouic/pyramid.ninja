Pyramid.run(['$window', '$rootScope', '$state', '$stateParams', '$transitions', function($window, $rootScope, $state, $stateParams, $transitions){
	$rootScope.version = '[AIV]{version}[/AIV]';
  
  const event = new Event('render-ready');
  document.dispatchEvent(event);
  
  if(!window.__prerender){
  	if ('serviceWorker' in navigator) {
	   window.addEventListener('load', () => {
		 navigator.serviceWorker.register('/sw.js').then(registration => {
		 }).catch(err => {
		   console.log('SW failed: ', err);
		 });
	   });
	}
}	
	$rootScope.goBack = function(){
		$window.history.back();
	};	
	
  $transitions.onSuccess({}, function($transition){
	$rootScope.title = ' - '+ $state.current.title || 'Unknown Page';
  });		
	
}]);
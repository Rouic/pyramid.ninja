Pyramid.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function($stateProvider, $urlRouterProvider, $locationProvider) { 
	
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && !window.MSStream) {
		$urlRouterProvider.otherwise('/join');
	} else {
		$urlRouterProvider.otherwise('/');
	}
	
	$locationProvider.html5Mode({
	  enabled: true,
	  requireBase: false
	});
	$locationProvider.hashPrefix('!');        
	
	$stateProvider   
	  .state('root', {
		  views: {
			  '@' : {
				   templateUrl: '/templates/layout.html',
				   controller: 'root',
			  },
			  'header': {
				  templateUrl: '/templates/header.html',
				  controller: 'header'
			  }
		  }
	  })	                
	.state('start', {
		 parent: 'root',
		 title: 'Online version of the drinking card game.',
		url: '/',
		views: {
			'view': {
				 templateUrl: '/templates/start.html',
				controller: 'start'
			}
		}     
	})
	.state('host', {
		 parent: 'root',
		 title: 'Host',
		url: '/host',
		views: {
			'view': {
				 templateUrl: '/templates/host.html',
				controller: 'host'
			}
		}     
	})
	.state('join', {
		 parent: 'root',
		 title: 'Join',
		url: '/join',
		views: {
			'view': {
				 templateUrl: '/templates/join.html',
				controller: 'join'
			}
		}     
	})    
	.state('game', {
		 parent: 'root',
		url: '/game/:gameID?',
		views: {
			'view': {
				 templateUrl: '/templates/game.html',
				controller: 'game'
			}
		},
		resolve: {
			   title: ['$stateParams', function($stateParams){
				   return 'Game '+$stateParams.gameID.toUpperCase();
				 }],
		},
		params: {
		  itemList: {
			showContinue: null
		  }
		}        
	})      
	.state('privacy', {
	   parent: 'root',
	   title: 'Privacy',
		url: '/privacy',
		views: {
		  'view': {
			 templateUrl: '/templates/privacy.html',
			controller: 'privacy'
		}
		}    
	}) 
	.state('about', {
		 parent: 'root',
		 title: 'About',
		url: '/about',
		views: {
			'view': {
				 templateUrl: '/templates/about.html',
				controller: 'about'
			}
		}      
	});    
  
}]);

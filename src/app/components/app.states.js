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
				   templateUrl: require('../templates/layout.html').default,
				   controller: 'root',
			  },
		  }
	  })	                
	.state('start', {
		 parent: 'root',
		 title: 'Online version of the drinking card game.',
		url: '/',
		views: {
			'view': {
				 templateUrl: require('../templates/start.html').default,
				controller: 'start'
			},
			'header': {
				  templateUrl: require('../templates/header.html').default,
				  controller: 'header'
			},
			'footer': {
					templateUrl: require('../templates/footer.html').default
			}
		}     
	})
	.state('host', {
		 parent: 'root',
		 title: 'Host',
		url: '/host',
		views: {
			'view': {
				 templateUrl: require('../templates/host.html').default,
				controller: 'host'
			},
			'header': {
				  templateUrl: require('../templates/header.html').default,
				  controller: 'header'
			  },
			  'footer': {
					  templateUrl: require('../templates/footer.html').default
			  }
		}     
	})
	.state('join', {
		 parent: 'root',
		 title: 'Join',
		url: '/join',
		views: {
			'view': {
				 templateUrl: require('../templates/join.html').default,
				controller: 'join'
			},
			'header': {
				  templateUrl: require('../templates/header.html').default,
				  controller: 'header'
			  },
			  'footer': {
					  templateUrl: require('../templates/footer.html').default
			  }
		}     
	})    
	.state('game', {
		 parent: 'root',
		url: '/game/:gameID?',
		views: {
			'view': {
				 templateUrl: require('../templates/game.html').default,
				controller: 'game'
			},
			'header': {
				  templateUrl: require('../templates/header.html').default,
				  controller: 'header'
			  },
			  'footer': {
					  templateUrl: require('../templates/footer.html').default
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
	.state('about', {
		 parent: 'root',
		 title: 'About',
		url: '/about',
		views: {
			'view': {
				 templateUrl: require('../templates/about.html').default,
				controller: 'about'
			},
			'header': {
				  templateUrl: require('../templates/header.html').default,
				  controller: 'header'
			  },
			  'footer': {
					  templateUrl: require('../templates/footer.html').default
			  }
		}      
	});    
  
}]);

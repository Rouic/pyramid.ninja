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
				   templateUrl: require('../templates/layout.html'),
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
				 templateUrl: require('../templates/start.html'),
				controller: 'start'
			},
			'header': {
				  templateUrl: require('../templates/header.html'),
				  controller: 'header'
			},
			'footer': {
					templateUrl: require('../templates/footer.html')
			}
		}     
	})
	.state('host', {
		 parent: 'root',
		 title: 'Host',
		url: '/host',
		views: {
			'view': {
				 templateUrl: require('../templates/host.html'),
				controller: 'host'
			},
			'header': {
				  templateUrl: require('../templates/header.html'),
				  controller: 'header'
			  },
			  'footer': {
					  templateUrl: require('../templates/footer.html')
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
			},
			'header': {
				  templateUrl: require('../templates/header.html'),
				  controller: 'header'
			  },
			  'footer': {
					  templateUrl: require('../templates/footer.html')
			  }
		}     
	})    
	.state('game', {
		 parent: 'root',
		url: '/game/:gameID?',
		views: {
			'view': {
				 templateUrl: require('../templates/game.html'),
				controller: 'game'
			},
			'header': {
				  templateUrl: require('../templates/header.html'),
				  controller: 'header'
			  },
			  'footer': {
					  templateUrl: require('../templates/footer.html')
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
				 templateUrl: require('../templates/about.html'),
				controller: 'about'
			},
			'header': {
				  templateUrl: require('../templates/header.html'),
				  controller: 'header'
			  },
			  'footer': {
					  templateUrl: require('../templates/footer.html')
			  }
		}      
	});    
  
}]);

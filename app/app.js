var Rouic = angular.module('Rouic', ['ui.router']);


Rouic.run(['$window', '$rootScope', '$state', '$stateParams', function($window, $rootScope, $state, $stateParams){
	$rootScope.$state = $state;
	$rootScope.$stateParams = $stateParams;	
	
	$rootScope.goBack = function(){
    	$window.history.back();
	};	
	
	var socket = io();
	socket.on('connect', function(){
	    $rootScope.socketID = socket.io.engine.id;
	});		
	
}]);

Rouic.config(function($stateProvider, $urlRouterProvider) { 
    
    
    $urlRouterProvider.otherwise('/home'); 
    
    $stateProvider   
	.state('root', {
	          abstract: true,
	          views: {
		       '@' : {
			      controller: 'root',
 			      templateUrl: 'app/layout.html',
		       },
/*
		       'headerBar': {
			       templateUrl: 'app/layout/navigation/header.bar.html',
			       controller: 'headerBar'
		        },	            
		       'headerMenu': {
			       templateUrl: 'app/layout/navigation/menu.html', 
			       controller: 'menuController'
		        }
*/
	           }
	        })	                
    .state('home', {
 	    parent: 'root',
        url: '/home',
        views: {
	       'view': {
 		       templateUrl: 'app/home.html',
		       controller: 'home'
		    }
        }        
    });

  
});



Rouic.controller('root', function($state, $scope, $rootScope, $stateParams){

});

Rouic.controller('home', function($state, $scope, $rootScope, $stateParams){
	
	$scope.$watch('$rootScope.socketID', function() {
	    $scope.socketID = $rootScope.socketID;
	});
	
});
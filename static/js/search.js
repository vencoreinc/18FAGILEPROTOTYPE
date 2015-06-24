'use strict';
var constants = {baseUrl: "http://localhost:4000/"};
var searchApp = angular.module('searchApp', ['ngRoute', 'ngSanitize', 'ui.select','daterangepicker', 'googlechart']);

searchApp.service('sharedProperties', function(ospConstants) {
    var recallDetails = '';
    var globalSearchCriteria = {states: [stateList[0]], recallType: recallTypes[0], 
                                dateRange: {startDate: ospConstants.minDateRange, endDate: ospConstants.maxDateRange}};
    var productsList = {};
    return {
            getRecallDetails: function () {
                return recallDetails;
            },
            setRecallDetails: function(value) {
                recallDetails = value;
            },
            getGlobalSearchCriteria: function () {
            return globalSearchCriteria;
            },
            setGlobalSearchCriteria: function(value) {
                globalSearchCriteria = value;
            },
            getProductsList: function () {
            return productsList;
            },
            setProductsList: function(value) {
                productsList = value;
            }
    };
})

// configure our routes
searchApp.config(function($routeProvider) {
  $routeProvider
  // route for the list search page
    .when('/', {
    templateUrl: '/pages/listSearch.html',
    controller: 'ListSearchController'
  })

  // route for map search page
  .when('/mapSearch', {
    templateUrl: '../pages/mapSearch.html',
    controller: 'MapSearchController'
  })

  // route for the details page
  .when('/detailsPage', {
    templateUrl: '../pages/detailsPage.html',
    controller: 'DetailsController'
  })
});

searchApp.value("ospConstants", {
    minDateRange:  moment().subtract(30,'days'),
    maxDateRange: moment().subtract(1,'days'),
    ranges:{
        'Last 30 Days': [moment().subtract(30,'days'), moment().subtract(1,'days')],
        'This Month':[moment().startOf('month').startOf('day'),moment().subtract(1,'days')],
        'Last Month': [moment().subtract(1,'months').startOf('month'), moment().subtract(1,'months').endOf('month')],
        'Year to Date': [moment().startOf('year').startOf('months').startOf('day'),moment().subtract(1,'days')]
    }
});

/**
 * AngularJS default filter with the following expression:
 * "recall in availableRecall | filter: {name: $select.search}"
 */
searchApp.filter('propsFilter', function() {
  return function(items, props) {
    var out = [];

    if (angular.isArray(items)) {
      items.forEach(function(item) {
        var itemMatches = false;

        var keys = Object.keys(props);
        for (var i = 0; i < keys.length; i++) {
          var prop = keys[i];
          var text = props[prop].toLowerCase();
          if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
            itemMatches = true;
            break;
          }
        }

        if (itemMatches) {
          out.push(item);
        }
      });
    } else {
      // Let the output be the input untouched
      out = items;
    }

    return out;
  }
});

searchApp.controller('ListSearchController', function($scope, $http, ospConstants, $filter, $location, sharedProperties) {

    $scope.opts = {ranges: ospConstants.ranges};
    $scope.searchCriteria = sharedProperties.getGlobalSearchCriteria();
    $scope.availableRecall = recallTypes;
    $scope.availableStates = stateList;
    $scope.products = sharedProperties.getProductsList();

    // function to call the search service for selected search criteria
    $scope.searchData = function() {
        var recallType = $scope.searchCriteria.recallType.code;
        var finalStateList = '';
        var from_date = $filter('date')($scope.formatDate($scope.searchCriteria.dateRange.startDate), 'yyyy-MM-dd');
        var to_date = $filter('date')($scope.formatDate($scope.searchCriteria.dateRange.endDate), 'yyyy-MM-dd');
        for (var i = 0; i <= $scope.searchCriteria.states.length - 1; i++) {
            finalStateList =  finalStateList + '&locations=' + $scope.searchCriteria.states[i].code;
        };
        console.log(constants.baseUrl+"recallInfo?product_type="+ recallType + finalStateList + "&["+to_date+ "+TO+"+from_date+"]");
        $http.get(constants.baseUrl+"recallInfo?product_type="+ recallType + finalStateList + "&["+to_date+ "+TO+"+from_date+"]")
            .success(function(response) {$scope.products = response;});
    };

    // function to create a date from moment date
    $scope.formatDate = function(date){
          var dateOut = new Date(date);
          return dateOut;
    };

    // function to create a date from format '20150827'
    $scope.createDate = function(dateString) {
        return new Date(dateString.slice(0,4), dateString.slice(4,6)-1, dateString.slice(6,8));
    }

    // function to redirect to recall details page
    $scope.showDetails = function (y, path) {
        sharedProperties.setRecallDetails(y);
        sharedProperties.setProductsList($scope.products);
        sharedProperties.setGlobalSearchCriteria($scope.searchCriteria);
        $location.path(path);
    };
});

searchApp.controller('MapSearchController', function($scope, ospConstants) {

    $scope.opts = {ranges: ospConstants.ranges};
    $scope.dateRange = {
        startDate: ospConstants.minDateRange,
        endDate: ospConstants.maxDateRange
    };

    // function to create a date from moment date
    $scope.formatDate = function(date){
          var dateOut = new Date(date);
          return dateOut;
    };

    var chart1 = {};
    chart1.type = "GeoChart";
    chart1.data = [];
    chart1.data[0] = ['State', 'Total Recall'];
    for(var i=0; i<stateList.length; i++) {
        chart1.data[i+1] =[stateList[i].name, i+100];
    }

    chart1.options = {
        width: 900,
        height: 450,
        chartArea: {left:500,top:10,bottom:0,height:"100%"},
        colorAxis: {colors: ['#aec7e8', '#1f77b4']},
        //colorAxis: {colors: ['#DDEACC', '#109618']},
        region: "US",
        resolution: "provinces"
    };

    /*chart1.formatters = {
     number : [{
       columnNum: 1,
       pattern: "$ #,##0.00"
     }]
   };*/

    $scope.chart = chart1;
});

searchApp.controller('DetailsController', function($scope, sharedProperties) {
    $scope.recallDetails = sharedProperties.getRecallDetails();
});
var recallTypes = [{name: 'Drug', code: 'drug'}, 
                {name: 'Food', code: 'food'}, 
                {name: 'Device', code: 'device'}];

var stateList = [{name: 'Nationwide', code: 'Nationwide'},
                {name: 'Alabama', code: 'AL'},
                {name: 'Alaska', code: 'AK'},
                {name: 'Arizona', code: 'AZ'},
                {name: 'Arkansas', code: 'AR'},
                {name: 'California', code: 'CA'},
                {name: 'Colorado', code: 'CO'},
                {name: 'Connecticut', code: 'CT'},
                {name: 'Delaware', code: 'DE'},
                {name: 'Florida', code: 'FL'},
                {name: 'Georgia', code: 'GA'},
                {name: 'Hawaii', code: 'HI'},
                {name: 'Idaho', code: 'ID'},
                {name: 'Illinois', code: 'IL'},
                {name: 'Indiana', code: 'IN'},
                {name: 'Iowa', code: 'IA'},
                {name: 'Kansas', code: 'KS'},
                {name: 'Kentucky', code: 'KY'},
                {name: 'Louisiana', code: 'LA'},
                {name: 'Maine', code: 'ME'},
                {name: 'Maryland', code: 'MD'},
                {name: 'Massachusetts', code: 'MA'},
                {name: 'Michigan', code: 'MI'},
                {name: 'Minnesota', code: 'MN'},
                {name: 'Mississippi', code: 'MS'},
                {name: 'Missouri', code: 'MO'},
                {name: 'Montana', code: 'MT'},
                {name: 'Nebraska', code: 'NE'},
                {name: 'Nevada', code: 'NV'},
                {name: 'New Hampshire', code: 'NH'},
                {name: 'New Jersey', code: 'NJ'},
                {name: 'New Mexico', code: 'NM'},
                {name: 'New York', code: 'NY'},
                {name: 'North Carolina', code: 'NC'},
                {name: 'North Dakota', code: 'ND'},
                {name: 'Ohio', code: 'OH'},
                {name: 'Oklahoma', code: 'OK'},
                {name: 'Oregon', code: 'OR'},
                {name: 'Pennsylvania', code: 'PA'},
                {name: 'Rhode Island', code: 'RI'},
                {name: 'South Carolina', code: 'SC'},
                {name: 'South Dakota', code: 'SD'},
                {name: 'Tennessee', code: 'TN'},
                {name: 'Texas', code: 'TX'},
                {name: 'Utah', code: 'UT'},
                {name: 'Vermont', code: 'VT'},
                {name: 'Virginia', code: 'VA'},
                {name: 'Washington', code: 'WA'},
                {name: 'West Virginia', code: 'WV'},
                {name: 'Wisconsin', code: 'WI'},
                {name: 'Wyoming', code: 'WY'}];
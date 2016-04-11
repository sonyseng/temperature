angular.module('components.temperature')
    .directive('temperatureTable', [function () {

        return {
            restrict: 'E',
            replace: false,
            scope: {
                temperatureList: '='
            },

            templateUrl: 'components/temperature/directives/temperatureTable/temperatureTable.tmpl.html',

            link: function (scope) {}
        }
    }]);

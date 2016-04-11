angular.module('temperatureApp')
    .controller('appController', [
        '$scope',
        'components.temperature.temperatureService',

        function ($scope, temperatureService) {
            var CIK = '7f940ede6780511040e8ccedf8b52c1895ba1418';

            $scope.model = {
                tempList: []
            };

            temperatureService.connect(CIK, onReadingsChange, onError);

            $scope.addTemperature = function (temperature) {
                temperatureService.addTemperature(temperature);
            };

            function onReadingsChange () {
                $scope.$apply(function () {
                    $scope.model.errorText = null;
                    $scope.model.tempList = temperatureService.getTemperatureReadings();
                });
            }

            function onError () {
                $scope.$apply(function () {
                    $scope.model.errorText = 'Could not handle socket response'
                });
            }
        }
    ]);

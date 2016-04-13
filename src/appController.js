angular.module('temperatureApp')
    .controller('appController', [
        '$scope',
        'temperatureService',

        function ($scope, temperatureService) {
            var CIK = '7f940ede6780511040e8ccedf8b52c1895ba1418';

            $scope.model = {
                tempList: []
            };

            temperatureService.connect(CIK, onReadingsChange, onError);

            $scope.addTemperature = function (temperature) {
                temperatureService.addReading(temperature);
            };

            function onReadingsChange () {
                $scope.$apply(function () {
                    $scope.model.errorText = null;
                    $scope.model.tempList = temperatureService.getReadings();
                });
            }

            function onError () {
                $scope.$apply(function () {
                    $scope.model.errorText = 'Could not handle socket response'
                });
            }
        }
    ]);

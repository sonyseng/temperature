angular.module('components.temperature')
    .factory('temperatureService', ['websocketService', function (websocketService) {
        var socket;

        var URL = 'wss://m2.exosite.com/ws';
        var ENDPOINT = 'temperature';

        var INITIAL_REQUEST_ID = 1;
        var MONITOR_REQUEST_ID = 2;
        var WRITE_REQUEST_ID = 3;

        var LIMIT = 5;

        var service = {
            limit: LIMIT,

            temperatureReadings: [],

            connect: function (cik, onReadingsChange, onError) {
                var self = this;

                socket = new websocketService.ExositeWebSocket(cik, URL, onAuth, onResponse, onError, true);
                socket.connect();

                function onAuth () {
                    self.requestInitialReadings(self.limit);
                }

                function onResponse (data) {
                    switch(data.id) {
                        case INITIAL_REQUEST_ID:
                            if (data.result) {
                                // Process Initial temperature readings. This should only happen once
                                self.processTemperatureReadingsResponse(data.result);
                                onReadingsChange && onReadingsChange(event);
                            }

                            // Listen for subsequent temperature changes
                            self.monitorReadings();
                            break;

                        case MONITOR_REQUEST_ID:
                            if (data.result) {
                                // Process subsequent Temperature readings
                                self.processTemperatureReadingsResponse([data.result]);
                                onReadingsChange && onReadingsChange(event);
                            }
                            break;
                    }
                }
            },

            monitorReadings: function () {
                var arguments = [{alias: ENDPOINT}];
                var msg = {calls: [
                        {
                            id: MONITOR_REQUEST_ID,
                            procedure: 'subscribe',
                            arguments: arguments
                        }
                    ]};

                var lastReading = this.temperatureReadings[this.temperatureReadings.length - 1];

                // Add the "since" timestamp to the msg
                if (lastReading) {
                    arguments.push({since: lastReading.timestamp + 1});
                }

                socket.request(msg);
            },

            requestInitialReadings: function () {
                socket.request({calls: [
                    {
                        id: INITIAL_REQUEST_ID,
                        procedure: 'read',
                        arguments: [{alias: ENDPOINT}, {limit: this.limit}]
                    }
                ]});
            },

            // When we get readings data, add it to our service temp. readings collection
            processTemperatureReadingsResponse: function (result) {
                var temperatureReadings = result.map(function (reading) {
                    return {timestamp: reading[0] * 1000, value: reading[1]};
                });

                this.temperatureReadings = temperatureReadings.concat(this.temperatureReadings);
                this.temperatureReadings.length = Math.min(this.temperatureReadings.length, this.limit);
            },

            getTemperatureReadings: function () {
                return this.temperatureReadings;
            },

            addTemperature: function (temperature) {
                socket.request({calls: [
                    {
                        id: WRITE_REQUEST_ID,
                        procedure: 'write',
                        arguments: [{alias: ENDPOINT}, temperature + ""]
                    }
                ]});
            }
        };

        return service;
    }]);

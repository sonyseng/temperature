angular.module('components.temperature')
    .factory('components.temperature.temperatureService', [function () {
        var socket;

        var URL = 'wss://m2.exosite.com/ws';
        var ENDPOINT = 'temperature';
        var INITIAL_REQUEST_ID = 1;
        var MONITOR_REQUEST_ID = 2;
        var WRITE_REQUEST_ID = 3;
        var LIMIT = 5;

        var service = {
            temperatureReadings: [],
            limit: LIMIT,

            connect: function (cik, onReadingsChange, onError) {
                var self = this;
                var isAuthenticated = false;

                socket = new WebSocket(URL);

                socket.onopen = function () {
                    self.sendMsg({auth: {cik: cik}});
                };

                // Handle the message type lifecycle
                socket.onmessage = function (event) {
                    var data = event.data ? JSON.parse(event.data) : null;
                    data = angular.isArray(data) ? data[0] : data;

                    if (isAuthenticated && data && data.status === 'ok') {
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
                    } else if (!isAuthenticated && data && data.status === 'ok') {
                        // Process authentication only and Request the initial readings into our service data store
                        isAuthenticated = true;
                        self.requestInitialReadings(5);
                    } else {
                        // ENHANCMENT: Show specific errors
                        // "[{"id":2,"error":{"code":501,"message":"Can not apply Arguments to Procedure"}}]"
                        onError && onError(event);
                    }
                };

                socket.onerror = function (event) {
                    onError && onError(event);
                };
            },

            sendMsg: function (msgObject) {
                socket.send(JSON.stringify(msgObject));
            },

            monitorReadings: function () {
                var msg = {
                        calls:
                            [{
                                id: MONITOR_REQUEST_ID,
                                procedure: 'subscribe',
                                arguments: [
                                    {alias: ENDPOINT}
                                ]
                            }]
                    };

                // Add the since timestamp to the msg
                var lastReading = this.temperatureReadings[this.temperatureReadings.length - 1];
                if (lastReading) {
                    msg.calls[0].arguments[1] = {since: lastReading.timestamp + 1};
                }

                this.sendMsg(msg);
            },

            requestInitialReadings: function () {
                this.sendMsg({calls: [
                    {
                        id: INITIAL_REQUEST_ID,
                        procedure: 'read',
                        arguments: [
                            {alias: ENDPOINT},
                            {limit: this.limit}
                        ]
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
                this.sendMsg({calls: [
                    {
                        id: WRITE_REQUEST_ID,
                        procedure: 'write',
                        arguments: [
                            {alias: ENDPOINT},
                            temperature + ""
                        ]
                    }
                ]});
            }
        };

        return service;
    }]);

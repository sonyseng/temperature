angular.module('components.websocket')
    .factory('websocketService', [function () {

        function ExositeWebSocket (cik, url, onAuth, onResponse, onError, shouldReconnect) {
            this.cik = cik;
            this.url = url;
            this.shouldReconnect = !!shouldReconnect;
            this.authenticated = false;
            this.onAuth = onAuth;
            this.onResponse = onResponse;
            this.onError = onError;

            this.connect = function () {
                var self = this;

                this.socket = new WebSocket(self.url);

                this.socket.addEventListener('open', function () {
                    console.log('Connected. Authenticating...');
                    self.authenticate(self.cik);
                });

                this.socket.addEventListener('error', function (event) {
                    self.onError && self.onError(event);
                });

                this.socket.addEventListener('close', function () {
                    if (self.shouldReconnect) {
                        console.log('Disconnected. Reconnecting...');
                        self.authenticated = false;
                        self.connect();
                    }
                });

                this.socket.addEventListener('message', function (event) {
                    var data = event.data ? JSON.parse(event.data) : null;
                    data = angular.isArray(data) ? data[0] : data;

                    if (data && data.status === 'ok') {
                        if (!self.authenticated) {
                            console.log('Authenticated...');
                            self.authenticated = true;
                            self.onAuth && self.onAuth();

                        } else if (self.authenticated) {
                            self.onResponse && self.onResponse(data);
                        }
                    } else {
                        self.onError && self.onError(event);
                    }
                });

                return this;
            };

            this.authenticate = function (cik) {
                this.request({auth: {cik: cik}});

                return this;
            };

            this.request = function (payload) {
                this.socket.send(JSON.stringify(payload));

                return this;
            }
        }

        var service = {
            ExositeWebSocket: ExositeWebSocket
        };

        return service;
    }]);

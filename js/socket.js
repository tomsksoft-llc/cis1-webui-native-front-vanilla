var Socket = {

    data: {}
    , ws: null
    , opened: false

    , init: function(data) {
        this.data = data || {};
    }

    , open: function(callback) {

        var self = this;

        if (this.ws) {
            console.info('Error: WebSoket has already opened');
            return;
        }

        if ( ! this.data.host) {
            console.warn('Error: Host URL is undefined');
            return;
        }

        this.ws = (typeof MozWebSocket == 'function' ? new MozWebSocket(this.data.host) : new WebSocket(this.data.host));

        this.ws.onopen = function() {

            console.log('WS opened (' + self.data.host + '),',
                'token: ' + self.data.token + ',',
                'debug: ' + self.data.debug);

            self.opened = true;

            if (typeof callback == 'function') {
                callback();
            }
        };

        this.ws.onmessage = function(message) {

            try {
                message = JSON.parse(message.data);
            } catch(e) {
                return;
            }

            if (message.type === 100) {
                self.send({
                    type: 101
                    , data: {
                        connectionCookie:  message.data.connectionCookie
                        , session: self.data.session
                        , joinCookie: self.data.cookie
                        , protocolVersion: self.data.version
                    }
                });
            } else {
                // App.message(message);
            }
        };

        this.ws.onerror = function(error) {
            console.warn('WebSocket Client Error: ' + error.message);
        };

        this.ws.onclose = function(event) {
            if (event.wasClean) {
                console.log('Connection for Client was closed cleanly');
            } else {
                // Modal.open({ type: 'reconnect' });
                console.log('Unexpected disconnect for client');
            }
            console.log('Code: ' + event.code + ' reason: ' + event.reason);

            self.ws = null;
        };
    }

    , send: function(obj) {
        if ( ! this.ws
            || this.ws.readyState == this.ws.CLOSED
            || this.ws.readyState == this.ws.CLOSING ) {
            return false;
        }

        this.ws.send(JSON.stringify(obj));
        return true;
    }

    , reconnect: function() {

    }

    , close: function() {
        this.ws.close();
        this.opened = false;
    }
};
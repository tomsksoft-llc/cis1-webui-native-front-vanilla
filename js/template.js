var config_socket = ''; // ws://cis.tomsksoft:8080/ws

var templates = {};

Object.defineProperty(Array.prototype, 'addToHead', {
    enumerable: false
    , value: function(type, onload_callback) {
        this
            .forEach(function(item) {
                if (type == 'js') {
                    var script = this.document.createElement('script');
                    script.setAttribute('type', 'text/javascript');
                    script.setAttribute('src', item);
					if (onload_callback) {
						script.setAttribute('onload', onload_callback);
					}
                    document.querySelector('head').appendChild(script);
                } else if (type == 'css') {
                    var link = this.document.createElement('link');
                    link.setAttribute('type', 'text/css');
                    link.setAttribute('rel', 'stylesheet');
                    link.setAttribute('href', item);
                    document.querySelector('head').appendChild(link);
                }
            });
    }
});

addEvent(document, 'ready', function() {

    // CSS
    [
        '/css/base.css'
        , '/css/template.css'
    ].addToHead('css');

    // JS
    [

    ].addToHead('js');

    [].slice.call(document.scripts)
        .forEach(function(script) {
            if (typeof script.id == 'string' &&
                script.id.indexOf('template-') === 0) {

                templates[script.id
                    .replace('template-', '')
                    .replace(new RegExp('-', 'g'), '_')] = script.innerHTML.trim();
            }
        });

    Selector.queryAll('#content *[data-block]')
        .forEach(function(item) {
            var attr = item.getAttribute('data-block');

            ([
                '/css/pages/' + attr + '.css'
            ]).addToHead('css');

            var params = item.getAttribute('data-params') || '';

            AJAX({
                url: '/modules/' + attr + '.html'
                , method: 'POST'
                , events: {
                    wait: function() {
                        html.addClass('wait');
                    }
                    , success: function(data) {
                        html.removeClass('wait');

                        item.innerHTML = data;

                        ([
                            '/js/pages/' + attr + '.js'
                        ]).addToHead('js', (attr.capitalize() + '.init(' + params + '); Socket.addTypes(' + attr.capitalize() + ', ' + attr.capitalize() + '._messages);'));
                    }
                    , error: function() {
                        html.removeClass('wait');
                    }
                }
            });
        });
});

addEvent(window, 'load', function() {

    Socket.init({
        host: Config.socket.host
        , token: 1
        , debug: 0
    });

    User.init();
    Socket.addTypes(User, User._messages);

    Socket.open(function() { body.removeClass('spinner'); });

    // as example
    Page.init({
        header: ''
        , footer: ''
    });
});

var Page = {
    init: function(params) {
        params = params || {};

        Object.keys(params)
            .forEach(function(item) {
                if (params[item]) {
                    body.addClass(item);
                    Selector.id(item).innerHTML = params[item];
                }
            });
    }
};

var Spiner = {

    add: function () {
        body.addClass('spinner');
    }

    , remove: function () {
        body.removeClass('spinner');
    }
};

var User = {

    _events: {
        permissions: {
            error_denied: 'user.permissions.error.access_denied'
            , error_invalid: 'user.permissions.error.invalid_permissions'
        }
    }

    , _messages: [
        'user'
    ]

    , init: function() {

        // not required

    }

    , onmessage: function(message) {

        if ([
                this._events.permissions.error_denied
                , this._events.permissions.error_invalid
            ].inArray(message.event)) {

            Toast.message('warning', message.errorMessage);
        }
    }
};

var Config = {
    // webSockHost: 'ws://10.0.150.236:8080/ws'
    socket: {
        host: (config_socket || ('ws://' + window.location.host + '/ws'))
    }
    , modules: {
        // Each module add our message types
    }
};

var Socket = {

    data: {}
    , ws: null
    , opened: false
    , _events: []
    , _messages: {}
    , _callback: null

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

            console.info([
                'WS opened, params:'
                , 'url: ' + self.data.host
                , 'token: ' + self.data.token
                , 'debug: ' + self.data.debug
            ].join('\n    '));

            self.opened = true;

            while(self._events.length) {
                self.send(self._events.shift());
            }

            if (typeof callback == 'function') {
                this._callback = callback;
                this._callback();
            }
        };

        this.ws.onmessage = function(message) {

            try {
                message = JSON.parse(message.data);
            } catch(e) {
                return;
            }

            console.log(message);

            var type = message.event.split('.')[0];

            if (Config.modules[type]) {
                Config.modules[type].onmessage(message);
            } else {
                if ( ! self._messages[type]) {
                    self._messages[type] = [];
                }
                self._messages[type].push(message);
            }

            Spiner.remove();
        };

        this.ws.onerror = function(error) {
            Toast.open({
                type: 'error'
                , text: 'WebSocket error connection'
                , button_custom: {
                    text: 'reconnect'
                    , action: self.reconnect
                }
            });
            console.warn(error);
            console.error('WebSocket Client Error: ' + error.message);
        };

        this.ws.onclose = function(event) {
            if (event.wasClean) {
                console.log('Connection for Client was closed cleanly');
            } else {
                // Modal.open({ type: 'reconnect' });
                console.log('Unexpected disconnect for client');
            }
            console.log('Code: ' + event.code + ' reason: ' + event.reason);

            Toast.open({
                type: 'error'
                , text: 'WebSocket close connection'
                , button_custom: {
                    text: 'reconnect'
                    , action: self.reconnect
                }
            });

            self.ws = null;
        };
    }

    , addTypes: function(value, types) {

        var self = this;

        types
            .forEach(function(type) {
                Config.modules[type] = value;

                while ((self._messages[type] || []).length) {
                    Config.modules[type].onmessage(self._messages[type].shift());
                }
            });
    }

    , send: function(obj) {
        Spiner.add();

        console.log(obj);

        if ( ! this.ws ||
                ! this.opened ||
                this.ws.readyState == this.ws.CLOSED ||
                this.ws.readyState == this.ws.CLOSING) {

            this._events.push(obj);
            return false;
        }
        this.ws.send(JSON.stringify(obj));

        return true;
    }

    , reconnect: function() {
        Socket.open(Socket._callback);
        Toast.close();
    }

    , close: function() {
        this.ws.close();
        this.opened = false;
    }
};

/**
 * Toast messages
 *
 * Method 'open'    - Show toast message
 * @param {object} obj
 *      @param {string} type            - (optional)
 *                              (by default - black with opacity) Colors 'error' (red) ||
 *                              'warning' (yellow) ||
 *                              'success' (green) ||
 *                              'info' (blue)
 *      @param {string} text            - Text for message
 *      @param {boolean} button_close   - (optional) Show button for closing
 *      @param {object} button_custom   - (optional) Show button for custom text/action
 *          @param {string} text            - Text for button
 *          @param {function} action        - (closure) Action for button
 *      @param {number} delay (sec)     - (optional) Delay before automation closing
 *
 * Method 'close'    - Hide toast message
 * @param {number} delay (sec)  - (optional) Delay before automation closing
 */
var Toast = {
    _loaded: false
    , _element: {
        wrapper: null
        , text: null
        , buttons: null
        , button_custom: null
    }
    , _button_action: function() {}
    , _types: [
        'error'
        , 'warning'
        , 'success'
        , 'info'
    ]
    , _timeout: null
    , _loop: []

    , _init: function(obj) {
        var self = this;

        AJAX({
            url: '/modules/toast.html'
            , method: 'POST'
            , events: {
                wait: function() {
                    html.addClass('wait');
                }
                , success: function(data) {
                    html.removeClass('wait');
                    self._loaded = true;

                    body.html(data);

                    setTimeout(function() {
                        self._element.wrapper = document.getElementById('toast');
                        self._element.text = document.querySelector('#toast-text > span');
                        self._element.buttons = document.getElementById('toast-buttons');
                        self._element.button_custom = document.getElementById('toast-button-custom');

                        self.open(obj);
                    }, 0);
                }
                , error: function() {
                    console.error('Error "Toast" module load');
                    html.removeClass('wait');
                }
            }
        });
    }

    , open: function(obj) {
        if ( ! obj) {
            return;
        }

        if ( ! this._loaded) {
            this._init(obj);
            return;
        }

        var delay = 0;

        if ( ! this._element.wrapper) {
            return;
        }

        if (this._element.wrapper.hasClass('show')) {
            this._loop.push(obj);
            return;
        }

        var self = this;

        setTimeout(function() {
            if (obj.type &&
                self._types.indexOf(obj.type) > -1) {

                self._element.wrapper.setAttribute('data-type', obj.type);
            } else {
                self._element.wrapper.setAttribute('data-type', 'default');
            }

            self._element.text.innerHTML = obj.text || '';

            self._element.buttons
                .removeClass('button-close')
                .removeClass('button-custom');

            if (obj.button_close) {

                self._element.buttons.addClass('button-close');

            }

            if (obj.button_custom &&
                typeof obj.button_custom.action == "function") {

                self._element.button_custom.innerHTML = obj.button_custom.text || '';
                self._element.button_custom.setAttribute('onclick', 'Toast._button_action();');
                self._button_action = obj.button_custom.action;

                self._element.buttons.addClass('button-custom');
            }

            if (obj.delay) {
                Toast.close(obj.delay);
            }

            self._element.wrapper.addClass('show');

        }, delay * 1000);
    }

    , message: function(type, message) {

        var delay = 0;
        var is_close = false;

        if (type == 'error' ||
                type == 'warning') {

            is_close = true;

        } else {
            delay = 2;
        }

        this.open({
            type: type
            , text: message.encode()
            , button_close: is_close
            , delay: delay
        });
    }

    , close: function(delay) {
        delay = delay || 0;

        if ( ! this._element.wrapper) {
            return;
        }

        clearTimeout(this._timeout);

        var self = this;

        self._timeout = setTimeout(function() {
            self._element.wrapper.removeClass('show');
            if (self._loop.length) {
                setTimeout(function() {
                    self.open(self._loop.shift());
                }, .2 * 1000);
            }
        }, delay * 1000);
    }
};

/**
 * Modal window with custom content
 *
 * Method 'open'    - Open modal
 * @param {string} header   - Text for modal header
 * @param {string} content  - HTML for modal content
 *
 * Method 'close'   - Close modal
 */
var Modal = {
    _loaded: false
    , header: null
    , window: null
    , content: null

    , _init: function(header, content) {
        var self = this;

        AJAX({
            url: '/modules/modal.html'
            , method: 'POST'
            , events: {
                wait: function() {
                    html.addClass('wait');
                }
                , success: function(data) {
                    html.removeClass('wait');
                    self._loaded = true;

                    body.html(data);

                    setTimeout(function() {
                        self.window = document.getElementById('modal-window');
                        self.header = document.querySelector('#modal-window > h1');
                        self.content = document.getElementById('modal-content');

                        self.open(header, content);
                    }, 0);
                }
                , error: function() {
                    html.removeClass('wait');
                }
            }
        });
    }

    , open: function(header, content) {
        if ( ! this._loaded) {
            this._init(header, content);
            return;
        }

        this.header.innerHTML = header;
        this.content.innerHTML = content;

        html.style.paddingRight = window.innerWidth - html.clientWidth + 'px';
        html.addClass('modal-show');
    }
    , close: function() {
        html.style.paddingRight = 0;
        html.removeClass('modal-show');
    }
};

function fileSize(size) {
    var i = Math.floor(Math.log(size) / Math.log(1024));
    return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}
/**
 * Authenticate
 *
 * Methods:
 *  init            - Variable initialization
 *  signInByLogPass - Sign in by login and password
 *  signOut         - Log out from account
 *  onmessage       - Behavior on response from server
 *      @param {object} message - Text of response text of response from server(
 */
var Auth = {

    _elements: {
        content: null
        , username: null
        , password: null
        , remember: null
    }
    , _cookie: {
        auth_token: null
        , username: null
    }
    , _events: {
        response: {
            sign_in:                'auth.login_pass.success'
            , sign_out:             'auth.logout.success'
            , wrong_credentials:    'auth.error.wrong_credentials'
            , login_required:       'auth.error.login_required'
        }
        , request: {
            sign_in_token:  'auth.token'
            , sign_in_log:  'auth.login_pass'
            , sign_out:     'auth.logout'
        }
    }

    , events: {}
    , _state: ''

    , _messages: [
        'auth'
    ]

    , init: function(params) {

        params = params || {};

        for (var key in params) {
            this.events[key] = params[key];
        }

        for (var key in this._elements) {
            this._elements[key] = Selector.id('auth-' + key);
        }
        for (var key in this._cookie) {
            this._cookie[key] = decodeURIComponent(Cookie.get(key));
        }

        if (this._elements.content) {
            this._elements.content.className = this._state;
        } else if (this._cookie.auth_token) {
            this._sendRequest(this._events.request.sign_in_token, { token: this._cookie.auth_token });
        } else {
            this._state = 'sign-in';
        }
    }

    , open: function(header, content) {

        Modal.open(header, content, function() { Auth.init(); });
    }

    , signInByLogPass: function() {

        if ( ! this._elements.username.value) {

            Toast.message('warning', 'Please enter your login');
            return;
        }
        if ( ! this._elements.password.value) {

            Toast.message('warning', 'Please enter your password');
            return;
        }

        this._sendRequest(this._events.request.sign_in_log, {
            username: this._elements.username.value
            , pass: this._elements.password.value
        });
    }

    , signOut: function() {

        this._sendRequest(this._events.request.sign_out, { token: this._cookie.auth_token });
    }

    , onmessage: function(message) {

        var self = this;

        message = message || {event: ''};

        // auth.login_pass.success
        if (message.event == this._events.response.sign_in) {

            this._cookie.auth_token = (message.data || {}).token || '';

            if (this._elements.username &&
                    this._elements.username.value) {

                this._cookie.username = this._elements.username.value;

                for (var key in this._cookie) {
                    if (self._elements.remember &&
                            self._elements.remember.checked) {
                        Cookie.set(key, encodeURIComponent(this._cookie[key]), { expires: 30 });
                    } else {
                        Cookie.set(key, encodeURIComponent(this._cookie[key]));
                    }
                }

                Selector.query('#auth-sign-out > span').innerHTML = 'Logged in as "' + this._cookie.username + '"';
                Toast.message('success', 'authentication was successful');
            }

            this._state = 'sign-out';

        // auth.logout.success
        } else if (message.event == this._events.response.sign_out) {

            for (var key in this._cookie) {
                Cookie.delete(key);
            }

            this._state = 'sign-in';

        // auth.error.wrong_credentials
        } else if (message.event == this._events.response.wrong_credentials) {

            if (this._elements.username &&
                    this._elements.username.value) {
                Toast.message('error', 'wrong login or password');
            } else {
                Toast.message('error', 'Auth wrong credentials, please sign in');

                var sign_in_button = Selector.id('header-login-signin');
                if (sign_in_button) {
                    sign_in_button.click();
                }
            }

            this._state = 'sign-in';

        // auth.error.login_required
        } else if (message.event == this._events.response.login_required) {

            var sign_in_button = Selector.id('header-login-signin');
            if (sign_in_button) {
                sign_in_button.click();
            }

            this._state = 'sign-in';

        } else {

            console.warn('not processed message');

        }

        if (this._elements.content) {
            this._elements.content.className = this._state;
        }

        try {
            this.events.onChangeState(this._state);
        } catch(e) {}
    }

    , _sendRequest: function(event, data) {

        if ( ! event) {
            return;
        }

        Socket.send({
            event: event
            , transactionId: (new Date()).getTime()
            , data: data || {}
        });
    }
};
/**
 * Authenticate
 *
 * Methods:
 *  init            - Variable initialization
 *  signInByLogPass - Sign in by login and password
 *  signOut         - Log out from account
 *
 *  onmessage       - Behavior on response from server
 *  @param {object} message - Text of response text of response from server(
 *      @param {string} event - Success of action
 *                               Variant 'auth.success' (success sign in) ||
 *                               'auth.error.wrong_credentials' (data error) ||
 *                               'auth.logout_success' (success sign out)
 *      @param {object} data  - (optional) Message (for success sign in)
 *          @param {string} token - Token of user
 */

var Auth = {

    _elements: {
        auth: null
        , username: null
        , pass: null
        , remember: null
    }
    , _cookie: {
        auth_token: null
        , username: null
    }
    , _events: {
        request: {
            sign_in_token:  'auth.token'
            , sign_in_log:  'auth.login_pass'
            , sign_out:     'auth.logout'
        }
        , response: {
            sign_in:    'auth.login_pass.success'
            , error:    'auth.error.wrong_credentials'
            , sign_out: 'auth.logout.success'
        }
    }

    , _messages: [
        'auth'
    ]

    , init: function() {

        for (var key in this._elements) {
            this._elements[key] = Selector.id(((key == 'auth') ? '' : 'auth-') + key);
        }
        for (var key in this._cookie) {
            this._cookie[key] = decodeURIComponent(Cookie.get(key));
        }

        this._sendRequest(this._events.request.sign_in_token, { token: this._cookie.auth_token });
    }

    , signInByLogPass: function() {

        if ( ! this._elements.username.value) {

            Toast.message('warning', 'Please enter your login');
            return;
        }
        if ( ! this._elements.pass.value) {

            Toast.message('warning', 'Please enter your password');
            return;
        }

        this._sendRequest(this._events.request.sign_in_log, {
            username: this._elements.username.value
            , pass: this._elements.pass.value
        });
    }

    , signOut: function() {

        this._sendRequest(this._events.request.sign_out, { token: this._cookie.auth_token });
    }

    , onmessage: function(message) {

        message = message || {event: ''};

        if (message.event == this._events.response.sign_in) {

            this._cookie.auth_token = (message.data || {}).token || '';

            if (this._elements.username.value) {

                this._cookie.username = this._elements.username.value;
                if (this._elements.remember.checked) {
                    for (var key in this._cookie) {
                        Cookie.set(key, encodeURIComponent(this._cookie[key]));
                    }
                }
            }

            Selector.query('#auth-sign-out > span').innerHTML = 'Logged in as ' + this._cookie.username;
            Toast.message('success', 'authentication was successful');
            this._elements.auth.className = 'sign-out';

        } else if (message.event == this._events.response.error) {

            if (this._elements.username.value) {
                Toast.message('error', 'wrong login or password');
            }

            this._elements.auth.className = 'sign-in';

        } else if (message.event == this._events.response.sign_out) {

            for (var key in this._cookie) {
                Cookie.delete(key);
            }

            this._elements.auth.className = 'sign-in';

        } else {

            console.warn('not processed message');
        }
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
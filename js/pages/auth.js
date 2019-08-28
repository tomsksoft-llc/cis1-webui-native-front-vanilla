/**
 * Authenticate
 *
 * @param {boolean} logged - user logged in
 *
 * Methods:
 *  init            - variable initialization
 *  signInByLogPass - sign in by login and password
 *  signOut         - log out from account
 *
 *  onmessage       - behavior on response from server
 *  @param {object} message - text of response text of response from server(
 *      @param {string} event - success of action
 *                               Variant 'auth.success' (success sign in) ||
 *                               'auth.error.wrong_credentials' (data error) ||
 *                               'auth.logout_success' (success sign out)
 *      @param {object} data  - (optional) message (for success sign in)
 *          @param {string} token - token of user
 */

var Auth = {

    _elements: {
        auth: null
        , username: null
        , pass: null
        , remember: null
    }
    , _cookie: {
        token: null
        , username: null
    }
    , logged: false

    , init: function () {

        for (var key in this._elements) {
            if (key == 'auth') {
                this._elements[key]= Selector.id(key);
            } else {
                this._elements[key] = Selector.id('auth-' + key);
            }
        }
        for (var key in this._cookie){
            this._cookie[key] = decodeURIComponent(Cookie.get(key));
        }

        Socket.send({
            event: 'auth.token'
            , transactionId: (new Date()).getTime()
            , data: {
                token: this._cookie.token
            }
        });
    }

    , signInByLogPass: function() {

        if ( ! this._elements.username.value) {
            Toast.open({
                type: 'info'
                , text: 'Please enter your login'
                , button_close: true
            });
            return;
        }
        if ( ! this._elements.pass.value) {
            Toast.open({
                type: 'info'
                , text: 'Please enter your password'
                , button_close: true
            });
            return;
        }

        Socket.send({
            event: 'auth.login_pass'
            , transactionId: (new Date()).getTime()
            , data: {
                username: this._elements.username.value
                , pass: this._elements.pass.value
            }
        });
    }

    , signOut: function() {

        Socket.send({
            event: 'auth.logout'
            , transactionId: (new Date()).getTime()
            , data: {
                token: this._cookie.token
            }
        });
    }

    , onmessage: function(message) {

        if (message.event == 'auth.success') {

            this.logged = true;
            this._cookie.token = message.data.token;

            // to log/pass
            if (this._elements.username.value) {
                this._cookie.username = this._elements.username.value;
                if (this._elements.remember.checked) {
                    for (var key in this._cookie) {
                        Cookie.set(key, encodeURIComponent(this._cookie[key]));
                    }
                }
            }

            Selector.query('#auth-sign-out > span').innerHTML = 'Logged in as ' + this._cookie.username;
            Toast.open({
                type: 'success'
                , text: 'authentication was successful'
                , delay: 2
            });

            this._elements.auth.className = 'sign-out';

        } else if (message.event == 'auth.error.wrong_credentials') {

            if (this._elements.username.value) {
                Toast.open({
                    type: 'error'
                    , text: 'wrong login or password'
                    , button_close: true
                });
            }

            this._elements.auth.className = 'sign-in';

        } else if (message.event == 'auth.logout_success') {

            this.logged = false;
            for (var key in this._cookie) {
                Cookie.delete(key);
            }

            this._elements.auth.className = 'sign-in';

        } else {

            Toast.open({
                type: 'error'
                , text: 'Unexpected message was found' + message
                , button_close: true
            });
        }
    }
};
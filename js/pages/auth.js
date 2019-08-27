/**
 * Authenticate
 *
 * @param {object} _auth     - main node
 * @param {string} _token    - user account key
 * @param {string} _username - username from cookie or input
 * @param {string} _pass     - password from input
 * @param {boolean} logged   - user logged in
 * Methods:
 *     init            - variable initialization
 *     signInByLogPass - sign in by login and password
 *     signOut         - log out from account
 *     onmessage       - behavior on server response
 *         @param {object} message     -  text of response
 *         for authenticate by login/pass/token:
 *             @param {string} event - success of action
 *                                  may be: 'auth.success' - success
 *                                          'auth.error.wrong_credentials' - data error
 *             @param {object} data      - message (for success)
 *                 @param {string} group - request initiator
 *                 @param {string} token - token of user
 */

var Auth = {

    _auth: null
    , _token: null
    , _username: null
    , _pass: null
    , logged: false

    ,init: function () {

        this._auth = Selector.id('auth');

        if (Cookie.get('cis_token')) {

            Socket.send({
                event: 'auth.token'
                , transactionId: (new Date()).getTime()
                , data: {
                    token: decodeURIComponent(Cookie.get('cis_token'))
                }
            });

            this._username = decodeURIComponent(Cookie.get('cis_username'));
            this._pass = '';

            this._auth.className = 'auth-sign-out';
        } else {
            this._auth.className = 'auth-sign-in';
        }
    }

    , signInByLogPass: function() {

        this._username = Selector.id('auth-username').value;
        this._pass = Selector.id('auth-password').value;

        if ( ! this._username) {
            Toast.open({
                type: 'info'
                , text: 'Please enter your login'
                , button_close: true
            });
            return;
        }
        if ( ! this._pass) {
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
                username: this._username
                , pass: this._pass
            }
        });
    }

    , signOut: function() {
        Socket.send({
            event: 'auth.logout'
            , transactionId: (new Date()).getTime()
            , data: {
                token: this._token
            }
        });
    }

    , onmessage: function(message) {

        if (message.event === 'auth.success') {

            this._token = message.data.token;
            this.logged = true;

            this._auth.className = 'auth-sign-out';

            if (Selector.id('auth-remember-me').checked) {
                Cookie.set('cis_token', encodeURIComponent(this._token));
                Cookie.set('cis_username', encodeURIComponent(this._username));
            } else {
                Cookie.delete('cis_token');
                Cookie.delete('cis_username');
            }

            Selector.query('#auth-sign-out > span').innerHTML = this._username;
            Toast.open({
                type: 'success'
                , text: 'authentication was successful. You are ' + this._username
                , delay: 2
            });

        } else if (message.event === 'auth.error.wrong_credentials') {

            Toast.open({
                type: 'error'
                , text: 'wrong login or password'
                , button_close: true
            });

        } else if (message.event === 'auth.logout_success') {

            this._auth.className = 'auth-sign-in';

            this._token = null;
            this._username = null;
            this._pass = null;
            this.logged = false;

            Cookie.delete('cis_token');
            Cookie.delete('cis_username');

        } else {
            Toast.open({
                type: 'error'
                , text: 'Unexpected message was found' + message
                , button_close: true
            });
        }
    }
};

addEvent(window, 'load', function() {
    Auth.init();
});

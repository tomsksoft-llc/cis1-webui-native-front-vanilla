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
 *      @param {object} data  - message (for success sign in)
 *          @param {string} group - request initiator
 *          @param {string} token - token of user
 */

var Auth = {

    _elements: {
        auth: null
        , username: null
        , pass: null
        , remember: null
    }
    , _token: null
    , logged: false

    , init: function () {

        this._elements.auth = Selector.id('auth');
        this._elements.username = Selector.id('auth-username');
        this._elements.pass = Selector.id('auth-password');
        this._elements.remember = Selector.id('auth-remember-me');

        Socket.send({
            event: 'auth.token'
            , transactionId: (new Date()).getTime()
            , data: {
                token: decodeURIComponent(Cookie.get('cis_token'))
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
                token: this._token
            }
        });
    }

    , onmessage: function(message) {

        if (message.event === 'auth.success') {

            this._token = message.data.token;
            this.logged = true;

            if (this._elements.remember.checked && this._elements.username.value) {
                Cookie.set('cis_token', encodeURIComponent(this._token));
                Cookie.set('cis_username ', encodeURIComponent(this._elements.username.value));
            }

            var username = this._elements.username.value || decodeURIComponent(Cookie.get('cis_username'));
            Selector.query('#auth-sign-out > span').textContent += ' ' + username;
            Toast.open({
                type: 'success'
                , text: 'authentication was successful. You are ' + username
                , delay: 2
            });

            this._elements.auth.className = 'sign-out';

        } else if (message.event === 'auth.error.wrong_credentials') {

            if (this._elements.username.value) {
                Toast.open({
                    type: 'error'
                    , text: 'wrong login or password'
                    , button_close: true
                });
            }

            this._elements.auth.className = 'sign-in';

        } else if (message.event === 'auth.logout_success') {

            this._token = null;
            this.logged = false;

            Cookie.delete('cis_token');
            Cookie.delete('cis_username');

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
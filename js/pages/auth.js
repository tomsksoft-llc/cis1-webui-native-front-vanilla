/**
 * Authenticate
 *
 * @param {string} _token    - user account key
 * @param {string} _username
 * @param {boolean} logged   - user logged in
 * Methods:
 *     signInByLogPass - sign in by login and password
 *     signInByToken   - sign in by token
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

    _token: null
    , _username: null
    , logged: false

    , signInByLogPass: function() {
        if ( ! Selector.id('username').value) {
            Toast.open({
                type: 'info'
                , text: 'Please enter your login'
                , button_close: true
            });
            return;
        }
        if ( ! Selector.id('password').value) {
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
                username: Selector.id('username').value
                , pass: Selector.id('password').value
            }
        });
    }

    , signInByToken: function() {
        if ( Cookie.get('cis_token') ) {
            Socket.send({
                event: 'auth.token'
                , transactionId: (new Date()).getTime()
                , data: {
                    token: decodeURIComponent(Cookie.get('cis_token'))
                }
            });
        }
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

    , onmessage: function(message){
        switch (message.event) {

            // for authenticate by login/pass/token
            case 'auth.success':

                this._token = message.data.token;
                this._username = Selector.id('username').value || encodeURIComponent(Cookie.get('cis_username'));
                this.logged = true;

                if (Selector.id('username').value) {
                    if (Selector.query('#auth input[type=checkbox]').checked) {
                        Cookie.set('cis_token', encodeURIComponent(this._token));
                        Cookie.set('cis_username', encodeURIComponent(this._username));
                    } else {
                        Cookie.delete('cis_token');
                        Cookie.delete('cis_username');
                    }
                }

                Selector.query('#sign-out > span').innerHTML = this._username;
                Toast.open({
                    type: 'success'
                    , text: 'authentication was successful. You are ' + this._username
                    , delay: 2
                });

                Selector.id("auth").className = "sign-out";

                break;

            case 'auth.error.wrong_credentials':

                Toast.open({
                    type: 'error'
                    , text: 'wrong login or password'
                    , button_close: true
                });

                break;

            // for exit
            case 'auth.logout_success':

                this._token = null;
                this._username = null;
                this.logged = false;

                Cookie.delete('cis_token');
                Cookie.delete('cis_username');

                Selector.id("auth").className = "sign-in";

                break;

            default:

                Toast.open({
                    type: 'error'
                    , text: 'Unexpected message was found' + message
                    , button_close: true
                });
        }
    }
};

addEvent(window, 'load', function() {
    Auth.signInByToken();
});

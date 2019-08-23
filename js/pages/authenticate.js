var person = (function () {
    var _token = Cookie.get('cis_token');
    var _personality = false;

    // getDataFromCookie = function() {
    //     console.log(Selector.id('authenticate').outerHTML);
    //     Selector.queryAll('#wrapperForm input').forEach(function (item) {
    //         if (Cookie.get('cis_' + item.id)) {
    //             item.value = decodeURIComponent(Cookie.get('cis_' + item.id));
    //         }
    //     });
    // };
    authenticateByToken = function (){
        if (_token) {
            _request_token = {
                event: 'auth.token'
                , transactionId: new Date().getTime()
                , data: {
                    token: decodeURIComponent(Cookie.get('cis_token'))
                }
            };
            console.log('requestToken ' + JSON.stringify(_request_token));
            Socket._events.push(_request_token);
        }
    };
    addEvent(window, 'load', function() {
        authenticateByToken();
        // getDataFromCookie();
    });

    signInPerson = function () {
        if (!Selector.id('username').value) {
            Toast.open({
                type: 'info'
                , text: 'Please enter your login'
                , button_close: true
            });
            return;
        }
        if (!Selector.id('password').value) {
            Toast.open({
                type: 'info'
                , text: 'Please enter your password'
                , button_close: true
            });
            return;
        }

        Selector.queryAll('#wrapperForm input').forEach(function (item) {
            Cookie.delete('cis_' + item.id);
            if (Selector.query('input[type=checkbox]').checked) {
                Cookie.set('cis_' + item.id, decodeURIComponent(item.value));
            }
        });

        _request_log_pass = {
            event: 'auth.login_pass'
            , transactionId: new Date().getTime()
            , data: {
                username: Selector.id('username').value
                , pass: Selector.id('password').value
            }
        };
        console.log('requestLogPas ' + JSON.stringify(_request_log_pass));
        Socket.send(_request_log_pass);
    };

    authenticationSuccessful = function(message){
        Toast.open({
            type: 'success'
            , text: 'authentication was successful. you are ' + encodeURIComponent(Cookie.get('cis_username'))
            , delay: 2
        });

        Selector.id('signOut').firstChild.nodeValue = 'You are ' + decodeURIComponent(Cookie.get('cis_username'));

        _token = message.data.token;
        if (Selector.query('input[type=checkbox]').checked){
            Cookie.set('cis_token', encodeURIComponent(_token));
        }
        else {
            Cookie.delete('cis_token');
        }

        toggleBlockOfSignInOrSignOut();

        _personality = true;
    };

    exitPerson = function(){
        _request_out = {
            event: 'auth.logout'
            , transactionId: new Date().getTime()
            , data: {
                token: _token
            }
        };
        console.log('requestOut ' + JSON.stringify(_request_out));
        Socket.send(_request_out);

        Cookie.delete('cis_token');

        _personality = false;
    };

    toggleBlockOfSignInOrSignOut = function() {
        Selector.queryAll('#authenticate > div:nth-child(n+2)').forEach(function (item) {
            item.toggleClass('hide');
        });
    };

    //pablic method
    return {
        signInPersone: signInPerson
        , getAnswer: function(message){
            switch (message.event) {

                // for authenticate by login/pass/token
                case 'auth.success':
                    authenticationSuccessful(message);
                    break;
                case 'auth.error.wrong_credentials':
                    Toast.open({
                        type: 'error'
                        , text: 'wrong login or password'
                        , button_close: true
                    });
                    break;

                // for authenticate Exit
                case 'auth.logout_success':
                    toggleBlockOfSignInOrSignOut();
                    break;

                default:
                    Toast.open({
                        type: 'error'
                            , text: 'Unexpected message was found' + message
                            , button_close: true
                        });
                }
        }
        , exitPerson: exitPerson
        , getPersonality: function () {
            return _personality;
        }
    }
})();
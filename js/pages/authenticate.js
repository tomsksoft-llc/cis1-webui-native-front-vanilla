var Auth = {
    _token: null
    , logged: false
    , _remember: true

    , sign_in_by_log_pass: function() {
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
            , transactionId: ( new Date() ).getTime()
            , data: {
                username: Selector.id('username').value
                , pass: Selector.id('password').value
            }
        });
        console.log(JSON.stringify({event: 'auth.login_pass'
                    , transactionId: ( new Date() ).getTime()
                    , data: {
                        username: Selector.id('username').value
                        , pass: Selector.id('password').value
                    }}))

    }

    , sign_in_by_token: function() {
        if ( Cookie.get('cis_token') ) {
            Socket._events.push({
                event: 'auth.token'
                , transactionId: ( new Date() ).getTime()
                , data: {
                    token: decodeURIComponent( Cookie.get('cis_token') )
                }
            });
        }
        // console.log(JSON.stringify({event: 'auth.token'
        //     , transactionId: ( new Date() ).getTime()
        //     , data: {
        //         token: decodeURIComponent( Cookie.get('cis_token') )
        //     }}))
    }

    , sign_out: function() {
        Socket.send({
            event: 'auth.logout'
            , transactionId: ( new Date() ).getTime()
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
                this.logged = true;
                if ( ! Selector.query('#authenticate input[type=checkbox]').checked){
                    this._remember = false;
                }

                if (this._remember){
                    Cookie.set('cis_token', encodeURIComponent(this._token));
                    Selector.queryAll('#wrapper-form input')
                        .forEach(function (item) {
                            if (item.value) {
                                Cookie.set('cis_' + item.id, encodeURIComponent(item.value));
                            }
                        });
                } else {
                    Cookie.delete('cis_token');
                    Selector.queryAll('#wrapper-form input')
                        .forEach(function (item) {
                            Cookie.delete('cis_' + item.id);
                        });
                }

                Selector.query('#sign-out > span').innerHTML
                    = decodeURIComponent(Cookie.get('cis_username')
                );

                Toast.open({
                    type: 'success'
                    , text: 'authentication was successful. you are '
                        + encodeURIComponent( Cookie.get('cis_username') )
                    , delay: 2
                });

                enterOrExit();

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
                this.logged = false;

                Cookie.delete('cis_token');

                enterOrExit();

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
    Auth.sign_in_by_token();
});

function enterOrExit() {
    Selector.queryAll('#authenticate > div:nth-child(n+2)').forEach(function (item) {
        item.toggleClass('hide');
    });
}
window.onload = function (){
    console.log(Selector.id('authenticate').outerHTML);
    Selector.queryAll('#wrapperForm input')
        .forEach(function (item) {
            item.value = encodeURIComponent( Cookie.get('cis_' + item.id));
        });
};
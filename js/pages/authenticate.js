var token = '';

addEvent(window, 'load', function() {
    console.log(Socket);
    rememberDataFromCookie();
    authenticateByToken();
});

function rememberDataFromCookie() {
    Selector.queryAll('#wrapperForm input').map(function (item) {
        if (Cookie.get('cis_' + item.id)) {
            item.value = Cookie.get('cis_' + item.id);
        }
    });
}

function authenticateByToken(){
    if (Cookie.get('cis_token') !== '') {
        request_token = {
            event: 'auth.token'
            , transactionId: new Date().getTime()
            , data: {
                token: decodeURIComponent(Cookie.get('cis_token'))
            }
        };
        console.log('requestToken ' + JSON.stringify(request_token));
        Socket._events.push(request_token);
    }
}

function signInPerson() {
    if ( ! Selector.id('username').value) {
        alert('Please enter your login');
        return;
    }
    if ( ! Selector.id('password').value) {
        alert('Please enter your password');
        return;
    }

    Selector.queryAll('#wrapperForm input').forEach(function (item) {
        Cookie.delete('cis_' + item.id);
        if (Selector.query('input[type=checkbox]').checked) {
            Cookie.set('cis_' + item.id, item.value);
        }
    });

    request_log_pass = {
        event: 'auth.login_pass'
        , transactionId: new Date().getTime()
        , data: {
            username: Selector.id('username').value
            , pass: Selector.id('password').value
        }
    };
    console.log('requestLogPas ' + JSON.stringify(request_log_pass));
    Socket.send(request_log_pass);
}

function authenticationSuccessful(message){
    Selector.id('person').firstChild.nodeValue = 'You are ' + Selector.id('username').value;

    token = message.data.token;
    if (Selector.query('input[type=checkbox]').checked){
        Cookie.set('cis_token', encodeURIComponent(token));
    }
    else {
        Cookie.delete('cis_token');
    }

    toggleBlockOfSignInOrSignOut();
}

function exitPerson(){
    request_out = {
        event: 'auth.logout'
        ,transactionId: new Date().getTime()
        ,data: {
            token: token
        }
    };
    console.log('requestOut ' + JSON.stringify(request_out));
    Socket.send(request_out);

    toggleBlockOfSignInOrSignOut();

    Cookie.delete('cis_token');
}

function toggleBlockOfSignInOrSignOut() {
    Selector.queryAll('#authenticate > div:nth-child(n+2)').map(function (item) {
        item.toggleClass('hide');
    });
}
function rememberDataFromCookie() {
    try {
        if (Cookie.get('cis_login')) {
            document.getElementById('username').value = Cookie.get('cis_login');
        }
        if (Cookie.get('cis_pass')) {
            document.getElementById('password').value = Cookie.get('cis_pass');
        }
    } catch(e){
        return;
    }
}
function authenticateByToken(){
    // console.log ('Token = ' + Cookie.get('cis_token'));
    try {
        if (Cookie.get('cis_token') != '') {
            request_token = {
                event: 'auth.token'
                , transactionId: new Date().getTime()
                , data: {
                    token: decodeURIComponent(Cookie.get('cis_token'))
                }
            };
            console.log('requestToken ' + JSON.stringify(request_token));
            Socket.send(request_token);
        }
    } catch (e) {
        return;
    }
}

var token = '';
setTimeout(rememberDataFromCookie,.05 * 1000);
setTimeout(function () {
    if(window.Socket !== undefined) {
        try {
            if (Socket.opened) {
                authenticateByToken();
            }
        } catch (e) {
        }
    }
},0.15 * 1000);

function signInPerson() {
    form = document.getElementById('signIn');
    remember = document.querySelector('input[type=checkbox]');
    if (!document.getElementById('username')) {
        alert('Please enter your login');
        return;
    }
    if (!document.getElementById('password')) {
        alert('Please enter your password');
        return;
    }
    Cookie.delete('cis_login');
    Cookie.delete('cis_pass');
    if (remember.checked) {
        Cookie.set('cis_login', document.getElementById('username').value);
        Cookie.set('cis_pass', document.getElementById('password').value);
    }
    request_log_pass = {
        event: 'auth.login_pass'
        , transactionId: new Date().getTime()
        , data: {
            username: document.getElementById('username').value
            , pass: document.getElementById('password').value
        }
    };
    console.log('requestLogPas ' + JSON.stringify(request_log_pass));
    Socket.send(request_log_pass);
}
function authenticationSuccessful(message){
    form = document.getElementById('signIn');
    person = document.getElementById('person');
    person.firstChild.nodeValue = 'You are ' + document.getElementById('username').value;
    form.classList.toggle('blockOfSignInOrSignOut');
    person.classList.toggle('blockOfSignInOrSignOut');
    token = message.data.token;
    if (!document.querySelector('input[type=checkbox]').checked){
        Cookie.delete('cis_token');
    }
    else {
        Cookie.set('cis_token', encodeURIComponent(token));
    }
}
function exitPerson(){
    request_out = {
        event: 'auth.logout'
        ,transactionId: new Date().getTime()
        ,data: {
            token: token
        }
    };
    Cookie.delete('cis_token');
    console.log('requestOut ' + JSON.stringify(request_out));
    Socket.send(request_out);
    document.getElementById('signIn').classList.toggle('blockOfSignInOrSignOut');
    document.getElementById('person').classList.toggle('blockOfSignInOrSignOut');
}
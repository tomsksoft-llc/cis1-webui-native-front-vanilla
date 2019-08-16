function rememberData() {
    try{
        form = document.getElementById("login_form");
        if(Cookie.get("cis_login")) {
            form.elements.username.value = Cookie.get("cis_login");
        }
        if(Cookie.get("cis_pass")) {
            form.elements.password.value = Cookie.get("cis_pass");
        }
    }catch(e){
        return;
    }
}
function authenticateByToken(){
    console.log("Token = " + Cookie.get("cis_token"));
    try{
        if(Cookie.get("cis_token") && Cookie.get("cis_token") != null) {
            requestToken = {
                event: "auth.token",
                transactionId: new Date().getTime(),
                data: {
                    token: Cookie.get("cis_token") + "="
                }
            };
            console.log("requestToken " + JSON.stringify(requestToken));
            Socket.send(requestToken);
        }
    }catch (e) {
        return;
    }
}

setTimeout(rememberData,50);
setTimeout(function () {
    if(window.Socket !== undefined) {
        try {
            if (Socket.opened) {
                authenticateByToken();
            }
        } catch (e) {
        }
    }
},150);


var token = null;
// var remember = true;
// alert("start " + Cookie.get("cis_token"));

function send_login() {
    form = document.getElementById("login_form");
    remember = form.elements.remember.checked;

    if (form.elements.username.value == "") {
        alert("Please enter your login");
        return;
    }
    if (form.elements.password.value == "") {
        alert("Please enter your password");
        return;
    }
    Cookie.delete("cis_login");
    Cookie.delete("cis_pass");
    if (remember) {
        Cookie.set("cis_login", form.elements.username.value);
        Cookie.set("cis_pass", form.elements.password.value);
    }

    requestInLogPass = {
        event: "auth.login_pass",
        transactionId: new Date().getTime(),
        data: {
            username: form.elements.username.value,
            pass: form.elements.password.value
        }
    }
    // console.log("requestLogPas " + JSON.stringify(requestInLogPass));
    Socket.send(requestInLogPass);
}
function authenticationSuccessful(message){
    // console.log(message);
    username = document.getElementById("login_form").elements.username.value;
    form = document.getElementById("login_form");
    person = document.getElementById("person");
    signOut = document.getElementById("signOut");
    person.innerHTML = "You are " + username;
    person.appendChild(signOut);
    form.classList.toggle("blockNone");
    person.classList.toggle("blockNone");
    token = message.data.token;
    if (document.getElementById("login_form").remember.checked) {
        Cookie.delete("cis_token");
        Cookie.set("cis_token", String(token));
        // console.log("Занесли в Куки " + Cookie.get("cis_token"));
    }
    else{
        // console.log("Удалили из Куки " + Cookie.get("cis_token"));
        Cookie.delete("cis_token");
    }
}

function exitPerson(){
    form = document.getElementById("login_form");
    person = document.getElementById("person");
    form.classList.toggle("blockNone");
    person.classList.toggle("blockNone");
    requestOut = {
        event: "auth.logout",
        transactionId: new Date().getTime(),
        data: {
            token: token
        }
    }
    token = null;
    console.log("requestOut " + JSON.stringify(requestOut));
    Socket.send(requestOut);
}


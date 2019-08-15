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

setTimeout(rememberData,50);

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

    request = {
        event: "auth.login_pass",
        transactionId: new Date().getTime(),
        data: {
            username: form.elements.username.value,
            pass: form.elements.password.value
        }
    }
    // console.log("request " + JSON.stringify(request));
    Socket.open();
    Socket.send(request);
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
}

function exitPerson(){
    form = document.getElementById("login_form");
    person = document.getElementById("person");
    form.classList.toggle("blockNone");
    person.classList.toggle("blockNone");
}


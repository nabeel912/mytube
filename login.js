// Credential response handler function
function handleCredentialResponse(response) {
    // decodeJwtResponse() is a custom function defined by you
    // to decode the credential response.
    const responsePayload = decodeJwtResponse(response.credential);

    /*
    console.log("ID: " + responsePayload.sub);
    console.log('Full Name: ' + responsePayload.name);
    console.log('Given Name: ' + responsePayload.given_name);
    console.log('Family Name: ' + responsePayload.family_name);
    console.log("Image URL: " + responsePayload.picture);
    console.log("Email: " + responsePayload.email);
    */
    document.cookie = "_id=" + responsePayload.sub;
    setCookie("_id", responsePayload.sub, 365);
    var profile = {name: responsePayload.given_name, picture: responsePayload.picture};
    setCookie('_profile', JSON.stringify(profile));
    toggle_login();
}

function removeCookie(sKey, sPath, sDomain) {
    document.cookie = encodeURIComponent(sKey) +
        "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" +
        (sDomain ? "; domain=" + sDomain : "") +
        (sPath ? "; path=" + sPath : "");
}

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

// Sign out the user
function signOut() {
    removeCookie('_id');
    removeCookie('_profile');
    toggle_login();
}
function decodeJwtResponse(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}
function toggle_login() {
    var _id = getCookie('_id');
    if (_id) {
        $('#login_google').hide();
        $('#user_profile').show();
        var profile = getCookie('_profile') || '{}';
        profile = JSON.parse(profile);
        $('#profile_name').text(profile.name);
        $('#profile_picture').attr('src', profile.picture);
    } else {
        $('#login_google').show();
        $('#user_profile').hide();
        $('#profile_name').text('');
        $('#profile_picture').attr('src', '');
    }
}

$(function() {
    toggle_login();
})
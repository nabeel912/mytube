const firebaseConfig = {
    apiKey: "AIzaSyBFltYK1UzAdp6sTKP8GD_64dgNyQ-kU1Y",
    authDomain: "mytube-cf6cd.firebaseapp.com",
    projectId: "mytube-cf6cd",
    databaseURL: "https://mytube-cf6cd-default-rtdb.firebaseio.com",
    storageBucket: "mytube-cf6cd.appspot.com",
    messagingSenderId: "299922681199",
    appId: "1:299922681199:web:8a72024f41c424691bcc9a",
    measurementId: "G-D6FDH1Q2BE"
};
firebase.initializeApp(firebaseConfig);

var database = firebase.database();

function save_to_cloud(_id, data) {
    database.ref(_id).set(
        data
    );
}


function load_from_cloud(_id) {
    return new Promise((resolve) => {
        database.ref(_id).once('value', function (snapshot) {
            var data = snapshot.val();
            resolve(data);
        });
    });
}
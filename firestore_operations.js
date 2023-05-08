const firebase = require("firebase/compat/app");
require("firebase/compat/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyA5EGkJrJqWXhia3d9NtQyb4B4i6XzubZE",
    authDomain: "alacartappv0.firebaseapp.com",
    projectId: "alacartappv0",
    storageBucket: "alacartappv0.appspot.com",
    messagingSenderId: "362158279729",
    appId: "1:362158279729:web:0998d4ee9d403e69f8d910",
  };

function initialize(){
    firebase.initializeApp(firebaseConfig);
    return firebase.firestore();
}





function writeData(data){
    db.collection("dishes")
      .add(data)
      .then((docRef) => {
        console.log("Document written with ID: ", docRef.id);
      })
      .catch((error) => {
        console.error("Error adding document: ", error);
      });
    }


module.exports = {

    initialize,
    writeData
}
const firebase = require('firebase/compat/app');
require('firebase/compat/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyA5EGkJrJqWXhia3d9NtQyb4B4i6XzubZE",
    authDomain: "alacartappv0.firebaseapp.com",
    projectId: "alacartappv0",
    storageBucket: "alacartappv0.appspot.com",
    messagingSenderId: "362158279729",
    appId: "1:362158279729:web:0998d4ee9d403e69f8d910"
  };


firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

let addIn = document.getElementById("addIngredient")
let newIn = document.getElementById("newIngredient")
let btnSend = document.getElementById("send")


addIn.addEventListener('click', () => {
    newIn.innerHTML += '<label for="ing">Ingrediente</label> <input type="text" name="ing" id="ing"> <br> <br>'
})

btnSend.addEventListener('click', () =>{
    
    let name = document.getElementById("nombre").value
    let desc = document.getElementById("desc").value
    let url = document.getElementById("url").value
    
    data = {
        name: name, 
        description: desc,
        image_url: url

    }


// Read data from a collection
db.collection("dishes").add(data)
  .then((docRef) => {
    console.log("Document written with ID: ", docRef.id);
  })
  .catch((error) => {
    console.error("Error adding document: ", error);
  });
})


  


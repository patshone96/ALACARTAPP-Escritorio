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

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

let addIn = document.getElementById("addIngredient");
let newIn = document.getElementById("newIngredient");
let btnSend = document.getElementById("send");
let btnDelete = document.getElementById("delete");

btnDelete.addEventListener("click", () => {
  let name = document.getElementById("nombre").value;

  // Get a reference to the Firestore collection
  const collectionRef = firebase.firestore().collection("dishes");

  // Use query methods to filter documents based on other field values
  const query = collectionRef.where("name", "==", `${name}`);

  // Retrieve documents based on the query
  query
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        // Access document data
        console.log(doc.id, "=>", doc.data());

        // Get a reference to the document you want to delete by document ID
        const documentId = doc.id;
        const documentRef = collectionRef.doc(documentId);

        // Delete the document
        documentRef
          .delete()
          .then(() => {
            console.log("Document successfully deleted!");
          })
          .catch((error) => {
            console.error("Error deleting document:", error);
          });
      });
    })
    .catch((error) => {
      console.error("Error getting documents:", error);
    });
});

//Add new Ingredients when pressing the ADD button
let ingredientCount = 0;
addIn.addEventListener("click", () => {
  newIn.innerHTML += `<label for="ing${ingredientCount}">
    Ingrediente ${ingredientCount}:</label> 
    <input type="text" name="ing${ingredientCount}" 
    id="ing${ingredientCount}"> <br> <br>`;
  ingredientCount++;
});

//Write the values introduced to the DB
btnSend.addEventListener("click", () => {
  //retrieve the values of the variables
  let name = document.getElementById("nombre").value;
  let desc = document.getElementById("desc").value;
  let url = document.getElementById("url").value;

  //Validate the input values
  let valid = true;

  if (name === "" || desc === "" || url === "") {
    valid = false;
  }

  // //Unique constraint on the name
  //      const collectionRef = firebase.firestore().collection('dishes');

  //      // Use query methods to filter documents based on other field values
  //      const query = collectionRef.where('name', '==', `${name}`);

  //      // Retrieve documents based on the query
  //      query.get()
  //        .then((querySnapshot) => {
  //          querySnapshot.forEach((doc) => {
  //            // Access document data
  //            alert("El nombre del plato ya se ha introducido")
  //           valid = false;
  //          });
  //        })
  //        .catch((error) => {
  //          valid = true;
  //        });

  if (valid) {
    //Generate a JSON object
    data = {
      name: name,
      description: desc,
      image_url: url,
    };

    // Read data from a collection
    db.collection("dishes")
      .add(data)
      .then((docRef) => {
        console.log("Document written with ID: ", docRef.id);
        ingredientCount = 0;
        newIn.innerHTML = "";
      })
      .catch((error) => {
        console.error("Error adding document: ", error);
      });
  } else {
    alert("Error");
  }
});

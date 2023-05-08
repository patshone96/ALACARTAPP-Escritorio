const database = require("./firestore_operations")


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

//let db = database.initialize()


let addIn = document.getElementById("addIngredient");
let newIn = document.getElementById("newIngredient");
let btnSend = document.getElementById("send");
let btnDelete = document.getElementById("delete");
let btnUpdate= document.getElementById("update");
let btnRead = document.getElementById("read");

let name = document.getElementById("nombre");
let desc = document.getElementById("desc");
let url = document.getElementById("url");

btnUpdate.addEventListener('click', () => {

  let name = document.getElementById("nombre").value;

   //Unique constraint on the name
       const collectionRef = db.collection('dishes') 
         // Use query methods to filter documents based on other field values
       const query = collectionRef.where('name', '==', `${name}`);   


       // Retrieve documents based on the query
       query.get()
         .then((querySnapshot) => {
           querySnapshot.forEach((doc) => {
             // Access document data
           
             const jsonArray = []
              querySnapshot.docs.forEach(doc => {
                const docData = doc.data()
                const id = doc.id; 
                jsonArray.push(docData)
              })
              const jsonObject = {data: jsonArray}
              //const jsonString = JSON.stringify(jsonObject)


              name.value = jsonObject.data[0].name
              desc.value = jsonObject.data[0].description
              url.value = jsonObject.data[0].image_url

           });
         })
         .catch((error) => {
           console.log(error); 
         });

})

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
    <input type="text" class="ing" name="ing${ingredientCount}" 
    id="ing${ingredientCount}"> <br> <br>`;
  ingredientCount++;
});

//Write the values introduced to the DB
btnSend.addEventListener("click", () => {
  //retrieve the values of the variables
  let name = document.getElementById("nombre").value;
  let desc = document.getElementById("desc").value;
  let url = document.getElementById("url").value;
  let ingredientNode = document.querySelectorAll('.ing');
  let alergenNode = document.querySelectorAll('.allergen'); 
  let dietNode = document.querySelectorAll('.diet'); 
  let price = Number(document.getElementById("precio").value); 

  let ingredients = new Array(); 
  let alergens = new Array(); 
  let diets = new Array(); 

  ingredientNode.forEach(p => {
    ingredients.push(p.value)
  })

  alergenNode.forEach(p => {
    if(p.checked) alergens.push(p.id); 
  })

  dietNode.forEach(p => {
    if(p.checked) diets.push(p.id); 
  })


  //Validate the input values
  let valid = true;

  //Generate a JSON object
  data = {
    name: name,
    description: desc,
    image_url: url,
    ingredients: ingredients,
    allergens: alergens, 
    price: price,
    diet: diets
  };

  if (name === "" || desc === "" || url === "" || ingredients.length < 1 || price === null) {
    valid = false;
  }

  if(valid){
    
    // //Unique constraint on the name
       const collectionRef = firebase.firestore().collection('dishes');

       // Use query methods to filter documents based on other field values
       const query = collectionRef.where('name', '==', `${name}`);

       // Retrieve documents based on the query
       query.get()
         .then((querySnapshot) => {
           if(querySnapshot.empty){
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
           }else{
            alert(`Ya existe un plato llamado ${name}, pruebe con un nombre distinto`)
          } 
          })
         .catch((error) => {
           console.log(error)
         });
        }
  

    // Write data on a collection
    //database.writeData(data)

    
  
});

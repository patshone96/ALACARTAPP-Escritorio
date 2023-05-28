"use strict"

const firebase = require("firebase/app");
require("firebase/auth");
const { ipcRenderer } = require('electron');



const firebaseConfig = {
  apiKey: "AIzaSyA5EGkJrJqWXhia3d9NtQyb4B4i6XzubZE",
  authDomain: "alacartappv0.firebaseapp.com",
  projectId: "alacartappv0",
  storageBucket: "alacartappv0.appspot.com",
  messagingSenderId: "362158279729",
  appId: "1:362158279729:web:0998d4ee9d403e69f8d910",
  measurementId: "G-VGHL8RFBB4"
};


  let btnRegister = document.getElementById('register');
  let btnAccess= document.getElementById('access');
  
  firebase.initializeApp(firebaseConfig);

btnRegister.addEventListener('click', () => {
  // Sign up a new user with email and password
  let email = document.getElementById('mail').value
  let password = document.getElementById('pass').value
  let empresa = document.getElementById('emp').value

firebase.auth().createUserWithEmailAndPassword(email, password)
  .then((userCredential) => {
    // User creation successful
    const user = userCredential.user;
    console.log('User created:', user);
    // Send data to main process
    const data = { key: `${emp}` };
    ipcRenderer.send('data-channel', data);

  })
  .catch((error) => {
    // User creation failed
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error('Error creating user:', errorCode, errorMessage);
  });

})



btnAccess.addEventListener('click', () => {
  let email = document.getElementById('mail').value
  let password = document.getElementById('pass').value
  let empresa = document.getElementById('emp').value
// Sign in an existing user with email and password
firebase.auth().signInWithEmailAndPassword(email, password)
  .then((userCredential) => {
    // User sign-in successful
    const user = userCredential.user;
    console.log("User sign-in successful:", user);
    // Send data to main process
    const data = { key: `${emp}` };
    ipcRenderer.send('data-channel', data);
  })
  .catch((error) => {
    // Handle sign-in error
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("User sign-in error:", errorCode, errorMessage);
  });
}); 

// // Listen for authentication state changes
// onAuthStateChanged((user) => {
//   if (user) {
//     // User is signed in
//     console.log("User is signed in:", user);
//   } else {
//     // User is signed out
//     console.log("User is signed out");
//   }
// });

// // Sign out the current user
// signOut()
//   .then(() => {
//     // User sign-out successful
//     console.log("User sign-out successful");
//   })
//   .catch((error) => {
//     // Handle sign-out error
//     const errorCode = error.code;
//     const errorMessage = error.message;
//     console.error("User sign-out error:", errorCode, errorMessage);
//   });
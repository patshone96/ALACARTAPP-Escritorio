"use strict"

import firebase from 'firebase/app';
import './node_modules/firebase/auth/dist/index.cjs.js';


  const firebaseConfig = {
    apiKey: "AIzaSyA5EGkJrJqWXhia3d9NtQyb4B4i6XzubZE",
    authDomain: "alacartappv0.firebaseapp.com",
    projectId: "alacartappv0",
    storageBucket: "alacartappv0.appspot.com",
    messagingSenderId: "362158279729",
    appId: "1:362158279729:web:0998d4ee9d403e69f8d910",
    measurementId: "G-VGHL8RFBB4"
  };

  let email = document.getElementById('mail').value
  let password = document.getElementById('pass').value

  let btnRegister = document.getElementById('register');
  let btnAccess = document.getElementById('access');
  
  
  const app = initializeApp(firebaseConfig);
  const auth = firebase.auth(); 

btnRegister.addEventListener('click', () => {
  // Sign up a new user with email and password
auth.createUserWithEmailAndPassword(email, password)
.then((userCredential) => {
  // User sign-up successful
  const user = userCredential.user;
  console.log("User sign-up successful:", user);
})
.catch((error) => {
  // Handle sign-up error
  const errorCode = error.code;
  const errorMessage = error.message;
  console.error("User sign-up error:", errorCode, errorMessage);
});

})



// Sign in an existing user with email and password
auth.signInWithEmailAndPassword(email, password)
  .then((userCredential) => {
    // User sign-in successful
    const user = userCredential.user;
    console.log("User sign-in successful:", user);
  })
  .catch((error) => {
    // Handle sign-in error
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("User sign-in error:", errorCode, errorMessage);
  });

// Listen for authentication state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    console.log("User is signed in:", user);
  } else {
    // User is signed out
    console.log("User is signed out");
  }
});

// Sign out the current user
auth.signOut()
  .then(() => {
    // User sign-out successful
    console.log("User sign-out successful");
  })
  .catch((error) => {
    // Handle sign-out error
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("User sign-out error:", errorCode, errorMessage);
  });
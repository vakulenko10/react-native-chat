// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDRgVz6CVJHY0O43iKWps0K9JD0kDZygtw",
    authDomain: "my-chat-app-34613.firebaseapp.com",
    projectId: "my-chat-app-34613",
    storageBucket: "my-chat-app-34613.firebasestorage.app",
    messagingSenderId: "97797439715",
    appId: "1:97797439715:web:131f7d9f3b8afa5e3305d6",
    measurementId: "G-HNRR9D13ZC"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, app};
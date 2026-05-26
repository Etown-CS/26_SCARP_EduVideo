// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCv8lC4YdJdFXSdtPEVbwUclO4asrqXA58",
  authDomain: "eduvideo-dc74d.firebaseapp.com",
  projectId: "eduvideo-dc74d",
  storageBucket: "eduvideo-dc74d.firebasestorage.app",
  messagingSenderId: "669795034775",
  appId: "1:669795034775:web:7715aba65389afcdbeebd2",
  measurementId: "G-6XHS2WK8T1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA6JvmOJ5FbEDjw2pgZFcemdvh_Zo6C7aM",
  authDomain: "suga-adm.firebaseapp.com",
  projectId: "suga-adm",
  storageBucket: "suga-adm.firebasestorage.app",
  messagingSenderId: "207680956582",
  appId: "1:207680956582:web:411220f21abc478ccd2c67",
  measurementId: "G-ERCKT3ERSN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
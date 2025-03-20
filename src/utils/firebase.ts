import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMmY4RWziELUeotNHqfnp3oUeNO9_F6PM",
  authDomain: "familytree-eldo.firebaseapp.com",
  databaseURL: "https://familytree-eldo-default-rtdb.firebaseio.com",
  projectId: "familytree-eldo",
  storageBucket: "familytree-eldo.appspot.com",
  messagingSenderId: "45724906429",
  appId: "1:45724906429:web:bbeb52bbef07cc5f1098d4",
  measurementId: "G-M400JBEGN3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database }; 
import { initializeApp } from "firebase/app";
import { collection, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "clpd");
const userDataCollection = collection(db, "user-data");
const depositsCollection = collection(db, "deposits");
const redeemsCollection = collection(db, "redeems");

export { db, userDataCollection, depositsCollection, redeemsCollection };

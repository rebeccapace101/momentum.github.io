import { app } from './init.mjs';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

import { getFirestore, Timestamp, FieldValue, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"


const db = getFirestore();
const auth = getAuth();


export class habit {
    constructor(name, completed) {
        this.name = name;
        this.completed = completed;
    }
}


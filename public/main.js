// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js'
import { getFirestore, setDoc, doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCzKCBs3YtmB_V8kKi8RNQ-4VXC6Ny5VHI",
    authDomain: "notes-7b514.firebaseapp.com",
    projectId: "notes-7b514",
    storageBucket: "notes-7b514.appspot.com",
    messagingSenderId: "168718922117",
    appId: "1:168718922117:web:cb4748e8a6a176ee2314ec",
    measurementId: "G-9DVY3WPWY3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Get div references
const greeting = document.getElementById("greeting");
const signInBtn = document.getElementById("signIn");
const signOutBtn = document.getElementById("signOut");
const note = document.getElementById("note");

// Handle authentication
signInBtn.onclick = () => {
    signInWithPopup(auth, provider)
    .then(result => {
        if (result.user.displayName)
            greeting.innerText = "Hello " + result.user.displayName;
        else
            greeting.innerText = "Hello " + result.user.email;
        // set buttons
        signInBtn.hidden = true
        signOutBtn.hidden = false;
    }).catch(error => {
        alert("Error signing in", error);
    })
}

signOutBtn.onclick = () => {
    signOut(auth)
    .then(() => {
        greeting.innerText = "Hello";
        note.value = "";
        signInBtn.hidden = false;
        signOutBtn.hidden = true;
    }).catch(error => {
        alert("Error signing out");
    })
}

// Handle database reads and writes
let unsubscribe;
let timerId;
let key = 'note';
onAuthStateChanged(auth, user => {
    if (user) { // is signed in
        // set greeting
        greeting.innerText = "Hello " + user.displayName;
        // write
        const saveNote = () => {
            setDoc(doc(db, "things", user.uid), {
                [key]: note.value
            }, {merge: true})
        }
        // save when user hasn't made a change in 2 seconds
        note.oninput = () => {
            clearTimeout(timerId); // reset whenever user makes change
            timerId = setTimeout(saveNote, 2000);
        }
        // query
        unsubscribe = onSnapshot(doc(db, "things", user.uid), doc => {
            if (doc.data())
                note.value = doc.data().note;
        })
    } else {
        note.onchange = "";
        // call unsubscribe if variable defined
        unsubscribe && unsubscribe();
    }
})
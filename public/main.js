'use strict'

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
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

// Macro settings
const MAX_NOTE_CHARS = 10000;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Get div references
const greeting = document.getElementById("greeting");
const signInBtn = document.getElementById("signIn");
const signOutBtn = document.getElementById("signOut");
const note = document.getElementById("note");
const spinner = document.getElementById("spinner")

const signIn = (user) => {
    if (user.displayName) {
        greeting.innerText = "Hello " + user.displayName;
        setDoc(doc(db, "things", user.uid), {
            email: user.email,
            name: user.displayName
        }, { merge: true })
        note.readOnly = false;
    } else
        greeting.innerText = "Hello " + user.email;
    // set buttons
    signInBtn.hidden = true
    signOutBtn.hidden = false;
}

// Handle authentication
signInBtn.onclick = () => {
    signInWithPopup(auth, provider)
        .then(result => signIn(result.user))
        .catch(error => {
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

function setNote(element, user) {
    // unsubscribe from any active firestore queries
    unsubscribe && unsubscribe();
    key = element.id;
    note.readOnly = false;
    unsubscribe = onSnapshot(doc(db, "things", user.uid), doc => {
        if (doc.data() && doc.data()[key]) {
            note.value = doc.data()[key];
        } else {
            note.value = "";
        }
    })
}

// Handle database reads and writes
let unsubscribe;
let timerId;
let key = 'note1';
onAuthStateChanged(auth, user => {
    if (user) { // is signed in
        // set greeting
        signIn(user);
        // set note if selected
        let activeNote = document.querySelector("input[name='selected-note']:checked");
        if (activeNote) setNote(activeNote, user)

        const saveNote = () => {
            if (note.value.length > MAX_NOTE_CHARS) {
                alert("Message limit: 10,000 characters\nYour note: " + note.value.length);
                return;
            }
            setDoc(doc(db, "things", user.uid), {
                [key]: note.value
            }, { merge: true })
            spinner.hidden = true;
        }
        // save when user hasn't made a change in 2 seconds
        note.oninput = () => {
            spinner.hidden = false;
            clearTimeout(timerId); // reset whenever user makes change
            timerId = setTimeout(saveNote, 2000);
        }
        // Configure note selector
        let noteSelectors = document.querySelectorAll("input[type='radio'][name='selected-note']");
        noteSelectors.forEach(radio => {
            radio.addEventListener('change', event => setNote(event.target, user))
        })
    } else {
        note.onchange = "";
        // call unsubscribe if variable defined
        unsubscribe && unsubscribe();
    }
})

// Control dark mode
function handleTheme() {
    const getStoredTheme = () => localStorage.getItem('theme');
    const setStoredTheme = theme => localStorage.setItem('theme', theme);

    const getPreferredTheme = () => {
        const storedTheme = getStoredTheme();
        if (storedTheme) return storedTheme;
        
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    const themeSwitcher = document.getElementById('themeSwitcher')

    const setTheme = theme => {
        if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-bs-theme', 'dark')
        } else {
            document.documentElement.setAttribute('data-bs-theme', theme)
        }
    }

    // handle stored or prefferred theme
    setTheme(getPreferredTheme())

    themeSwitcher.onchange = (event) => {
        if (event.target.checked) {
            setTheme('dark')
            setStoredTheme('dark')
        }
        else {
            setTheme('light')
            setStoredTheme('light')
        }
    }
}

handleTheme();
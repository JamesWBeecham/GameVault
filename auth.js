import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBXF_dOg9s8DXrFxuOqAmX17_DItnFm5ac",
    authDomain: "gamevault-f258b.firebaseapp.com",
    projectId: "gamevault-f258b",
    storageBucket: "gamevault-f258b.appspot.com",
    messagingSenderId: "334354287514",
    appId: "1:334354287514:web:74444c604fc31647e68823",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');
let currentUserId = null;

document.addEventListener("DOMContentLoaded", () => {
    const loginButton = document.getElementById("login");
    const logoutButton = document.getElementById("logout");
    loginButton?.addEventListener("click", async (event) => {
        event.preventDefault();
        try {
            await signInWithPopup(auth, provider);
            alert("Login successful!");
            window.location.reload();
        } catch (error) {
            console.error("Error during login:", error.message);
            alert(`Error during login: ${error.message}`);
        }
    });

    logoutButton?.addEventListener("click", async (event) => {
        event.preventDefault();
        try {
            await signOut(auth);
            alert("Logged out");
            window.location.reload();
        } catch (error) {
            console.error("Error during logout:", error.message);
            alert(`Error during logout: ${error.message}`);
        }
    });
});

onAuthStateChanged(auth, async (user) => {
    const loginButton = document.getElementById("login");
    const logoutButton = document.getElementById("logout");
    const userEmail = document.getElementById("user-email");
    const profileLink = document.getElementById("profile-link");
    if (user) {
        currentUserId = user.uid;
        window.currentUserId = currentUserId;
        const emailPrefix = user.email.split('@')[0];
        const userDocRef = doc(db, "users", emailPrefix);
        try {
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    email: user.email,
                    displayName: user.displayName,
                    username: emailPrefix,
                    createdAt: Timestamp.now(),
                    isAdmin: false,
                    collection: [],
                    wishlist: [],
                    reviews: []
                });
            }
            const updatedUserDoc = await getDoc(userDocRef);
            const userData = updatedUserDoc.data();
            const username = userData.username || emailPrefix;
            if (userEmail) userEmail.textContent = `${username}`;
            if (logoutButton) logoutButton.style.display = 'inline';
            if (loginButton) loginButton.style.display = 'none';
            if (profileLink) {
                profileLink.href = `/gamevault/profile.html?user=${username}`;
                profileLink.textContent = "Profile";
            }
        } catch (error) {
            console.error("Error managing user document:", error.message);
        }
    } else {
        currentUserId = null;
        window.currentUserId = null;
        if (userEmail) userEmail.textContent = '';
        if (logoutButton) logoutButton.style.display = 'none';
        if (loginButton) loginButton.style.display = 'inline';
        if (profileLink) {
            profileLink.href = "/gamevault/profile.html";
            profileLink.textContent = "Profile";
        }
    }
});

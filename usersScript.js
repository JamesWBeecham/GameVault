import { db } from "./auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    const searchBar = document.getElementById("search-bar");
    const userList = document.getElementById("user-list");
    // grabs the users data from firebase
    async function fetchUsers() {
        try {
            const usersCollection = collection(db, "users");
            const userDocs = await getDocs(usersCollection);
            const users = userDocs.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            renderUsers(users);
            searchBar.addEventListener("input", () => {
                const query = searchBar.value.toLowerCase();
                const filteredUsers = users.filter(user =>
                    user.username.toLowerCase().includes(query)
                );
                renderUsers(filteredUsers);
            });
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }
    // renders the users from firebase, this is used on the users.html
    function renderUsers(users) {
        userList.innerHTML = "";
        if (users.length === 0) {
            userList.innerHTML = "<li>No users found</li>";
            return;
        }
        const baseUrl = "http://jameswbeecham.com/gamevault/";
        users.forEach(user => {
            const li = document.createElement("li");
            li.classList.add("user-item");
            const userLink = document.createElement("a");
            userLink.href = `${baseUrl}profile.html?user=${user.username}`;
            userLink.textContent = user.username;
            const collectionSize = user.collection ? user.collection.length : 0;
            const wishlistSize = user.wishlist ? user.wishlist.length : 0;
            const reviewsCount = user.reviews ? user.reviews.length : 0;
            const userStats = document.createElement("div");
            userStats.classList.add("user-stats");
            userStats.innerHTML = `
                <p>Collection Size: ${collectionSize}</p>
                <p>Wishlist Size: ${wishlistSize}</p>
                <p>Reviews Written: ${reviewsCount}</p>`;
            li.appendChild(userLink);
            li.appendChild(userStats);
            userList.appendChild(li);
        });
    }
    fetchUsers();
});
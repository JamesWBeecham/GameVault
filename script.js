//script.js
import { db, auth } from "./auth.js";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// grabs the users firebase doc
async function getUserDocByUsername(username) {
    const userDocRef = doc(db, "users", username);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        return userDoc;
    } else {
        throw new Error(`User document with username '${username}' not found.`);
    }
}

//loads the users games in their collection
async function loadCollection() {
    const collectionList = document.getElementById("collectionList");
    const collectionHeader = document.querySelector("#collection-section h3");
    if (!collectionList || !collectionHeader) {
        console.error("Error: Collection List or Section elements not found.");
        return;
    }
    if (!window.profileUsername) {
        collectionList.innerHTML = "<p>Unable to load collection. Username is missing.</p>";
        return;
    }
    try {
        const userDoc = await getUserDocByUsername(window.profileUsername);
        const userData = userDoc.data();
        const collection = userData.collection || [];
        collectionHeader.innerHTML = `Total Games In Collection: ${collection.length}`;
        if (collection.length === 0) {
            collectionList.innerHTML = "<p>Your collection is currently empty.</p>";
            return;
        }
        const gameDetailsPromises = collection.map(async (item) => {
            const gameDoc = await getDoc(doc(db, "GamesDB", item.objectID));
            if (gameDoc.exists()) {
                return { ...gameDoc.data(), status: item.status };
            }
            return null;
        });
        const gameDetails = (await Promise.all(gameDetailsPromises)).filter(Boolean);
        displayCollection(gameDetails);
    } catch (error) {
        console.error("Error loading collection:", error.message);
        collectionList.innerHTML = `<p>Error loading collection: ${error.message}</p>`;
    }
}

//renders the users games in their collection
function displayCollection(collection) {
    const collectionList = document.getElementById("collectionList");
    collectionList.innerHTML = ""; 
    collection.forEach((game) => {
        const gameElement = document.createElement("li");
        gameElement.classList.add("ais-Hits-item");
        const isOwner = auth.currentUser && auth.currentUser.email.split('@')[0] === window.profileUsername;
        gameElement.innerHTML = `
            <div class="image">
                <img src="${game.CoverArt}" alt="${game.Game} Cover Art">
            </div>
            <div class="details">
                <div class="hit-title">
                    <a href="game.html?id=${game.objectID}">${game.Game}</a>
                </div>
                <div class="game-year">Year: ${game.Year || 'N/A'}</div>
                <div class="game-platform">Platform: ${game.Platform || 'N/A'}</div>
                <div class="game-status">Status: ${game.status || 'Unknown'}</div> <!-- Added status -->
            </div>
            ${isOwner ? `
            <div class="buttons-and-condition">
                <button class="remove-from-collection" data-game-id="${game.objectID}">
                    Remove from Collection
                </button>
            </div>` : ""}
        `;
        if (isOwner) {
            gameElement.querySelector(".remove-from-collection").addEventListener("click", () => {
                removeFromCollection(game.objectID, game);
            });
        }
        collectionList.appendChild(gameElement);
    });
}

//lets users remove games from their collection
async function removeFromCollection(gameId, gameDetails) {
    if (!auth.currentUser) {
        alert("Please log in to modify your collection.");
        return;
    }
    const username = auth.currentUser.email.split('@')[0];
    const userDocRef = doc(db, "users", username);
    try {
        await updateDoc(userDocRef, {
            collection: arrayRemove({ objectID: gameId, status: gameDetails.status }),
        });
        alert("Game removed from your collection!");
        loadCollection();
    } catch (error) {
        console.error("Error removing game from collection:", error.message);
        alert("Failed to remove game. Please try again.");
    }
}

//loads the users wishlist games
async function loadWishlist() {
    const wishlistList = document.getElementById("wishlistList");
    const wishlistHeader = document.querySelector("#wishlist-section h3"); 
    if (!wishlistList || !wishlistHeader) {
        console.error("Error: Wishlist List or Section elements not found.");
        return;
    }
    if (!window.profileUsername) {
        wishlistList.innerHTML = "<p>Unable to load wishlist. Username is missing.</p>";
        return;
    }
    try {
        const userDoc = await getUserDocByUsername(window.profileUsername);
        const userData = userDoc.data();
        const wishlist = userData.wishlist || [];
        wishlistHeader.innerHTML = `Total Games In Wishlist: ${wishlist.length} `;

        if (wishlist.length === 0) {
            wishlistList.innerHTML = "<p>Your wishlist is currently empty.</p>";
            return;
        }
        const wishlistDetailsPromises = wishlist.map(async (item) => {
            const gameDoc = await getDoc(doc(db, "GamesDB", item.objectID));
            if (gameDoc.exists()) {
                return gameDoc.data();
            }
            return null;
        });
        const wishlistDetails = (await Promise.all(wishlistDetailsPromises)).filter(Boolean);
        displayWishlist(wishlistDetails);
    } catch (error) {
        console.error("Error loading wishlist:", error.message);
        wishlistList.innerHTML = `<p>Error loading wishlist: ${error.message}</p>`;
    }
}

//renders the games in the users wishlist
function displayWishlist(wishlist) {
    const wishlistList = document.getElementById("wishlistList");
    wishlistList.innerHTML = "";
    wishlist.forEach((game) => {
        const gameElement = document.createElement("li");
        gameElement.classList.add("ais-Hits-item");
        const isOwner = auth.currentUser && auth.currentUser.email.split('@')[0] === window.profileUsername;
        gameElement.innerHTML = `
            <div class="image">
                <img src="${game.CoverArt}" alt="${game.Game} Cover Art">
            </div>
            <div class="details">
                <div class="hit-title">
                    <a href="game.html?id=${game.objectID}">${game.Game}</a>
                </div>
                <div class="game-year">Year: ${game.Year || 'N/A'}</div>
                <div class="game-platform">Platform: ${game.Platform || 'N/A'}</div>
            </div>
            ${isOwner ? `
            <div class="buttons-and-condition">
                <button class="remove-from-wishlist" data-game-id="${game.objectID}">
                    Remove from Wishlist
                </button>
            </div>` : ""}
        `;
        if (isOwner) {
            gameElement.querySelector(".remove-from-wishlist").addEventListener("click", () => {
                removeFromWishlist(game.objectID);
            });
        }
        wishlistList.appendChild(gameElement);
    });
}

//remove the games from the users wishlsit
async function removeFromWishlist(gameId) {
    if (!auth.currentUser) {
        alert("Please log in to modify your wishlist.");
        return;
    }
    const username = auth.currentUser.email.split('@')[0];
    const userDocRef = doc(db, "users", username);
    try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const wishlist = userDoc.data().wishlist || [];
            console.log("Current wishlist:", wishlist);
            const gameToRemove = wishlist.find(item => item.objectID === gameId);
            if (!gameToRemove) {
                console.error("Game not found in wishlist:", gameId);
                alert("Game not found in your wishlist.");
                return;
            }
            console.log("Removing game object:", gameToRemove);
            await updateDoc(userDocRef, {
                wishlist: arrayRemove(gameToRemove)
            });
            console.log("Successfully removed game from wishlist:", gameId);
            alert("Game removed from your wishlist!");
            loadWishlist();
        } else {
            console.error("User document not found.");
            alert("User data not found.");
        }
    } catch (error) {
        console.error("Error removing game from wishlist:", error.message);
        alert(`Failed to remove game: ${error.message}`);
    }
}

// Load game details using the gammes id from firebase
window.loadGameDetails = async function (gameId) {
    const gameTitleElement = document.getElementById('game-title');
    const coverArtElement = document.getElementById('cover-art');
    const yearElement = document.getElementById('year');
    const developerElement = document.getElementById('dev');
    const publisherElement = document.getElementById('publisher');
    const platformElement = document.getElementById('platform');
    const genreElement = document.getElementById('genre');
    const objectIDElement = document.getElementById('objectID');
    const gameLinkContainer = document.getElementById('game-link-container');
    try {
        const gameDocRef = doc(db, "GamesDB", gameId);
        const gameDoc = await getDoc(gameDocRef);

        if (gameDoc.exists()) {
            const gameData = gameDoc.data();
            gameTitleElement.textContent = gameData.Game || 'Unknown Game';

            if (gameData.CoverArt) {
                coverArtElement.src = gameData.CoverArt;
                coverArtElement.alt = `${gameData.Game || 'Game'} Cover Art`;
                coverArtElement.style.display = 'block';
            } else {
                coverArtElement.style.display = 'none';
            }

            renderField(yearElement, 'Year', gameData.Year);

            if (gameData.Dev) {
                developerElement.innerHTML = gameData.DevLink
                    ? `<strong>Developer:</strong> <a href="${gameData.DevLink}" target="_blank">${gameData.Dev}</a>`
                    : `<strong>Developer:</strong> ${gameData.Dev}`;
                developerElement.style.display = 'block';
            } else {
                developerElement.style.display = 'none';
            }
            if (gameData.Publisher) {
                publisherElement.innerHTML = gameData.PublisherLink
                    ? `<strong>Publisher:</strong> <a href="${gameData.PublisherLink}" target="_blank">${gameData.Publisher}</a>`
                    : `<strong>Publisher:</strong> ${gameData.Publisher}`;
                publisherElement.style.display = 'block';
            } else {
                publisherElement.style.display = 'none';
            }

            if (gameData.Platform) {
                platformElement.innerHTML = gameData.PlatformLink
                    ? `<strong>Platform:</strong> <a href="${gameData.PlatformLink}" target="_blank">${gameData.Platform}</a>`
                    : `<strong>Platform:</strong> ${gameData.Platform}`;
                platformElement.style.display = 'block';
            } else {
                platformElement.style.display = 'none';
            }

            renderField(genreElement, 'Genre', gameData.Genre);

            if (gameData.objectID) {
                objectIDElement.innerHTML = `<strong>GameVault ID:</strong> ${gameData.objectID}`;
                objectIDElement.style.display = 'block';
            } else {
                objectIDElement.style.display = 'none';
            }

            if (gameData.GameLink) {
                gameLinkContainer.innerHTML = `
                    <a href="${gameData.GameLink}" target="_blank" class="more-info-link">
                        More Info on this Game
                    </a>
                `;
                gameLinkContainer.style.display = 'block';
            } else {
                gameLinkContainer.style.display = 'none';
            }
        } else {
            gameTitleElement.textContent = 'Game not found';
        }
    } catch (error) {
        console.error("Error fetching game details:", error);
        gameTitleElement.textContent = 'Error loading game details';
    }
};

//only render the fields that arent empty 
function renderField(element, label, data) {
    if (data && data !== 'Unknown') {
        element.innerHTML = `<strong>${label}:</strong> ${data}`;
        element.style.display = 'block';
    } else {
        element.style.display = 'none';
    }
}

// Event listener to toggle collection and ya wishlist actions
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.includes("game.html")) {
        const gameId = new URLSearchParams(window.location.search).get("id");
        if (gameId) {
            loadGameDetails(gameId);
            loadGameReviews(gameId);
            const toggleCollectionBtn = document.getElementById("toggle-collection-btn");
            const toggleWishlistBtn = document.getElementById("toggle-wishlist-btn");
            const conditionDropdown = document.getElementById("condition-dropdown");
            if (toggleCollectionBtn) {
                toggleCollectionBtn.addEventListener("click", () => {
                    const status = conditionDropdown.value;
                    if (status === "Select a condition") {
                        alert("Please select a valid condition before adding to your collection.");
                        return;
                    }
                    toggleCollectionStatus(gameId, status);
                });
            }
            if (toggleWishlistBtn) {
                toggleWishlistBtn.addEventListener("click", () => {
                    toggleWishlistStatus(gameId);
                });
            }
        }
    }
});

if (window.location.pathname.includes("game.html")) {
    document.addEventListener("DOMContentLoaded", () => {
        const gameId = new URLSearchParams(window.location.search).get('id');
        if (gameId) {
            loadGameDetails(gameId);
        }
    });
}
// add or remove games from your collection
async function toggleCollectionStatus(gameId, status) {
    if (!auth.currentUser) {
        alert("Please log in to modify your collection.");
        return;
    }
    if (!status || status === "Select a condition") {
        alert("Please select a valid condition before adding to your collection.");
        return;
    }
    const username = auth.currentUser.email.split('@')[0];
    const userDocRef = doc(db, "users", username);
    try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const collection = userDoc.data().collection || [];
            const gameInCollection = collection.some(
                (item) => item.objectID === gameId && item.status === status
            );

            if (gameInCollection) {
                await updateDoc(userDocRef, {
                    collection: arrayRemove({ objectID: gameId, status: status }),
                });
                alert("Game removed from your collection!");
            } else {
                await updateDoc(userDocRef, {
                    collection: arrayUnion({ objectID: gameId, status: status }),
                });
                alert("Game added to your collection!");
            }
        }
    } catch (error) {
        console.error("Error toggling collection status:", error.message);
        alert("Failed to update collection. Please try again.");
    }
}

// add or remove games from wishlist
async function toggleWishlistStatus(gameId) {
    if (!auth.currentUser) {
        alert("Please log in to modify your wishlist.");
        return;
    }
    const username = auth.currentUser.email.split('@')[0];
    const userDocRef = doc(db, "users", username);
    try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const wishlist = userDoc.data().wishlist || [];
            const gameInWishlist = wishlist.some(item => item.objectID === gameId);

            if (gameInWishlist) {
                await updateDoc(userDocRef, {
                    wishlist: arrayRemove({ objectID: gameId }),
                });
                alert("Game removed from your wishlist!");
            } else {
                await updateDoc(userDocRef, {
                    wishlist: arrayUnion({ objectID: gameId }),
                });
                alert("Game added to your wishlist!");
            }
        }
    } catch (error) {
        console.error("Error toggling wishlist status:", error.message);
        alert("Failed to update wishlist. Please try again.");
    }
}
//listener for toggle collection/wishlist status
document.addEventListener("click", (event) => {
    if (!window.location.pathname.includes("search.html")) return;
    const button = event.target;
    if (button.classList.contains("toggle-collection") || button.classList.contains("toggle-wishlist")) {
        const gameId = button.getAttribute("data-game-id");
        const gameElement = button.closest('.ais-Hits-item');
        if (!gameElement) {
            console.error("Error: .ais-Hits-item parent element not found for button", button);
            return;
        }
        const status = gameElement.querySelector('.condition-dropdown')?.value || "Select a condition";
        if (button.classList.contains("toggle-collection")) {
            if (status === "Select a condition") {
                alert("Please select a valid condition before adding to your collection.");
                return;
            }
            toggleCollectionStatus(gameId, status);
        } else if (button.classList.contains("toggle-wishlist")) {
            toggleWishlistStatus(gameId);
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.includes("search.html")) {
        document.querySelectorAll(".ais-Hits-item").forEach((item) => {
            const gameId = item.querySelector(".toggle-collection")?.getAttribute("data-game-id");
            if (gameId) {
                checkGameStatus(gameId, item.querySelector(".game-actions"));
            }
        });
    } else if (window.location.pathname.includes("collection.html")) {
        loadCollection();
    } else if (window.location.pathname.includes("wishlist.html")) {
        loadWishlist();
    }
});

//profile page to load the profile data
document.addEventListener("DOMContentLoaded", async () => {
    const currentPage = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const usernameParam = urlParams.get('user');
    if (currentPage.includes("profile.html")) {
        if (usernameParam) {
            window.profileUsername = usernameParam;
        } else {
            if (!auth.currentUser) {
                alert("Please log in to view your profile.");
                window.location.href = "index.html";
                return;
            }
            const username = auth.currentUser.email.split('@')[0];
            window.profileUsername = username;
        }
        const profileDisplayNameElement = document.getElementById("profileDisplayName");
        if (profileDisplayNameElement) {
            profileDisplayNameElement.textContent = `${window.profileUsername}'s`;
        }
        try {
            await loadCollection();
            await loadWishlist();
            await loadReviews();
        } catch (error) {
            console.error("Error loading profile data:", error.message);
        }
    }
});

//load reviews of a game or user
async function loadReviews() {
    const reviewsList = document.getElementById("reviewsList");
    const reviewsHeader = document.querySelector("#reviews-section h3");
    if (!reviewsList || !reviewsHeader) {
        console.error("Error: Reviews List or Section elements not found.");
        return;
    }
    if (!window.profileUsername) {
        reviewsList.innerHTML = "<p>Unable to load reviews. Username is missing.</p>";
        return;
    }

    try {
        const userDoc = await getUserDocByUsername(window.profileUsername);
        const userData = userDoc.data();
        const reviews = userData.reviews || [];
        reviewsHeader.innerHTML = `Total Reviews: ${reviews.length}`;
        if (reviews.length === 0) {
            reviewsList.innerHTML = "<p>No reviews available.</p>";
            return;
        }
        const reviewsWithDetailsPromises = reviews.map(async (review) => {
            const gameDetails = await getGameDetails(review.objectID);
            return gameDetails ? { ...review, ...gameDetails } : review;
        });
        const reviewsWithDetails = (await Promise.all(reviewsWithDetailsPromises)).filter(Boolean);
        displayReviews(reviewsWithDetails);
    } catch (error) {
        console.error("Error loading reviews:", error.message);
        reviewsList.innerHTML = `<p>Error loading reviews: ${error.message}</p>`;
    }
}

//render reviews on the page
function displayReviews(reviews) {
    const reviewsList = document.getElementById("reviewsList");
    reviewsList.innerHTML = "";
    reviews.forEach((review) => {
        const reviewElement = document.createElement("li");
        reviewElement.classList.add("ais-Hits-item");
        const isOwner = auth.currentUser && auth.currentUser.email.split('@')[0] === window.profileUsername;
        const canDelete = isOwner || (auth.currentUser && review.username === auth.currentUser.email.split('@')[0]);
        const coverArt = review.CoverArt;
        reviewElement.innerHTML = `
            <div class="image">
                <img src="${coverArt}" alt="${review.Game || 'Game'} Cover Art" />
            </div>
            <div class="details">
                <div class="hit-title">
                    <a href="game.html?id=${review.objectID}">${review.Game || "Unknown Game"}</a>
                </div>
                <div class="game-rating">Rating: ${review.Rating}/5</div>
                <div class="game-review">${review.WrittenReview || "No review content."}</div>
                <div class="game-review-date">Date: ${review.Date || "N/A"}</div>
            </div>
            ${canDelete ? `
                <div class="buttons-and-condition">
                    <button class="delete-review" 
                        data-review='${JSON.stringify({
                            objectID: review.objectID,
                            Rating: review.Rating,
                            WrittenReview: review.WrittenReview,
                            Date: review.Date,
                        })}'>
                        Delete Review
                    </button>
                </div>` : ""
            }
        `;
        reviewsList.appendChild(reviewElement);
    });
    attachDeleteListeners();
}

//grab game details with the game id
async function getGameDetails(gameId) {
    try {
        const gameDocRef = doc(db, "GamesDB", gameId);
        const gameDoc = await getDoc(gameDocRef);
        if (gameDoc.exists()) {
            return gameDoc.data();
        } else {
            console.error(`Game with ID ${gameId} not found.`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching game details:", error.message);
        return null;
    }
}

//submit the review for the game
async function submitReview(gameId) {
    if (!auth.currentUser) {
        alert("Please log in to submit a review.");
        return;
    }
    const username = auth.currentUser.email.split('@')[0];
    const userDocRef = doc(db, "users", username);
    const rating = document.getElementById("review-rating").value;
    const content = document.getElementById("review-content").value;
    if (!rating || !content) {
        alert("Please provide both a rating and a review.");
        return;
    }

    try {
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            console.error("User document not found.");
            alert("Failed to load user data.");
            return;
        }
        const userData = userDoc.data();
        const reviews = userData.reviews || [];
        const existingReview = reviews.find((review) => review.objectID === gameId);
        const formattedDate = new Date().toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
        });
        if (existingReview) {
            const updatedReviews = reviews.map((review) =>
                review.objectID === gameId
                    ? {
                          ...review,
                          WrittenReview: content,
                          Rating: parseInt(rating, 10),
                          Date: formattedDate,
                      }
                    : review
            );

            await updateDoc(userDocRef, { reviews: updatedReviews });
            alert("Your review has been updated!");
            loadGameReviews(gameId);
            return;
        }
        const newReview = {
            objectID: gameId,
            WrittenReview: content,
            Rating: parseInt(rating, 10),
            Date: formattedDate,
        };
        await updateDoc(userDocRef, {
            reviews: arrayUnion(newReview),
        });
        alert("Review submitted!");
        document.getElementById("review-form").reset();
        loadGameReviews(gameId);
    } catch (error) {
        console.error("Error submitting review:", error.message);
        alert("Failed to submit review. Please try again.");
    }
}

// the review stars
function renderStars(rating, reviewIndex, gameId) {
    const maxStars = 5;
    let starsHtml = '';
    for (let i = 1; i <= maxStars; i++) {
        if (i <= rating) {
            starsHtml += `<img 
                src="./img/star.png" 
                alt="Star" 
                class="star filled" 
                data-index="${i}" 
                data-review-index="${reviewIndex}" 
                data-game-id="${gameId}" 
            />`;
        } else {
            starsHtml += `<img 
                src="./img/star.png" 
                alt="Empty Star" 
                class="star empty" 
                data-index="${i}" 
                data-review-index="${reviewIndex}" 
                data-game-id="${gameId}" 
            />`;
        }
    }
    return starsHtml;
}

//load games reviews
async function loadGameReviews(gameId) {
    const reviewsList = document.getElementById("reviews-list");

    if (!reviewsList) {
        console.error("Error: reviews-list element not found in the DOM.");
        return;
    }
    try {
        const userReviewsQuery = query(
            collection(db, "users"),
            where("reviews", "!=", null)
        );
        const querySnapshot = await getDocs(userReviewsQuery);
        const reviews = [];
        querySnapshot.forEach((docSnapshot) => {
            const userData = docSnapshot.data();
            const userReviews = userData.reviews || [];
            userReviews.forEach((review) => {
                if (review.objectID === gameId) {
                    reviews.push({
                        ...review,
                        username: userData.username || "Unknown User",
                        userDocId: docSnapshot.id,
                    });
                }
            });
        });
        if (reviews.length === 0) {
            reviewsList.innerHTML = "<p>No reviews yet. Be the first to review this game!</p>";
            return;
        }
        const currentUser = auth.currentUser;
        let isAdmin = false;
        if (currentUser) {
            const adminDoc = await getDoc(doc(db, "users", currentUser.email.split('@')[0]));
            isAdmin = adminDoc.exists() && adminDoc.data().isAdmin;
        }
        reviewsList.innerHTML = reviews
            .map((review) => {
                const profileLink = `profile.html?user=${review.username}`;
                const canDelete = isAdmin || (currentUser && review.username === currentUser.email.split('@')[0]);
                const starsHtml = renderStars(review.Rating);

                return `
                <div class="review-item">
                    <p><strong>User:</strong> <a href="${profileLink}">${review.username}</a></p>
                    <p>
                        <strong>Rating:</strong>
                        <span>${starsHtml} (${review.Rating}/5)</span>
                    </p>
                    <p><strong>Review:</strong> ${review.WrittenReview}</p>
                    <p><strong>Reviewed on:</strong> ${review.Date}</p>
                    ${
                        canDelete
                            ? `<button class="delete-review" data-game-id="${review.objectID}" data-user-doc-id="${review.userDocId}" data-review='${JSON.stringify(review).replace(/"/g, '&quot;')}'>
                                    Delete Review
                               </button>`
                            : ""
                    }
                </div>
                `;
            })
            .join("");

        attachDeleteListeners();
    } catch (error) {
        console.error("Error loading reviews:", error.message);
        reviewsList.innerHTML = `<p>Error loading reviews: ${error.message}</p>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const gameId = new URLSearchParams(window.location.search).get("id");
    if (gameId) {
        loadGameDetails(gameId);
        loadGameReviews(gameId);
        const reviewForm = document.getElementById("review-form");
        reviewForm.addEventListener("submit", (event) => {
            event.preventDefault();
            submitReview(gameId);
        });
    }
});

//delete a review
async function deleteReview(reviewDetails) {
    if (!auth.currentUser) {
        alert("Please log in to delete reviews.");
        return;
    }
    const currentUsername = auth.currentUser.email.split('@')[0];
    const targetUsername = reviewDetails.username || currentUsername;
    const adminDocRef = doc(db, "users", currentUsername);
    const targetUserDocRef = doc(db, "users", targetUsername);
    const reviewToDelete = {
        objectID: reviewDetails.objectID,
        WrittenReview: reviewDetails.WrittenReview,
        Rating: reviewDetails.Rating,
        Date: reviewDetails.Date,
    };

    try {
        const adminDoc = await getDoc(adminDocRef);

        if (!adminDoc.exists()) {
            console.error(`Admin document for '${currentUsername}' not found.`);
            alert("Failed to verify admin status.");
            return;
        }

        const isAdmin = adminDoc.data().isAdmin || false;

        if (!isAdmin && currentUsername !== targetUsername) {
            alert("You do not have permission to delete this review.");
            return;
        }
        const targetUserDoc = await getDoc(targetUserDocRef);
        if (!targetUserDoc.exists()) {
            console.error(`User document for '${targetUsername}' not found.`);
            alert("Failed to delete review. User not found.");
            return;
        }
        await updateDoc(targetUserDocRef, {
            reviews: arrayRemove(reviewToDelete),
        });
        alert("Review deleted successfully!");

        if (window.location.pathname.includes("profile.html")) {
            loadReviews();
        } else if (window.location.pathname.includes("game.html")) {
            loadGameReviews(reviewDetails.objectID);
        }
    } catch (error) {
        console.error("Error deleting review:", error.message);
        alert("Failed to delete review. Please try again.");
    }
}

//the listeners for the delete button
function attachDeleteListeners() {
    const deleteButtons = document.querySelectorAll(".delete-review");
    deleteButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            const reviewDetails = JSON.parse(button.getAttribute("data-review"));

            if (confirm("Are you sure you want to delete this review?")) {
                deleteReview(reviewDetails, event);
            }
        });
    });
}

window.deleteReview = deleteReview;

document.addEventListener("DOMContentLoaded", () => {
    const stars = document.querySelectorAll(".custom-rating .star");
    stars.forEach(star => {
        star.addEventListener("click", (event) => {
            const ratingValue = event.target.getAttribute("data-value");
            const hiddenInput = document.getElementById("review-rating");
            hiddenInput.value = ratingValue;

            stars.forEach(star => {
                const starValue = star.getAttribute("data-value");
                
                if (starValue <= ratingValue) {
                    star.classList.remove("empty");
                    star.classList.add("filled");
                } else {
                    star.classList.remove("filled");
                    star.classList.add("empty");
                }
            });
        });
    });
});

// listen for admin edit
document.addEventListener("DOMContentLoaded", async () => {
    const gameId = new URLSearchParams(window.location.search).get("id");

    if (gameId) {
        await loadGameDetails(gameId);
        loadGameReviews(gameId);

        if (auth.currentUser) {
            const username = auth.currentUser.email.split('@')[0];
            const userDocRef = doc(db, "users", username);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists() && userDoc.data().isAdmin) {
                renderAdminEditForm(gameId);
            }
        }
    }
});

//render admin edit for game details
function renderAdminEditForm(gameId) {
    const gameDetailsSection = document.querySelector(".game-details");
    const adminForm = document.createElement("form");
    adminForm.id = "admin-edit-form";
    adminForm.innerHTML = `
        <h3>Edit Game Details</h3>
        <label for="field-select">Select Field to Edit:</label>
        <select id="field-select">
            <option value="" disabled selected>Select a field</option>
            <option value="Game">Game Title</option>
            <option value="CoverArt">Cover Art Link</option>
            <option value="Dev">Developer</option>
            <option value="DevLink">Developer Link</option>
            <option value="Publisher">Publisher</option>
            <option value="PublisherLink">Publisher Link</option>
            <option value="Platform">Platform</option>
            <option value="PlatformLink">Platform Link</option>
            <option value="Year">Year</option>
            <option value="Genre">Genre</option>
            <option value="coverArtAvailable">Cover Art Available</option>
        </select>

        <div id="edit-field-container">
            <label id="edit-label" for="edit-field-input"></label>
            <input type="text" id="edit-field-input" placeholder="Enter value">
            <select id="edit-dropdown" style="display: none;">
                <option value="Yes">Yes</option>
                <option value="No">No</option>
            </select>
            <select id="platform-dropdown" style="display: none;">
                <option value="" disabled selected>Select a platform</option>
            </select>
        </div>

        <button type="submit">Save Changes</button>`;
    gameDetailsSection.appendChild(adminForm);
    const fieldSelect = adminForm.querySelector("#field-select");
    const editFieldContainer = adminForm.querySelector("#edit-field-container");
    const editLabel = adminForm.querySelector("#edit-label");
    const editFieldInput = adminForm.querySelector("#edit-field-input");
    const editDropdown = adminForm.querySelector("#edit-dropdown");
    const platformDropdown = adminForm.querySelector("#platform-dropdown");
    platforms.forEach(platform => {
        const option = document.createElement("option");
        option.value = platform;
        option.textContent = platform;
        platformDropdown.appendChild(option);
    });
    let currentGameData = {};
    const gameDocRef = doc(db, "GamesDB", gameId);
    getDoc(gameDocRef).then((gameDoc) => {
        if (gameDoc.exists()) {
            currentGameData = gameDoc.data();
        }
    });
    fieldSelect.addEventListener("change", (event) => {
        const selectedField = event.target.value;
        editFieldInput.style.display = "none";
        editDropdown.style.display = "none";
        platformDropdown.style.display = "none";
        switch (selectedField) {
            case "Game":
                editLabel.textContent = "Edit Game Title:";
                editFieldInput.placeholder = "Enter new game title";
                editFieldInput.value = currentGameData.Game || "";
                editFieldInput.style.display = "block";
                break;
            case "CoverArt":
                editLabel.textContent = "Edit Cover Art URL:";
                editFieldInput.placeholder = "Enter new cover art URL";
                editFieldInput.value = currentGameData.CoverArt || "";
                editFieldInput.style.display = "block";
                break;
            case "Dev":
                editLabel.textContent = "Edit Developer:";
                editFieldInput.placeholder = "Enter new developer name";
                editFieldInput.value = currentGameData.Dev || "";
                editFieldInput.style.display = "block";
                break;
            case "DevLink":
                editLabel.textContent = "Edit Developer Link:";
                editFieldInput.placeholder = "Enter new developer link";
                editFieldInput.value = currentGameData.DevLink || "";
                editFieldInput.style.display = "block";
                break;
            case "Publisher":
                editLabel.textContent = "Edit Publisher:";
                editFieldInput.placeholder = "Enter new publisher name";
                editFieldInput.value = currentGameData.Publisher || "";
                editFieldInput.style.display = "block";
                break;
            case "PublisherLink":
                editLabel.textContent = "Edit Publisher Link:";
                editFieldInput.placeholder = "Enter new publisher link";
                editFieldInput.value = currentGameData.PublisherLink || "";
                editFieldInput.style.display = "block";
                break;
            case "Platform":
                editLabel.textContent = "Edit Platform:";
                platformDropdown.value = currentGameData.Platform || "";
                platformDropdown.style.display = "block";
                break;
            case "PlatformLink":
                editLabel.textContent = "Edit Platform Link:";
                editFieldInput.placeholder = "Enter new platform link";
                editFieldInput.value = currentGameData.PlatformLink || "";
                editFieldInput.style.display = "block";
                break;
            case "Year":
                editLabel.textContent = "Edit Year:";
                editFieldInput.type = "number";
                editFieldInput.placeholder = "Enter new year";
                editFieldInput.value = currentGameData.Year || "";
                editFieldInput.style.display = "block";
                break;
            case "Genre":
                editLabel.textContent = "Edit Genre:";
                editFieldInput.placeholder = "Enter new genre";
                editFieldInput.value = currentGameData.Genre || "";
                editFieldInput.style.display = "block";
                break;
            case "coverArtAvailable":
                editLabel.textContent = "Edit Cover Art Available:";
                editDropdown.value = currentGameData.coverArtAvailable || "No";
                editDropdown.style.display = "block";
                break;
        }
        editFieldContainer.style.display = "block";
    });
    adminForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const selectedField = fieldSelect.value;
        const updatedValue =
            selectedField === "coverArtAvailable"
                ? editDropdown.value
                : selectedField === "Platform"
                ? platformDropdown.value
                : editFieldInput.value.trim();

        if (!selectedField || !updatedValue) {
            alert("Please select a field and provide a value.");
            return;
        }
        try {
            await updateDoc(gameDocRef, {
                [selectedField]: selectedField === "Year" ? parseInt(updatedValue, 10) : updatedValue,
            });
            alert("Game details updated successfully!");
            loadGameDetails(gameId);
        } catch (error) {
            console.error("Error updating game details:", error.message);
            alert("Failed to update game details. Please try again.");
        }
    });
}

window.loadGameReviews = loadGameReviews;
window.toggleCollectionStatus = toggleCollectionStatus;
window.toggleWishlistStatus = toggleWishlistStatus;

// check for the game id for a new game added to the games collection
async function getNextObjectId() {
    try {
        const gamesCollection = collection(db, "GamesDB");
        const snapshot = await getDocs(gamesCollection);

        let maxObjectId = 0;
        snapshot.forEach((doc) => {
            const data = doc.data();
            const objectId = parseInt(data.objectID, 10);
            if (!isNaN(objectId) && objectId > maxObjectId) {
                maxObjectId = objectId;
            }
        });

        return (maxObjectId + 1).toString().padStart(7, '0');
    } catch (error) {
        console.error("Error fetching the next object ID:", error.message);
        throw new Error("Failed to determine the next object ID.");
    }
}

//adding a new game to the database
async function addNewGame(event) {
    event.preventDefault();
    if (!auth.currentUser) {
        alert("Please log in to add a game.");
        return;
    }
    const form = document.getElementById("add-game-form");
    const objectID = await getNextObjectId();
    const gameData = {
        objectID,
        Game: form["game-title"].value.trim(),
        CoverArt: form["cover-art"].value.trim() || null,
        Dev: form["developer"].value.trim() || null,
        DevLink: form["developer-link"].value.trim() || null,
        Publisher: form["publisher"].value.trim() || null,
        PublisherLink: form["publisher-link"].value.trim() || null,
        Platform: form["platform"].value.trim() || null,
        PlatformLink: form["platform-link"].value.trim() || null,
        Year: form["year"].value ? parseInt(form["year"].value, 10) : null,
        Genre: form["genre"].value.trim() || null,
        coverArtAvailable: form["cover-art-available"].value === "Yes",
    };
    try {
        const gameDocRef = doc(db, "GamesDB", objectID);
        await setDoc(gameDocRef, gameData);
        alert(`Game added successfully with ID: ${objectID}`);
        setTimeout(() => {
            window.location.href = `/~jwbeecha/SeniorProject/GameVault/game.html?id=${objectID}`;
        }, 0);
    } catch (error) {
        console.error("Error adding new game:", error.message);
        alert("Failed to add the game. Please try again.");
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const addGameForm = document.getElementById("add-game-form");
    if (addGameForm) {
        addGameForm.addEventListener("submit", addNewGame);
    }
});

//only admins can see the add games in nav
async function setupNavigation() {
    const navLinksContainer = document.querySelector(".nav-links");
    const currentUser = auth.currentUser;
    if (!navLinksContainer) {
        console.error("Navigation container not found.");
        return;
    }
    if (!currentUser) {
        console.log("No user logged in. Hiding admin-specific links.");
        return;
    }
    try {
        const username = currentUser.email.split('@')[0];
        const userDocRef = doc(db, "users", username);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const isAdmin = userData.isAdmin || false;
            if (isAdmin) {
                const addNewGamesLink = document.createElement("a");
                addNewGamesLink.href = "add-new-games.html";
                addNewGamesLink.textContent = "Add New Games";
                navLinksContainer.appendChild(addNewGamesLink);
            }
        } else {
            console.error("User document not found.");
        }
    } catch (error) {
        console.error("Error setting up navigation:", error.message);
    }
}

//check if the user is an admin
auth.onAuthStateChanged((user) => {
    if (user) {
        setupNavigation();
    }
});

//redirect non admins
async function checkAdminAccess() {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }

    try {
        const username = currentUser.email.split('@')[0];
        const userDocRef = doc(db, "users", username);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (!userData.isAdmin) {
                alert("Only admins can access this page.");
                window.location.href = "index.html";
            }
        } else {
            console.error("User document not found. Redirecting to homepage.");
            window.location.href = "index.html";
        }
    } catch (error) {
        console.error("Error checking admin access:", error.message);
        window.location.href = "index.html";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.includes("add-new-games.html")) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                checkAdminAccess();
            } else {
                window.location.href = "index.html";
            }
        });
    }
});

//the platforms for the add new games page
const platforms = [
    "Nintendo 3DS", "Nintendo DS", "GameBoy", "GameBoy Advance", "GameBoy Color",
    "Nintendo GameCube", "Nintendo 64", "Nintendo Entertainment System (NES)", 
    "PlayStation 1", "PlayStation 2", "PlayStation 3", "PlayStation 4", "PlayStation 5",
    "PlayStation Portable", "Super Nintendo Entertainment System (SNES)", 
    "Nintendo Switch", "Nintendo Wii", "Nintendo Wii U", "Xbox", "Xbox 360", "Xbox One", "Xbox Series X"
];

//populates the dropdown for the add new games page
function populatePlatformDropdown() {
    const platformDropdown = document.getElementById("platform");
    if (!platformDropdown) {
        console.error("Platform dropdown not found.");
        return;
    }
    platforms.forEach(platform => {
        const option = document.createElement("option");
        option.value = platform;
        option.textContent = platform;
        platformDropdown.appendChild(option);
    });
}

//the dropdown shows for the add new games and the edit games
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.includes("game.html") || window.location.pathname.includes("add-new-games.html")) {
        populatePlatformDropdown();
    }
});

//lets you see that the profile url has been copied on profile.html
document.addEventListener("DOMContentLoaded", () => {
    const profileDisplayNameElement = document.getElementById("profileDisplayName");
    if (profileDisplayNameElement) {
        profileDisplayNameElement.textContent = `${window.profileUsername || "User"}'s`;
    }
    const shareButton = document.getElementById("share-profile-button");
    const shareStatus = document.getElementById("share-status");
    if (shareButton) {
        shareButton.addEventListener("click", () => {
            const currentUrl = window.location.href;
            navigator.clipboard.writeText(currentUrl).then(() => {
                shareStatus.classList.add("visible");
                setTimeout(() => {
                    shareStatus.classList.remove("visible");
                }, 3000);
            }).catch(err => {
                console.error("Failed to copy URL:", err);
                alert("Failed to copy the profile link. Please try again.");
            });
        });
    }
});

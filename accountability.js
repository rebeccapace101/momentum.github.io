import { app } from './init.mjs';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js"
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
const auth = getAuth();
const db = getFirestore(app);

const idInput = document.getElementById("idInput");
const userNameDisplay = document.getElementById("userNameDisplay");
const displayResults = document.getElementById("displayResults");
const profilePic = document.getElementById("profile-pic");
const displayPartner = document.getElementById("displayPartner");
const popUp = document.getElementById("popupOverlay");
const partnerMessage = document.getElementById("partnerMessage");
const requestPic = document.getElementById("request-pic");
const updateMessage = document.getElementById("updateMessage");

const acceptedPopup = document.getElementById("acceptedPopup");
const closeAcceptedPopup = document.getElementById("closeAcceptedPopup");
const partnerpic = document.getElementById("accepted-partner-pic"); // update this line too

//initialize messages if not already created
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const messageRef = doc(db, "messages", user.uid);
        const messageSnap = await getDoc(messageRef);

        if (!messageSnap.exists()) {
            // create the document with null fields
            await setDoc(messageRef, {
                inComingRequest: null,
                outGoingRequest: null,
                partnerUpdate: null
            });
            console.log("Initialized message doc for", user.uid);
        } else {
            console.log("Message doc already exists for", user.uid);
        }
    }
});

//initialize concerns if not already
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userId = user.uid;

        const concernRef = doc(db, "concerns", "activeConcerns", userId, "concern");
        const concernSnap = await getDoc(concernRef);

        if (!concernSnap.exists()) {
            // create the document with null fields
            await setDoc(concernRef, {
                message: null
            });
            console.log("Initialized message doc for", user.uid);
        } else {
            console.log("Message doc already exists for", user.uid);
        }
    }
});

//code to close a popup
closeAcceptedPopup.addEventListener('click', async () => {
    const user = auth.currentUser;

    const messageRef = doc(db, "messages", user.uid);
    const messageSnap = await getDoc(messageRef);
    const messageData = messageSnap.data();
    await updateDoc(messageRef, { outGoingRequest: null }); //remove the request

    acceptedPopup.style.display = "none";

});

//popup managing

const closePopup = document.getElementById("closePopup");

const closeWindow = () => popUp.style.display = "none";

closePopup.addEventListener('click', closeWindow);
// popup if there is a request existing 
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const messageRef = doc(db, "messages", user.uid);
        const messageSnap = await getDoc(messageRef);

        if (messageSnap.exists()) {
            const messageData = messageSnap.data();
            const inComingRequest = messageData.inComingRequest;
            console.log(inComingRequest);

            if (inComingRequest != null && inComingRequest != undefined) {
                const userRef = doc(db, "users", inComingRequest);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    requestPic.src = userData.photoURL;
                    partnerMessage.innerHTML = userData.displayName + " wants to add you as an accountability partner!";
                    popUp.style.display = "block";
                } else {
                    console.error("User not found for inComingRequest:", inComingRequest);
                }
            } else {
                closeWindow();
            }
        } else {
            console.warn("Message doc not found for user:", user.uid);
        }
    } else {
        console.log("User is signed out");
    }
});


// popup if your previously sent request was accepted or declined
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const messageRef = doc(db, "messages", user.uid);
        const messageSnap = await getDoc(messageRef);

        if (messageSnap.exists()) {
            const messageData = messageSnap.data();
            const outGoingRequest = messageData.outGoingRequest;

            console.log(outGoingRequest);

            if (outGoingRequest != null && outGoingRequest != undefined) {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const partnerId = userData.partner;

                    const partnerRef = doc(db, "users", partnerId);
                    const partnerSnap = await getDoc(partnerRef);

                    if (partnerSnap.exists()) {
                        const partnerData = partnerSnap.data();

                        if (outGoingRequest == "accepted") {
                            updateMessage.innerHTML = "Congrats! Your request to " + partnerData.displayName + " was accepted, and you are now accountability partners!";
                            partnerpic.src = partnerData.photoURL;
                        } else if (outGoingRequest == "declined") {
                            updateMessage.innerHTML = "Your request to " + partnerData.displayName + " was declined.";
                            partnerpic.src = partnerData.photoURL;
                        }
                        acceptedPopup.style.display = "block";
                    }
                }
            } else {
                closeWindow();
            }
        } else {
            console.warn("Message doc not found for user:", user.uid);
        }
    } else {
        console.log("User is signed out");
    }
});



//code for accepting or denying a partner request
const acceptRequest = document.getElementById("acceptRequest");
const denyRequest = document.getElementById("denyRequest");

const submitAcceptance = async () => {
    const user = auth.currentUser;

    const messageRef = doc(db, "messages", user.uid);
    const messageSnap = await getDoc(messageRef);
    const messageData = messageSnap.data();
    const requesterId = messageData.inComingRequest;
    const partnerMDoc = doc(db, "messages", requesterId);
    const currentUserRef = doc(db, "users", user.uid);

    const partnerRef = doc(db, "users", requesterId);

    await updateDoc(currentUserRef, { partner: requesterId }); //add the partner
    await updateDoc(messageRef, { inComingRequest: null }); //remove the request
    await updateDoc(partnerMDoc, { outGoingRequest: "accepted" }); //send acceptance
    await updateDoc(partnerRef, { partner: user.uid }); //add the user as a partner

    closeWindow();
};

const submitDecline = async () => {
    const user = auth.currentUser;

    const messageRef = doc(db, "messages", user.uid);
    const messageSnap = await getDoc(messageRef);
    const messageData = messageSnap.data();
    const requesterId = messageData.inComingRequest;
    const partnerMDoc = doc(db, "messages", requesterId);
    const currentUserRef = doc(db, "users", user.uid);

    await updateDoc(messageRef, { inComingRequest: null }); //remove the request
    await updateDoc(partnerMDoc, { outGoingRequest: "declined" }); //send decline
    closeWindow();
};

acceptRequest.addEventListener('click', submitAcceptance);
denyRequest.addEventListener('click', submitDecline);


//either showing search or partner based on whether you have a partner yet 

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const partner = userData.partner;
            console.log(partner);

            const messagesRef = doc(db, "messages", user.uid);
            const messageSnap = await getDoc(messagesRef);

            if (messageSnap.exists()) {
                const messageData = messageSnap.data();

                if (messageData.partnerUpdate != null) {
                    if (messageData.partnerUpdate == "removed") {
                        updateMessage.innerHTML = "Your partner removed you as their accountability partner.";
                        acceptedPopup.style.display = "block";

                        await setDoc(messagesRef, { partnerUpdate: null }, { merge: true });
                    }
                }
            }

            if (partner != null) {
                const partnerRef = doc(db, "users", partner);
                const partnerSnap = await getDoc(partnerRef);

                if (partnerSnap.exists()) {
                    const partnerData = partnerSnap.data();
                    const partnerName = document.getElementById("partnerName");
                    partnerName.innerHTML = partnerData.displayName;
                    const partnerPhotoURL = partnerData.photoURL;
                    const partnerpic = document.getElementById("partner-pic");

                    if (partnerPhotoURL) {
                        partnerpic.src = partnerPhotoURL;
                        partnerpic.style.display = "block";
                    } else {
                        console.log("No profile picture found.");
                        partnerpic.style.display = "none";
                    }
                }
            } else {
                const searchPartner = document.getElementById("searchPartner");
                searchPartner.style.display = "block";
                displayPartner.style.display = "none";
            }
        }
    } else {
        console.log("User is signed out");
    }
});

//function to look for a user based on user input
const searchUser = async () => {
    const userId = idInput.value.trim();

    console.log("Entered User ID:", userId); // ✅ Debugging Log
    if (!userId) {
        alert("Please enter a valid User ID.");
        return;
    }

    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            userNameDisplay.innerHTML = `${userData.displayName || "Not Available"}`;
            const photoURL = userData.photoURL || auth.currentUser?.photoURL;

            if (photoURL) {
                profilePic.src = photoURL;
                profilePic.style.display = "block"; // Show the image
            } else {
                console.log("No profile picture found.");
                profilePic.style.display = "none"; // Hide if no image available
            }

            errorMessage.innerHTML = "";

            displayResults.style.display = "block";

        } else {
            alert("User not found.");
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        alert("An error occurred while fetching user data.");
    }
};


const submitID = document.getElementById("submitID");

submitID.addEventListener('click', searchUser);


//code to send a request to an accountability partner

const addPartner = document.getElementById("addPartner");
const errorMessage = document.getElementById("errorMessage");

const addAccountabilityPartner = async () => {
    const user = auth.currentUser;
    const mDoc = doc(db, "messages", user.uid);


    if (user) {
        const userId = idInput.value.trim();
        const partnerMDoc = doc(db, "messages", userId);
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        const userPrivacy = userData.privacy;


        const currentMessagesRef = doc(db, "messages", user.uid);
        const currentUserSnap = await getDoc(currentMessagesRef);
        const currentUserMessages = currentUserSnap.data();

        if (userPrivacy == "public") {

            if (userData.partner != null) { //if they already have a partner
                errorMessage.innerHTML = "This user already has a partner!";
            }
            else { //if they are public and don't have a partner, let the user send the request
                await setDoc(mDoc, { outGoingRequest: userId }, { merge: true }); //add message to log
                await setDoc(partnerMDoc, { inComingRequest: user.uid }, { merge: true }); //add message to prospective partner log
                errorMessage.innerHTML = "";
                userNameDisplay.innerHTML = "Partner request sent! Once the user accepts, you'll be notified.";
                addPartner.style.display = "none";
                profilePic.style.display = "none";
            }

        } else {
            errorMessage.innerHTML = "This user is not public.";
        }

    } else {
        console.log("No user is signed in.");
    }

}

addPartner.addEventListener('click', addAccountabilityPartner);


//code for removing current accountability partner

const removePartner = document.getElementById("removePartner");

const removePartnerFunc = async () => {
    const user = auth.currentUser;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    const partnerId = userData.partner;
    const partnerDoc = doc(db, "users", partnerId);

    const partnerMessages = doc(db, "messages", partnerId);
    await setDoc(partnerMessages, { partnerUpdate: "removed" }, { merge: true }); //notify the partner of the removal
    await setDoc(userRef, { partner: null }), { merge: true }; //remove partner
    await setDoc(partnerDoc, { partner: null }, { merge: true }); //remove self from partner's db
    alert("You have successfully removed your accountability partner");
    location.reload();
}



const reportPopup = document.getElementById("reportPopup");
const closeReportPopup = document.getElementById("closeReportPopup");
const reportInput = document.getElementById("reportInput");

closeReportPopup.addEventListener('click', () => {
    reportPopup.style.display = "none";
});
removePartner.addEventListener('click', removePartnerFunc);

const reportPartner = document.getElementById("reportPartner");

const reportPartnerFunc = async () => {
    const user = auth.currentUser;
    const userId = user.uid;
    const concernDoc = doc(db, "concerns", "activeConcerns", userId, "concern");
    const concernSnap = await getDoc(concernDoc);
    const concernData = concernSnap.data();
    if ((concernData.message != null)) { //if there is already a concern in progress
        alert("You already have a concern sent. Please wait until our admin can resolve your previous concern.");
    } else {
        reportPopup.style.display = "block";

    }

}

reportPartner.addEventListener('click', reportPartnerFunc);
const submitReport = document.getElementById("submitReport");

const submitReportFunc = async () => {
    const user = auth.currentUser;

    const userId = user.uid;

    const concernMessage = reportInput.value;
    const userConcern = doc(db, "concerns", "activeConcerns", userId, "concern");
    await setDoc(userConcern, { message: concernMessage }, { merge: true });
    console.log(concernMessage);
    alert("Concern sent. Please wait for our admin to resolve your submission. In the meantime, you can remove this person as a partner.");
    reportPopup.style.display = "none";
}

submitReport.addEventListener('click', submitReportFunc);
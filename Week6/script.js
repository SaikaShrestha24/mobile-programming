
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
  import { getDatabase,ref,set, get, update, remove } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAfpaBrIP07J_NBLy-v86uUtAUz8aDQ_8M",
    authDomain: "charger-ev-68a68.firebaseapp.com",
    projectId: "charger-ev-68a68",
    storageBucket: "charger-ev-68a68.firebasestorage.app",
    messagingSenderId: "115074344146",
    appId: "1:115074344146:web:f9422e4f539c3569b1390b"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
      const db= getDatabase(app);

  console.log(db);

// 1. WRITE / CREATE USER FUNCTION

function writeUserData(userId, username, password, gender, age, contact, address, nationality, role, status) {
    set(ref(db, 'users/' + userId), {
        userId: userId,
        username: username,      
        password: password,
        gender: gender,
        age: Number(age), 
        contact: contact,
        address: address,
        nationality: nationality,
        role: role,
        status: status
    })
    .then(() => {
        console.log(`User ${userId} written successfully to Firebase.`);
        alert("User added successfully");
    })
    .catch((error) => {
        console.error("Error writing user:", error);
    });
}

// 2. READ ALL USERS (Console Dropdowns)
// ==========================================
function readUser() {
    const userRef = ref(db, 'users');

    get(userRef).then((snapshot) => {
        if (!snapshot.exists()) {
            console.log("No data found under 'users/'");
            return;
        }

        snapshot.forEach((childsnapshot) => {
            const data = childsnapshot.val();
            
            // Interactive expandable dropdown structured by Node & Childnode
            console.groupCollapsed(`Node: users / Child Node: ${childsnapshot.key} (${data.username})`);
            
            console.log(
                `userId: ${data.userId}\n` +
                `username: "${data.username}"\n` +
                `password: "${data.password}"\n` +
                `gender: "${data.gender}"\n` +
                `age: ${data.age}\n` +
                `contact: "${data.contact}"\n` +
                `address: "${data.address}"\n` +
                `nationality: "${data.nationality}"\n` +
                `role: "${data.role}"\n` +
                `status: "${data.status}"`
            );
            
            console.groupEnd();
        });
    }).catch((error) => {
        console.error("Error reading users:", error);
    });
}

// ==========================================
// 3. READ ONE USER BY ID (Displays on Page)
// ==========================================
function readUserById(userId) {
    if (!userId) return alert("Please enter a User ID to lookup!");
    
    const userRef = ref(db, 'users/' + userId);
    const resultDiv = document.getElementById('read-result');

    get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            // Output layout sequencing matching the exact order on screen
            const template = 
                `Node: users / Child Node: ${userId}\n` +
                `-----------------------------------------\n` +
                `userId: ${data.userId}\n` +
                `username: ${data.username}\n` +
                `password: ${data.password}\n` +
                `gender: ${data.gender}\n` +
                `age: ${data.age}\n` +
                `contact: ${data.contact}\n` +
                `address: ${data.address}\n` +
                `nationality: ${data.nationality}\n` +
                `role: ${data.role}\n` +
                `status: ${data.status}`;
            
            resultDiv.innerText = template;
            resultDiv.style.display = "block";
            console.log(`Fetched User ${userId}:`, data);
        } else {
            resultDiv.innerText = `User ID ${userId} does not exist in the database.`;
            resultDiv.style.display = "block";
        }
    }).catch((error) => {
        console.error("Error reading user by ID:", error);
    });
}

// ==========================================
// 4. DELETE USER FUNCTION
// ==========================================
function deleteUserData(userId) {
    if(!userId) return alert("Please enter a User ID to delete!");
    
    const userRef = ref(db, 'users/' + userId);
    remove(userRef)
        .then(() => {
            console.log(`User ${userId} deleted successfully`);
            alert(`User ${userId} deleted successfully`);
        })
        .catch((error) => {
            console.error("Error deleting user:", error);
        });
}

// ==========================================
// DOM INTERACTION HANDLER
// ==========================================
function handleWriteUser() {
    const id = document.getElementById('create-id').value;
    const user = document.getElementById('create-username').value;
    const pass = document.getElementById('create-password').value;
    const gen = document.getElementById('create-gender').value;
    const age = document.getElementById('create-age').value;
    const con = document.getElementById('create-contact').value;
    const add = document.getElementById('create-address').value;
    const nat = document.getElementById('create-nationality').value;
    const role = document.getElementById('create-role').value;
    const stat = document.getElementById('create-status').value;

    if(!id) return alert("User ID is required!");

    writeUserData(id, user, pass, gen, age, con, add, nat, role, stat);
}

// Connect private module functions securely to window scope
window.handleWriteUser = handleWriteUser;
window.readUser = readUser;
window.readUserById = readUserById;
window.deleteUserData = deleteUserData;




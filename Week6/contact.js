  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
  import { getDatabase,ref,set, get, update, remove } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyASN-5I4xEqTUlbmjokCk__jG0H66sHEl0",
    authDomain: "contact-form-f7d9f.firebaseapp.com",
    projectId: "contact-form-f7d9f",
    storageBucket: "contact-form-f7d9f.firebasestorage.app",
    messagingSenderId: "824152130159",
    appId: "1:824152130159:web:70313e41bf4d595b94839a",
    measurementId: "G-1FLMSRSJTC"
  };
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  console.log(db);
  
  /* =====================================================
   CREATE CONTACT (10 FIELDS)
===================================================== */
function writeContact() {
  const id = document.getElementById("id").value;

  if (!id) {
    alert("Please enter Contact ID");
    return;
  }

  const contactRef = ref(db, "contacts/" + id);

  set(contactRef, {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    subject: document.getElementById("subject").value,
    address: document.getElementById("address").value,
    city: document.getElementById("city").value,
    country: document.getElementById("country").value,
    postal: document.getElementById("postal").value,
    gender: document.getElementById("gender").value,
    message: document.getElementById("message").value
  })
    .then(() => {
      console.log("Contact created successfully!");
      alert("Contact Saved!");
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

/* =====================================================
   READ ALL CONTACTS
===================================================== */
function readContacts() {
  const contactRef = ref(db, "contacts");

  get(contactRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          console.log("ID:", child.key, "Data:", child.val());
        });
      } else {
        console.log("No data found");
      }
    })
    .catch((error) => {
      console.error("Error reading data:", error);
    });
}

/* =====================================================
   READ SINGLE CONTACT BY ID
===================================================== */
function readContactById(id) {
  const contactRef = ref(db, "contacts/" + id);

  get(contactRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        document.getElementById("result").textContent =
          `Name: ${data.name}, Email: ${data.email}, Phone: ${data.phone}`;

        console.log(data);
      } else {
        document.getElementById("result").textContent =
          "No contact found";
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

/* =====================================================
   FETCH DATA FOR UPDATE
===================================================== */
function fetchForUpdate(id) {
  const contactRef = ref(db, "contacts/" + id);

  get(contactRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        document.getElementById("u-name").value = data.name;
        document.getElementById("u-email").value = data.email;

        console.log("Loaded for update:", data);
      } else {
        alert("No user found");
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

/* =====================================================
   UPDATE CONTACT (only name + email for simplicity)
===================================================== */
function updateContact(id) {
  const contactRef = ref(db, "contacts/" + id);

  update(contactRef, {
    name: document.getElementById("u-name").value,
    email: document.getElementById("u-email").value
  })
    .then(() => {
      console.log("Updated successfully!");
      alert("Contact Updated!");
    })
    .catch((error) => {
      console.error(error);
    });
}

/* =====================================================
   DELETE CONTACT
===================================================== */
function deleteContact(id) {
  const contactRef = ref(db, "contacts/" + id);

  remove(contactRef)
    .then(() => {
      console.log("Deleted successfully!");
      alert("Contact Deleted!");
    })
    .catch((error) => {
      console.error(error);
    });
}

/* =====================================================
   MAKE FUNCTIONS ACCESSIBLE IN HTML
===================================================== */
window.writeContact = writeContact;
window.readContacts = readContacts;
window.readContactById = readContactById;
window.fetchForUpdate = fetchForUpdate;
window.updateContact = updateContact;
window.deleteContact = deleteContact;

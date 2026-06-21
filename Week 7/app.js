// ==========================================
// FIREBASE MODULAR SDK IMPORTS
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, push, update, get, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==========================================
// FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyCN3-QGCITBgUsS5lt1QlGFL2CHdiE4B-M",
    authDomain: "ev-charger-reservation-app.firebaseapp.com",
    projectId: "ev-charger-reservation-app",
    storageBucket: "ev-charger-reservation-app.firebasestorage.app",
    messagingSenderId: "526261375189",
    appId: "1:526261375189:web:a379c3997a15727337d25c",
    measurementId: "G-4LLK2RRNJ6",
    databaseURL: "https://ev-charger-reservation-app-default-rtdb.firebaseio.com"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const database = getDatabase(firebaseApp);

// ==========================================
// NEPAL EV CHARGING STATIONS DATA
// ==========================================
const chargingStations = [
    {
        id: "stat_1",
        name: "GreenCharge Thamel Hub",
        address: "Thamel Marg, Thamel",
        district: "Kathmandu District",
        status: "Available",
        availabilityText: "6/8 free",
        price: 15,           // NPR per kWh
        power: 150,
        rating: 4.7,
        connector: "CCS2 / CHAdeMO",
        class: "bg-avail"
    },
    {
        id: "stat_2",
        name: "VoltUp Durbar Marg",
        address: "Durbar Marg, Near Hotel Yak & Yeti",
        district: "Kathmandu District",
        status: "Busy",
        availabilityText: "2/6 free",
        price: 14,
        power: 100,
        rating: 4.5,
        connector: "CCS2",
        class: "bg-busy"
    },
    {
        id: "stat_3",
        name: "EcoSpark Lalitpur",
        address: "Pulchowk Road, Lalitpur",
        district: "Lalitpur District",
        status: "Offline",
        availabilityText: "0/4 free",
        price: 16,
        power: 50,
        rating: 4.2,
        connector: "Type 2 / CCS2",
        class: "bg-off"
    },
    {
        id: "stat_4",
        name: "PowerGrid Bhaktapur",
        address: "Kamal Binayak, Bhaktapur",
        district: "Bhaktapur District",
        status: "Available",
        availabilityText: "4/4 free",
        price: 13,
        power: 60,
        rating: 4.8,
        connector: "Type 2",
        class: "bg-avail"
    },
    {
        id: "stat_5",
        name: "ChargeUp Pokhara",
        address: "Lakeside Road, Pokhara",
        district: "Kaski District",
        status: "Available",
        availabilityText: "3/4 free",
        price: 14,
        power: 75,
        rating: 4.6,
        connector: "CCS2 / Type 2",
        class: "bg-avail"
    }
];

// Time slots offered (NPT — Nepal Standard Time, UTC+5:45)
const ALL_TIME_SLOTS = [
    "6:00 AM", "7:00 AM", "8:00 AM",
    "9:00 AM", "10:00 AM", "11:00 AM",
    "12:00 PM", "1:00 PM", "2:00 PM",
    "3:00 PM", "4:00 PM", "5:00 PM",
    "6:00 PM", "7:00 PM", "8:00 PM"
];

// ==========================================
// APPLICATION CLASS
// ==========================================
class EVChargeApp {
    constructor() {
        this.currentUser = null;
        this.selectedStation = null;

        // Booking flow state
        this.pendingBooking = {
            station: null,
            date: null,
            timeSlot: null,
            duration: 1
        };

        // In-memory bookings list (also written to Firebase)
        this.myBookings = [];

        this.initEventListeners();
        this.listenToAuthChanges();
        this.renderStationsList();
        this.setDefaultDate();
        this.updateClock();
        setInterval(() => this.updateClock(), 60000);
    }

    updateClock() {
        // Show Nepal time (UTC+5:45)
        const now = new Date();
        const offset = 5 * 60 + 45; // minutes
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const npt = new Date(utc + offset * 60000);
        const h = npt.getHours().toString().padStart(2, '0');
        const m = npt.getMinutes().toString().padStart(2, '0');
        const el = document.getElementById('status-time');
        if (el) el.textContent = `${h}:${m}`;
    }

    setDefaultDate() {
        const dateInput = document.getElementById('booking-date');
        if (!dateInput) return;
        const now = new Date();
        // Shift to NPT
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const npt = new Date(utc + (5 * 60 + 45) * 60000);
        const yyyy = npt.getFullYear();
        const mm = String(npt.getMonth() + 1).padStart(2, '0');
        const dd = String(npt.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
        dateInput.min = `${yyyy}-${mm}-${dd}`;
        // Max: 7 days ahead
        const max = new Date(npt.getTime() + 7 * 24 * 3600000);
        dateInput.max = `${max.getFullYear()}-${String(max.getMonth()+1).padStart(2,'0')}-${String(max.getDate()).padStart(2,'0')}`;
    }

    initEventListeners() {
        document.getElementById('btn-login').addEventListener('click', () => this.handleSignIn());
        document.getElementById('btn-register').addEventListener('click', () => this.handleSignUp());
        document.getElementById('btn-logout').addEventListener('click', () => this.handleSignOut());

        document.getElementById('btn-book-slot').addEventListener('click', () => this.openBookingScreen());
        document.getElementById('btn-confirm-slot').addEventListener('click', () => this.goToConfirmStep());
        document.getElementById('btn-finalize-booking').addEventListener('click', () => this.finalizeBooking());

        document.getElementById('booking-date').addEventListener('change', () => this.renderTimeSlots());
        document.getElementById('booking-duration').addEventListener('change', () => {
            this.pendingBooking.duration = parseInt(document.getElementById('booking-duration').value);
            this.updateConfirmCost();
        });
    }

    listenToAuthChanges() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = user;
                document.getElementById('global-nav-bar').classList.remove('hidden');
                document.getElementById('profile-email').innerText = user.email;
                document.getElementById('profile-name').innerText = user.email.split('@')[0];
                this.switchTab('map');

                try {
                    const existingSnapshot = await get(ref(database, `users/${user.uid}`));
                    const existingData = existingSnapshot.val() || {};
                    const updates = { last_login: Date.now() };
                    if (!existingData.email) updates.email = user.email;
                    if (!existingData.created_at) updates.created_at = Date.now();
                    let sequentialId = existingData.sequential_id;
                    if (!sequentialId) {
                        const counterRef = ref(database, 'counters/user_count');
                        const counterResult = await runTransaction(counterRef, (c) => (c || 0) + 1);
                        sequentialId = counterResult.snapshot.val();
                        updates.sequential_id = sequentialId;
                        await set(ref(database, `users_by_number/${sequentialId}`), { uid: user.uid, email: user.email });
                    }
                    await update(ref(database, `users/${user.uid}`), updates);

                    // Load existing bookings from Firebase
                    await this.loadBookingsFromFirebase();

                } catch (error) {
                    console.error("Failed to store sign-in data:", error);
                }
            } else {
                this.currentUser = null;
                this.myBookings = [];
                document.getElementById('global-nav-bar').classList.add('hidden');
                this.switchTab('auth');
            }
        });
    }

    async loadBookingsFromFirebase() {
        if (!this.currentUser) return;
        try {
            const snap = await get(ref(database, `users/${this.currentUser.uid}/bookings`));
            if (snap.exists()) {
                const data = snap.val();
                this.myBookings = Object.values(data).sort((a, b) => b.created_at - a.created_at);
                this.renderBookingsList();
            }
        } catch (e) {
            console.error("Could not load bookings:", e);
        }
    }

    switchTab(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`screen-${screenId}`);
        if (target) target.classList.add('active');
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const activeTab = document.getElementById(`tab-${screenId}`);
        if (activeTab) activeTab.classList.add('active');
    }

    // ==========================================
    // AUTH HANDLERS
    // ==========================================
    handleSignIn() {
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value.trim();
        const btn = document.getElementById('btn-login');
        if (btn.disabled) return;
        btn.disabled = true;
        const orig = btn.innerText;
        btn.innerText = "Signing In...";
        signInWithEmailAndPassword(auth, email, password)
            .catch(e => alert(`Authentication Failed: ${e.message}`))
            .finally(() => { btn.disabled = false; btn.innerText = orig; });
    }

    async handleSignUp() {
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value.trim();
        const btn = document.getElementById('btn-register');
        if (btn.disabled) return;
        btn.disabled = true;
        const orig = btn.innerText;
        btn.innerText = "Creating Account...";
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            const counterRef = ref(database, 'counters/user_count');
            const counterResult = await runTransaction(counterRef, (c) => (c || 0) + 1);
            const sequentialId = counterResult.snapshot.val();
            await set(ref(database, `users/${cred.user.uid}`), {
                email, sequential_id: sequentialId, created_at: Date.now(),
                preferences: { showNPR: true, reminders: true }
            });
            await set(ref(database, `users_by_number/${sequentialId}`), { uid: cred.user.uid, email });
            console.log(`User created: #${sequentialId}`);
        } catch (e) {
            alert(`Registration Error: ${e.message}`);
        } finally {
            btn.disabled = false;
            btn.innerText = orig;
        }
    }

    handleSignOut() {
        signOut(auth);
    }

    // ==========================================
    // STATION LIST RENDERING
    // ==========================================
    renderStationsList() {
        const container = document.getElementById('stations-list-container');
        container.innerHTML = '';
        chargingStations.forEach(station => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.cursor = 'pointer';
            card.onclick = () => this.showStationDetail(station.id);
            card.innerHTML = `
                <div class="flex-row-justify">
                    <h2 style="margin-bottom:0;font-size:16px;">${station.name}</h2>
                    <span style="font-weight:600;color:var(--warning-orange);font-size:14px;"><i class="fa-solid fa-star"></i> ${station.rating}</span>
                </div>
                <p class="caption" style="margin-bottom:2px;">${station.address}</p>
                <p class="caption" style="margin-bottom:var(--spacing-s);color:var(--electric-blue);">${station.district}</p>
                <div class="flex-row-justify">
                    <span class="badge ${station.class}">${station.status}</span>
                    <span class="caption" style="font-weight:600;">${station.availabilityText}</span>
                </div>
                <div class="flex-row-justify" style="margin-top:var(--spacing-s);border-top:1px solid var(--light-gray);padding-top:8px;font-size:13px;">
                    <span>रू ${station.price}/kWh</span>
                    <span style="color:var(--electric-blue);font-weight:600;">${station.power} kW</span>
                    <span style="color:var(--caption-text);">${station.connector}</span>
                </div>
            `;
            container.appendChild(card);
        });
    }

    showStationDetail(stationId) {
        const station = chargingStations.find(s => s.id === stationId);
        if (!station) return;
        this.selectedStation = station;

        document.getElementById('detail-name').innerText = station.name;
        document.getElementById('detail-address').innerText = station.address;
        document.getElementById('detail-district').innerText = station.district;
        document.getElementById('detail-status').innerText = station.status;
        document.getElementById('detail-status').className = `badge ${station.class}`;
        document.getElementById('detail-specs').innerText = `${station.availabilityText} chargers available`;
        document.getElementById('detail-price').innerText = `रू ${station.price}/kWh`;
        document.getElementById('detail-power').innerText = `${station.power} kW`;
        document.getElementById('detail-connector').innerText = station.connector;
        document.getElementById('detail-rating').innerText = station.rating;

        const bookBtn = document.getElementById('btn-book-slot');
        if (station.status === 'Offline') {
            bookBtn.disabled = true;
            bookBtn.style.backgroundColor = 'var(--disabled-bg)';
            bookBtn.innerText = "Station Offline";
        } else {
            bookBtn.disabled = false;
            bookBtn.style.backgroundColor = 'var(--primary-green)';
            bookBtn.innerText = "Book a Slot";
        }

        this.switchTab('station-detail');
    }

    // ==========================================
    // BOOKING FLOW
    // ==========================================
    openBookingScreen() {
        if (!this.currentUser) { alert("Please sign in first."); return; }
        if (!this.selectedStation) return;

        this.pendingBooking = {
            station: this.selectedStation,
            date: null,
            timeSlot: null,
            duration: parseInt(document.getElementById('booking-duration').value)
        };

        document.getElementById('booking-station-name').innerText = this.selectedStation.name;
        document.getElementById('booking-station-addr').innerText = `${this.selectedStation.address} · ${this.selectedStation.district}`;
        document.getElementById('booking-duration').value = "2";
        this.pendingBooking.duration = 2;

        this.setDefaultDate();
        this.renderTimeSlots();
        this.updateConfirmSlotBtn();
        this.switchTab('booking');
    }

    renderTimeSlots() {
        const grid = document.getElementById('time-slots-grid');
        const selectedDate = document.getElementById('booking-date').value;
        this.pendingBooking.date = selectedDate;
        this.pendingBooking.timeSlot = null; // reset on date change
        this.updateConfirmSlotBtn();

        // Determine which slots are already booked for this station + date
        const bookedSlots = this.myBookings
            .filter(b => b.station_id === this.pendingBooking.station?.id && b.date === selectedDate && b.status !== 'cancelled')
            .map(b => b.time_slot);

        grid.innerHTML = '';
        ALL_TIME_SLOTS.forEach(slot => {
            const div = document.createElement('div');
            const isBooked = bookedSlots.includes(slot);
            div.className = `time-slot${isBooked ? ' booked' : ''}`;
            div.innerText = slot;
            if (!isBooked) {
                div.addEventListener('click', () => this.selectTimeSlot(slot, div));
            }
            grid.appendChild(div);
        });
    }

    selectTimeSlot(slot, el) {
        document.querySelectorAll('.time-slot').forEach(d => d.classList.remove('selected'));
        el.classList.add('selected');
        this.pendingBooking.timeSlot = slot;
        this.updateConfirmSlotBtn();
    }

    updateConfirmSlotBtn() {
        const btn = document.getElementById('btn-confirm-slot');
        if (this.pendingBooking.timeSlot) {
            btn.disabled = false;
            btn.innerText = `Continue with ${this.pendingBooking.timeSlot}`;
        } else {
            btn.disabled = true;
            btn.innerText = "Select a time slot to continue";
        }
    }

    goToConfirmStep() {
        const { station, date, timeSlot, duration } = this.pendingBooking;
        if (!timeSlot || !date || !station) return;

        // Populate confirm screen
        document.getElementById('confirm-station').innerText = station.name;
        document.getElementById('confirm-date').innerText = this.formatDate(date);
        document.getElementById('confirm-time').innerText = `${timeSlot} (${duration}h)`;
        document.getElementById('confirm-duration').innerText = `${duration} Hour${duration > 1 ? 's' : ''}`;
        this.updateConfirmCost();

        // Pre-fill phone if profile has it
        document.getElementById('booking-vehicle-num').value = '';

        this.switchTab('booking-confirm');
    }

    updateConfirmCost() {
        const { station, duration } = this.pendingBooking;
        if (!station) return;
        // Estimate: kW * duration hrs gives kWh, times price per kWh
        const estimatedKwh = Math.min(station.power, 50) * (this.pendingBooking.duration || 1);
        const cost = estimatedKwh * station.price;
        const text = `रू ${cost.toLocaleString('en-NP')} (est.)`;
        const el = document.getElementById('confirm-cost');
        if (el) el.innerText = text;
        return text;
    }

    async finalizeBooking() {
        if (!this.currentUser) { alert("Please sign in."); return; }

        const vehicleNum = document.getElementById('booking-vehicle-num').value.trim();
        const phone = document.getElementById('booking-phone').value.trim();
        const vehicle = document.getElementById('booking-vehicle').value;
        const vehicleLabel = document.getElementById('booking-vehicle').selectedOptions[0].text;

        if (!vehicleNum) { alert("Please enter your vehicle number."); return; }
        if (!phone || phone.length < 10) { alert("Please enter a valid 10-digit contact number."); return; }

        const btn = document.getElementById('btn-finalize-booking');
        btn.disabled = true;
        btn.innerText = "Confirming...";

        const { station, date, timeSlot, duration } = this.pendingBooking;
        const estimatedKwh = Math.min(station.power, 50) * duration;
        const estimatedCost = estimatedKwh * station.price;
        const refCode = `EV-${Math.floor(10000 + Math.random() * 90000)}`;

        const bookingData = {
            ref_code: refCode,
            station_id: station.id,
            station_name: station.name,
            station_address: station.address,
            district: station.district,
            date: date,
            time_slot: timeSlot,
            duration_hours: duration,
            vehicle: vehicleLabel,
            vehicle_number: vehicleNum,
            phone: phone,
            estimated_kwh: estimatedKwh,
            estimated_cost_npr: estimatedCost,
            status: "confirmed",
            created_at: Date.now()
        };

        try {
            const bookingRef = push(ref(database, `users/${this.currentUser.uid}/bookings`));
            await set(bookingRef, bookingData);

            this.myBookings.unshift(bookingData);
            this.renderBookingsList();

            // Update profile stats
            const sessionsEl = document.getElementById('profile-sessions');
            const savedEl = document.getElementById('profile-saved');
            if (sessionsEl) sessionsEl.innerText = this.myBookings.length;
            if (savedEl) {
                const totalSaved = this.myBookings.reduce((acc, b) => acc + (b.estimated_cost_npr || 0), 0);
                savedEl.innerText = `रू ${Math.round(totalSaved * 0.08).toLocaleString()}`;
            }

            // Populate success screen
            document.getElementById('success-ref').innerText = refCode;
            document.getElementById('success-station').innerText = station.name;
            document.getElementById('success-date').innerText = this.formatDate(date);
            document.getElementById('success-time').innerText = `${timeSlot} · ${duration}h`;
            document.getElementById('success-duration').innerText = `${duration} Hour${duration > 1 ? 's' : ''}`;
            document.getElementById('success-vehicle').innerText = `${vehicleLabel} (${vehicleNum})`;
            document.getElementById('success-cost').innerText = `रू ${estimatedCost.toLocaleString('en-NP')} (est.)`;

            this.switchTab('booking-success');

        } catch (e) {
            console.error(e);
            alert("Booking failed. Please try again.");
        } finally {
            btn.disabled = false;
            btn.innerText = "Confirm Booking — Pay at Station";
        }
    }

    // ==========================================
    // BOOKINGS LIST
    // ==========================================
    renderBookingsList() {
        const container = document.getElementById('bookings-list-container');
        if (!this.myBookings.length) {
            container.innerHTML = `
                <div style="text-align:center;padding:var(--spacing-xl) 0;color:var(--caption-text);">
                    <i class="fa-solid fa-calendar-xmark" style="font-size:48px;margin-bottom:var(--spacing-m);"></i>
                    <p style="font-weight:600;">No bookings yet</p>
                    <p class="caption">Book a charging slot from the Stations tab</p>
                </div>`;
            return;
        }

        container.innerHTML = '';
        this.myBookings.forEach((b, idx) => {
            const isPast = this.isBookingPast(b.date, b.time_slot);
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="flex-row-justify" style="margin-bottom:4px;">
                    <span style="font-size:11px;font-weight:700;letter-spacing:1px;color:var(--caption-text);">${b.ref_code}</span>
                    <span class="badge ${b.status === 'cancelled' ? 'bg-off' : isPast ? '' : 'bg-avail'}" style="${isPast && b.status !== 'cancelled' ? 'background:var(--disabled-bg);color:var(--disabled-text);' : ''}">${b.status === 'cancelled' ? 'Cancelled' : isPast ? 'Completed' : 'Confirmed'}</span>
                </div>
                <p style="font-weight:700;font-size:15px;margin-bottom:2px;">${b.station_name}</p>
                <p class="caption" style="margin-bottom:var(--spacing-s);">${b.station_address}</p>
                <div class="flex-row-justify">
                    <div style="font-size:13px;">
                        <i class="fa-solid fa-calendar" style="color:var(--primary-green);margin-right:4px;"></i>${this.formatDate(b.date)}
                    </div>
                    <div style="font-size:13px;font-weight:600;color:var(--electric-blue);">
                        <i class="fa-solid fa-clock" style="margin-right:4px;"></i>${b.time_slot} (${b.duration_hours}h)
                    </div>
                </div>
                <div class="flex-row-justify" style="margin-top:var(--spacing-s);border-top:1px solid var(--light-gray);padding-top:8px;">
                    <span class="caption">${b.vehicle} · ${b.vehicle_number}</span>
                    <span style="font-weight:700;color:var(--success-green);">रू ${b.estimated_cost_npr?.toLocaleString()}</span>
                </div>
                ${!isPast && b.status !== 'cancelled' ? `<button class="btn-danger" style="margin-top:var(--spacing-s);padding:8px;" onclick="app.cancelBooking(${idx})">Cancel Booking</button>` : ''}
            `;
            container.appendChild(card);
        });
    }

    async cancelBooking(idx) {
        if (!confirm("Are you sure you want to cancel this booking?")) return;
        this.myBookings[idx].status = 'cancelled';
        this.renderBookingsList();

        if (this.currentUser) {
            try {
                // Reload from Firebase to get the key, then update
                const snap = await get(ref(database, `users/${this.currentUser.uid}/bookings`));
                if (snap.exists()) {
                    const entries = Object.entries(snap.val());
                    const match = entries.find(([, v]) => v.ref_code === this.myBookings[idx].ref_code);
                    if (match) {
                        await update(ref(database, `users/${this.currentUser.uid}/bookings/${match[0]}`), { status: 'cancelled' });
                    }
                }
            } catch (e) {
                console.error("Cancel update failed:", e);
            }
        }
    }

    // ==========================================
    // HELPERS
    // ==========================================
    formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-NP', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    }

    isBookingPast(dateStr, timeSlot) {
        try {
            const now = new Date();
            const utc = now.getTime() + now.getTimezoneOffset() * 60000;
            const npt = new Date(utc + (5 * 60 + 45) * 60000);
            const bookingDate = new Date(dateStr + 'T00:00:00');
            const todayNPT = new Date(npt.getFullYear(), npt.getMonth(), npt.getDate());
            if (bookingDate < todayNPT) return true;
            if (bookingDate > todayNPT) return false;
            // Same day — check hour
            const hourStr = timeSlot.replace(' AM', '').replace(' PM', '');
            let hour = parseInt(hourStr.split(':')[0]);
            if (timeSlot.includes('PM') && hour !== 12) hour += 12;
            if (timeSlot.includes('AM') && hour === 12) hour = 0;
            return npt.getHours() >= hour + 1;
        } catch { return false; }
    }
}

// Mount globally
window.app = new EVChargeApp();
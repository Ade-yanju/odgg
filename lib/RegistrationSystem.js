import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export class RegistrationSystem {
  async register({ name, email, password, role }) {
    if (!name || !email || !password || !role)
      throw new Error("All fields are required.");

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    if (role === "vendor") {
      await setDoc(doc(db, "vendors", uid), {
        vendorId: uid,
        storeName: name,
        ownerName: "",
        balance: 0,
        totalOrders: 0,
        totalRevenue: 0,
        status: "open",
        role: "vendor",
        rating: 0,
        email,
        isOnline: true,
        createdAt: serverTimestamp(),
      });
    } else if (role === "rider") {
      await setDoc(doc(db, "riders", uid), {
        riderId: uid,
        fullName: name,
        email,
        phone: "",
        balance: 0,
        totalDeliveries: 0,
        totalEarnings: 0,
        role: "rider",
        isOnline: false,
        isVerified: false, // admin verifies riders before they go live
        createdAt: serverTimestamp(),
      });
    } else {
      // Default: student
      await setDoc(doc(db, "users", uid), {
        uid,
        fullName: name,
        email,
        phoneNumber: "",
        deliveryAddress: { hostel: "", room: "" },
        role: "student",
        createdAt: serverTimestamp(),
      });
    }

    return { uid, role };
  }
}

export class AuthSystem {
  async login(email, password) {
    if (!email || !password)
      throw new Error("Email and password are required.");
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return this._resolveRole(cred.user.uid);
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const uid = cred.user.uid;

    const [userSnap, vendorSnap, riderSnap] = await Promise.all([
      getDoc(doc(db, "users", uid)),
      getDoc(doc(db, "vendors", uid)),
      getDoc(doc(db, "riders", uid)),
    ]);

    if (!userSnap.exists() && !vendorSnap.exists() && !riderSnap.exists()) {
      // First-time Google login — default to student
      await setDoc(doc(db, "users", uid), {
        uid,
        fullName: cred.user.displayName || "",
        email: cred.user.email || "",
        phoneNumber: "",
        deliveryAddress: { hostel: "", room: "" },
        role: "student",
        createdAt: serverTimestamp(),
      });
      return { uid, role: "student" };
    }

    return this._resolveRole(uid);
  }

  async logout() {
    await firebaseSignOut(auth);
  }

  async _resolveRole(uid) {
    const [vendorSnap, riderSnap, userSnap] = await Promise.all([
      getDoc(doc(db, "vendors", uid)),
      getDoc(doc(db, "riders", uid)),
      getDoc(doc(db, "users", uid)),
    ]);

    if (vendorSnap.exists()) return { uid, role: "vendor" };
    if (riderSnap.exists()) return { uid, role: "rider" };
    if (userSnap.exists())
      return { uid, role: userSnap.data().role || "student" };

    throw new Error("No account found for this user.");
  }
}

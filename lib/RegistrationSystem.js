// lib/RegistrationSystem.js
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
  } from 'firebase/auth';
  import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
  import { auth, db } from './firebase';
  
  export class RegistrationSystem {
    /**
     * Register a new user or vendor.
     * @param {{ name: string, email: string, password: string, role: 'user'|'vendor' }} data
     */
    async register({ name, email, password, role }) {
      if (!name || !email || !password || !role) {
        throw new Error('All fields are required.');
      }
  
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid  = cred.user.uid;
  
      if (role === 'vendor') {
        await setDoc(doc(db, 'vendors', uid), {
          vendorId:     uid,
          storeName:    name,
          ownerName:    '',
          balance:      0,
          totalOrders:  0,
          totalRevenue: 0,
          status:       'open',
          role:         'vendor',
          rating:       0,
          email,
          createdAt:    serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'users', uid), {
          uid,
          fullName:         name,
          email,
          phoneNumber:      '',
          deliveryAddress:  { hostel: '', room: '' },
          role:             'student',
          createdAt:        serverTimestamp(),
        });
      }
  
      return { uid, role };
    }
  }
  
  export class AuthSystem {
    /**
     * Sign in with email + password. Returns { uid, role }.
     */
    async login(email, password) {
      if (!email || !password) throw new Error('Email and password are required.');
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return this._resolveRole(cred.user.uid);
    }
  
    /**
     * Sign in with Google OAuth. Creates Firestore record on first login.
     */
    async loginWithGoogle() {
      const provider = new GoogleAuthProvider();
      const cred     = await signInWithPopup(auth, provider);
      const uid      = cred.user.uid;
  
      // Check if user already has a Firestore record
      const userSnap   = await getDoc(doc(db, 'users', uid));
      const vendorSnap = await getDoc(doc(db, 'vendors', uid));
  
      if (!userSnap.exists() && !vendorSnap.exists()) {
        // First-time Google login — default to student
        await setDoc(doc(db, 'users', uid), {
          uid,
          fullName:        cred.user.displayName || '',
          email:           cred.user.email || '',
          phoneNumber:     cred.user.phoneNumber || '',
          deliveryAddress: { hostel: '', room: '' },
          role:            'student',
          createdAt:       serverTimestamp(),
        });
        return { uid, role: 'student' };
      }
  
      return this._resolveRole(uid);
    }
  
    /**
     * Sign out the current user.
     */
    async logout() {
      await firebaseSignOut(auth);
    }
  
    /**
     * Lookup which collection this UID lives in and return their role.
     * @private
     */
    async _resolveRole(uid) {
      const vendorSnap = await getDoc(doc(db, 'vendors', uid));
      if (vendorSnap.exists()) return { uid, role: 'vendor' };
  
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) return { uid, role: userSnap.data().role || 'student' };
  
      throw new Error('No account found for this user.');
    }
  }
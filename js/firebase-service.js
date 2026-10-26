/* ==========================================================================
   DMS DRIVE MANAGER - FIREBASE REALTIME & AUTH SERVICE
   Multi-user real-time synchronization with Firestore and Firebase Auth
   ========================================================================== */

import { state } from './state.js';

class FirebaseService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.isInitialized = false;
    this.unsubscribers = [];
  }

  // Load saved credentials from localStorage
  getConfig() {
    try {
      const cfg = localStorage.getItem('dms_firebase_cfg_v1');
      return cfg ? JSON.parse(cfg) : null;
    } catch (e) {
      return null;
    }
  }

  saveConfig(config) {
    localStorage.setItem('dms_firebase_cfg_v1', JSON.stringify(config));
  }

  clearConfig() {
    localStorage.removeItem('dms_firebase_cfg_v1');
    this.disconnect();
  }

  async init() {
    const config = this.getConfig();
    if (!config || !config.apiKey || !config.projectId) {
      console.log('Firebase: Nenhuma configuração encontrada. Iniciando em Modo Local / Demonstração.');
      state.isCloudConnected = false;
      return false;
    }

    try {
      // Dynamic imports from Firebase ESM CDN
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
      const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
      const { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');

      this.app = initializeApp(config);
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      this.firestore = { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch };
      this.authMethods = { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };

      // Listen to auth state
      onAuthStateChanged(this.auth, (user) => {
        if (user) {
          state.currentUser = {
            id: user.uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            isGuest: false
          };
          this.subscribeToRealtimeSync();
          state.isCloudConnected = true;
        } else {
          state.currentUser = {
            name: 'Não Conectado',
            email: '',
            isGuest: true
          };
          this.unsubscribeAll();
          state.isCloudConnected = false;
        }
        state.notify();
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Falha ao conectar com o Firebase:', error);
      state.isCloudConnected = false;
      return false;
    }
  }

  // Subscribe to real-time updates for drives and projects
  subscribeToRealtimeSync() {
    if (!this.db || !this.firestore) return;
    this.unsubscribeAll();

    const { collection, onSnapshot } = this.firestore;

    // Realtime Drives
    const drivesUnsub = onSnapshot(collection(this.db, 'drives'), (snapshot) => {
      const cloudDrives = [];
      snapshot.forEach((doc) => {
        cloudDrives.push({ id: doc.id, ...doc.data() });
      });
      state.drives = cloudDrives;
      state.notify();
    }, (err) => console.warn('Erro ao sincronizar drives:', err));

    // Realtime Projects
    const projectsUnsub = onSnapshot(collection(this.db, 'projects'), (snapshot) => {
      const cloudProjects = [];
      snapshot.forEach((doc) => {
        cloudProjects.push({ id: doc.id, ...doc.data() });
      });
      state.projects = cloudProjects;
      state.notify();
    }, (err) => console.warn('Erro ao sincronizar projetos:', err));

    this.unsubscribers.push(drivesUnsub, projectsUnsub);
  }

  unsubscribeAll() {
    this.unsubscribers.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    this.unsubscribers = [];
  }

  // Sync a local drive change to Firestore
  async saveDriveToCloud(drive) {
    if (!this.db || !state.isCloudConnected) return;
    try {
      const { doc, setDoc } = this.firestore;
      await setDoc(doc(this.db, 'drives', drive.id), drive);
    } catch (err) {
      console.error('Erro ao salvar drive no Firestore:', err);
    }
  }

  async deleteDriveFromCloud(driveId) {
    if (!this.db || !state.isCloudConnected) return;
    try {
      const { doc, deleteDoc } = this.firestore;
      await deleteDoc(doc(this.db, 'drives', driveId));
    } catch (err) {
      console.error('Erro ao excluir drive no Firestore:', err);
    }
  }

  // Sync a local project change to Firestore
  async saveProjectToCloud(project) {
    if (!this.db || !state.isCloudConnected) return;
    try {
      const { doc, setDoc } = this.firestore;
      await setDoc(doc(this.db, 'projects', project.id), project);
    } catch (err) {
      console.error('Erro ao salvar projeto no Firestore:', err);
    }
  }

  async deleteProjectFromCloud(projectId) {
    if (!this.db || !state.isCloudConnected) return;
    try {
      const { doc, deleteDoc } = this.firestore;
      await deleteDoc(doc(this.db, 'projects', projectId));
    } catch (err) {
      console.error('Erro ao excluir projeto no Firestore:', err);
    }
  }

  // Auth Operations
  async login(email, password) {
    if (!this.auth || !this.authMethods) throw new Error('Firebase não configurado.');
    return await this.authMethods.signInWithEmailAndPassword(this.auth, email, password);
  }

  async signup(email, password) {
    if (!this.auth || !this.authMethods) throw new Error('Firebase não configurado.');
    return await this.authMethods.createUserWithEmailAndPassword(this.auth, email, password);
  }

  async logout() {
    if (this.auth && this.authMethods) {
      await this.authMethods.signOut(this.auth);
    }
  }

  disconnect() {
    this.unsubscribeAll();
    this.app = null;
    this.auth = null;
    this.db = null;
    state.isCloudConnected = false;
    state.notify();
  }
}

export const firebaseService = new FirebaseService();

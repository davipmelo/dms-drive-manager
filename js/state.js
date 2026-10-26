/* ==========================================================================
   DMS DRIVE MANAGER - STATE STORE & BUSINESS LOGIC
   Reactive data store with automated capacity & redundancy calculations
   ========================================================================== */

import { INITIAL_DRIVES, INITIAL_PROJECTS } from './sample-data.js';

const STORAGE_KEYS = {
  DRIVES: 'dms_drives_data_v1',
  PROJECTS: 'dms_projects_data_v1',
  USER: 'dms_user_session_v1',
  FIREBASE_CONFIG: 'dms_firebase_cfg_v1'
};

class StateStore {
  constructor() {
    this.listeners = new Set();
    this.isCloudConnected = false;
    this.activeView = 'drives'; // 'drives' | 'table' | 'analytics'
    
    // Load local cache or fallback to initial video sample data
    this.drives = this.loadFromLocalStorage(STORAGE_KEYS.DRIVES, INITIAL_DRIVES);
    this.projects = this.loadFromLocalStorage(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    this.currentUser = this.loadFromLocalStorage(STORAGE_KEYS.USER, {
      name: 'Editor Convidado',
      email: 'editor@produtora.com',
      avatar: '🎬',
      isGuest: true
    });

    // Active filters
    this.filters = {
      searchQuery: '',
      client: 'all',
      driveType: 'all',
      custody: 'all',
      redundancy: 'all', // 'all' | 'single' | 'safe'
      tag: 'all'
    };
  }

  loadFromLocalStorage(key, defaultValue) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.warn(`Error loading ${key} from localStorage:`, e);
      return defaultValue;
    }
  }

  saveToLocalStorage() {
    if (!this.isCloudConnected) {
      try {
        localStorage.setItem(STORAGE_KEYS.DRIVES, JSON.stringify(this.drives));
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(this.projects));
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.saveToLocalStorage();
    for (const listener of this.listeners) {
      listener(this);
    }
  }

  // View Switcher
  setActiveView(viewName) {
    this.activeView = viewName;
    this.notify();
  }

  // Filter Updates
  setSearchQuery(query) {
    this.filters.searchQuery = query.trim().toLowerCase();
    this.notify();
  }

  setFilter(key, value) {
    this.filters[key] = value;
    this.notify();
  }

  resetFilters() {
    this.filters = {
      searchQuery: '',
      client: 'all',
      driveType: 'all',
      custody: 'all',
      redundancy: 'all',
      tag: 'all'
    };
    this.notify();
  }

  // Drive CRUD
  addDrive(driveData) {
    const newDrive = {
      id: `drive-${Date.now()}`,
      name: driveData.name.trim(),
      serial: driveData.serial ? driveData.serial.trim().toUpperCase() : `DRV-${Math.floor(100 + Math.random() * 900)}`,
      type: driveData.type || 'nvme',
      fileSystem: driveData.fileSystem || 'exfat',
      totalCapacityGB: Number(driveData.totalCapacityGB) || 2000,
      custody: driveData.custody ? driveData.custody.trim() : 'Armário Central',
      color: driveData.color || '#06b6d4',
      notes: driveData.notes ? driveData.notes.trim() : ''
    };

    this.drives.push(newDrive);
    this.notify();
    return newDrive;
  }

  updateDrive(driveId, updates) {
    const index = this.drives.findIndex(d => d.id === driveId);
    if (index !== -1) {
      this.drives[index] = { ...this.drives[index], ...updates };
      this.notify();
      return this.drives[index];
    }
    return null;
  }

  deleteDrive(driveId) {
    // Remove drive and disassociate projects from it
    this.drives = this.drives.filter(d => d.id !== driveId);
    this.projects = this.projects.map(proj => ({
      ...proj,
      drives: proj.drives.filter(id => id !== driveId)
    })).filter(proj => proj.drives.length > 0); // Keep projects that still have at least 1 drive

    this.notify();
  }

  // Project CRUD
  addProject(projectData) {
    const newProject = {
      id: `proj-${Date.now()}`,
      name: projectData.name.trim(),
      client: projectData.client ? projectData.client.trim() : 'Geral',
      sizeGB: Number(projectData.sizeGB) || 100,
      drives: Array.isArray(projectData.drives) && projectData.drives.length > 0 ? projectData.drives : [this.drives[0]?.id || 'drive-1'],
      tags: Array.isArray(projectData.tags) ? projectData.tags : (projectData.tags ? projectData.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      notes: projectData.notes ? projectData.notes.trim() : ''
    };

    this.projects.push(newProject);
    this.notify();
    return newProject;
  }

  updateProject(projectId, updates) {
    const index = this.projects.findIndex(p => p.id === projectId);
    if (index !== -1) {
      this.projects[index] = {
        ...this.projects[index],
        ...updates,
        updatedAt: new Date().toISOString().split('T')[0]
      };
      this.notify();
      return this.projects[index];
    }
    return null;
  }

  deleteProject(projectId) {
    this.projects = this.projects.filter(p => p.id !== projectId);
    this.notify();
  }

  // Project Movement & Duplication (Backups)
  moveProject(projectId, sourceDriveId, targetDriveId) {
    if (sourceDriveId === targetDriveId) return;

    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;

    // Remove from source and add to target
    const updatedDrives = project.drives.filter(d => d !== sourceDriveId);
    if (!updatedDrives.includes(targetDriveId)) {
      updatedDrives.push(targetDriveId);
    }

    this.updateProject(projectId, { drives: updatedDrives });
  }

  duplicateProject(projectId, targetDriveId) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;

    // Keep on original drives AND add target drive (creates a safe backup replica!)
    if (!project.drives.includes(targetDriveId)) {
      const updatedDrives = [...project.drives, targetDriveId];
      this.updateProject(projectId, { drives: updatedDrives });
    }
  }

  removeProjectFromDrive(projectId, driveId) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;

    if (project.drives.length <= 1) {
      // If this is the only drive, deleting it from this drive deletes the project record
      this.deleteProject(projectId);
    } else {
      const updatedDrives = project.drives.filter(id => id !== driveId);
      this.updateProject(projectId, { drives: updatedDrives });
    }
  }

  // Quick Custody Update
  updateDriveCustody(driveId, newCustody) {
    this.updateDrive(driveId, { custody: newCustody });
  }

  // Calculations & Analytics
  calculateDriveUsage(driveId) {
    const drive = this.drives.find(d => d.id === driveId);
    if (!drive) return { usedGB: 0, totalGB: 0, freeGB: 0, pct: 0, isWarning: false, isCritical: false, projectCount: 0 };

    const driveProjects = this.projects.filter(p => p.drives.includes(driveId));
    const usedGB = driveProjects.reduce((acc, p) => acc + (p.sizeGB || 0), 0);
    const totalGB = drive.totalCapacityGB || 1000;
    const freeGB = Math.max(0, totalGB - usedGB);
    const pct = Math.min(100, Math.round((usedGB / totalGB) * 100));

    return {
      usedGB,
      totalGB,
      freeGB,
      pct,
      isWarning: pct >= 80 && pct < 92,
      isCritical: pct >= 92,
      projectCount: driveProjects.length
    };
  }

  calculateGlobalStats() {
    const totalDrives = this.drives.length;
    const totalProjects = this.projects.length;

    let totalStorageGB = 0;
    for (const drive of this.drives) {
      totalStorageGB += (drive.totalCapacityGB || 0);
    }

    // Calculate unique project data footprint (sum of all projects' sizes)
    const uniqueProjectsDataGB = this.projects.reduce((acc, p) => acc + (p.sizeGB || 0), 0);

    // Calculate actual physical usage across all drives (sum of project size * number of copies)
    let totalPhysicalUsedGB = 0;
    let singleCopyCount = 0;
    let safeBackupCount = 0;

    for (const project of this.projects) {
      const copies = project.drives.length;
      totalPhysicalUsedGB += (project.sizeGB || 0) * copies;
      if (copies <= 1) {
        singleCopyCount++;
      } else {
        safeBackupCount++;
      }
    }

    const totalFreeGB = Math.max(0, totalStorageGB - totalPhysicalUsedGB);
    const globalUsagePct = totalStorageGB > 0 ? Math.round((totalPhysicalUsedGB / totalStorageGB) * 100) : 0;
    const safeBackupPct = totalProjects > 0 ? Math.round((safeBackupCount / totalProjects) * 100) : 0;

    return {
      totalDrives,
      totalProjects,
      totalStorageGB,
      totalPhysicalUsedGB,
      totalFreeGB,
      globalUsagePct,
      uniqueProjectsDataGB,
      singleCopyCount,
      safeBackupCount,
      safeBackupPct
    };
  }

  // Query Filtered Projects
  getFilteredProjects() {
    return this.projects.filter(p => {
      // Search query across name, client, tags
      if (this.filters.searchQuery) {
        const q = this.filters.searchQuery;
        const matchName = p.name.toLowerCase().includes(q);
        const matchClient = p.client.toLowerCase().includes(q);
        const matchTags = p.tags.some(t => t.toLowerCase().includes(q));
        const matchNotes = p.notes && p.notes.toLowerCase().includes(q);
        if (!matchName && !matchClient && !matchTags && !matchNotes) return false;
      }

      // Filter by Client
      if (this.filters.client !== 'all' && p.client !== this.filters.client) {
        return false;
      }

      // Filter by Redundancy
      if (this.filters.redundancy === 'single' && p.drives.length > 1) {
        return false;
      }
      if (this.filters.redundancy === 'safe' && p.drives.length <= 1) {
        return false;
      }

      // Filter by Tag
      if (this.filters.tag !== 'all' && !p.tags.includes(this.filters.tag)) {
        return false;
      }

      // Filter by Drive Type or Custody
      if (this.filters.driveType !== 'all' || this.filters.custody !== 'all') {
        const driveMatches = p.drives.some(driveId => {
          const drive = this.drives.find(d => d.id === driveId);
          if (!drive) return false;
          if (this.filters.driveType !== 'all' && drive.type !== this.filters.driveType) return false;
          if (this.filters.custody !== 'all' && drive.custody !== this.filters.custody) return false;
          return true;
        });
        if (!driveMatches) return false;
      }

      return true;
    });
  }

  // Get distinct values for filter pills
  getClientsList() {
    const clients = new Set();
    this.projects.forEach(p => { if (p.client) clients.add(p.client); });
    return Array.from(clients).sort();
  }

  getCustodiesList() {
    const custodies = new Set();
    this.drives.forEach(d => { if (d.custody) custodies.add(d.custody); });
    return Array.from(custodies).sort();
  }

  getTagsList() {
    const tags = new Set();
    this.projects.forEach(p => {
      p.tags.forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
  }

  // Helpers for formatting storage
  static formatGB(gb) {
    if (gb >= 1000) {
      return `${(gb / 1000).toFixed(1).replace('.0', '')} TB`;
    }
    return `${Math.round(gb)} GB`;
  }
}

export const state = new StateStore();

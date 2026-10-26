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
    this.activeView = 'drives'; // 'drives' | 'table'
    this.workbenchLayout = this.loadFromLocalStorage('dms_workbench_layout_v1', 'grid'); // 'grid' | 'list'
    
    // Load local cache or fallback to initial video sample data
    const loadedDrives = this.loadFromLocalStorage(STORAGE_KEYS.DRIVES, INITIAL_DRIVES);
    // Sanitize drive types: literally only 'HD' and 'SSD'
    this.drives = loadedDrives.map(d => {
      let cleanType = 'HD';
      const rawType = String(d.type || '').toUpperCase();
      if (rawType === 'SSD' || rawType === 'NVME') cleanType = 'SSD';
      else cleanType = 'HD';

      let fs = d.fileSystem || 'exFAT';
      if (fs.toLowerCase() === 'exfat') fs = 'exFAT';
      else if (fs.toLowerCase() === 'apfs') fs = 'APFS';
      else if (fs.toLowerCase() === 'hfs' || fs.toLowerCase() === 'hfs+') fs = 'HFS+';
      else if (fs.toLowerCase() === 'ntfs') fs = 'NTFS';

      return {
        id: d.id,
        name: d.name,
        type: cleanType,
        fileSystem: fs,
        totalCapacityGB: Number(d.totalCapacityGB) || 2000,
        color: d.color || '#ffbb00',
        notes: d.notes || ''
      };
    });

    const loadedProjects = this.loadFromLocalStorage(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    this.projects = loadedProjects.map(p => ({
      ...p,
      drives: Array.isArray(p.drives) ? p.drives : []
    }));

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
      driveType: 'all', // 'all' | 'HD' | 'SSD'
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

  setWorkbenchLayout(layout) {
    this.workbenchLayout = layout === 'list' ? 'list' : 'grid';
    try {
      localStorage.setItem('dms_workbench_layout_v1', JSON.stringify(this.workbenchLayout));
    } catch(e) {}
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
      redundancy: 'all',
      tag: 'all'
    };
    this.notify();
  }

  // Drive CRUD
  addDrive(driveData) {
    const rawType = String(driveData.type || '').toUpperCase();
    const cleanType = (rawType === 'SSD' || rawType === 'NVME') ? 'SSD' : 'HD';

    let fs = driveData.fileSystem || 'exFAT';
    if (fs.toLowerCase() === 'exfat') fs = 'exFAT';
    else if (fs.toLowerCase() === 'apfs') fs = 'APFS';
    else if (fs.toLowerCase() === 'hfs' || fs.toLowerCase() === 'hfs+') fs = 'HFS+';
    else if (fs.toLowerCase() === 'ntfs') fs = 'NTFS';

    const newDrive = {
      id: `drive-${Date.now()}`,
      name: driveData.name.trim(),
      type: cleanType,
      fileSystem: fs,
      totalCapacityGB: Number(driveData.totalCapacityGB) || 2000,
      color: driveData.color || '#ffbb00',
      notes: driveData.notes ? driveData.notes.trim() : ''
    };

    this.drives.push(newDrive);
    this.notify();
    return newDrive;
  }

  updateDrive(driveId, updates) {
    const index = this.drives.findIndex(d => d.id === driveId);
    if (index !== -1) {
      const sanitizedUpdates = { ...updates };
      if (sanitizedUpdates.type) {
        const rawType = String(sanitizedUpdates.type).toUpperCase();
        sanitizedUpdates.type = (rawType === 'SSD' || rawType === 'NVME') ? 'SSD' : 'HD';
      }
      if (sanitizedUpdates.fileSystem) {
        let fs = sanitizedUpdates.fileSystem;
        if (fs.toLowerCase() === 'exfat') fs = 'exFAT';
        else if (fs.toLowerCase() === 'apfs') fs = 'APFS';
        else if (fs.toLowerCase() === 'hfs' || fs.toLowerCase() === 'hfs+') fs = 'HFS+';
        else if (fs.toLowerCase() === 'ntfs') fs = 'NTFS';
        sanitizedUpdates.fileSystem = fs;
      }
      delete sanitizedUpdates.serial;
      delete sanitizedUpdates.custody;
      this.drives[index] = { ...this.drives[index], ...sanitizedUpdates };
      this.notify();
      return this.drives[index];
    }
    return null;
  }

  deleteDrive(driveId) {
    // Remove drive, mas projetos continuam existindo sem estar ligados a nenhum drive
    this.drives = this.drives.filter(d => d.id !== driveId);
    this.projects = this.projects.map(proj => ({
      ...proj,
      drives: Array.isArray(proj.drives) ? proj.drives.filter(id => id !== driveId) : []
    }));

    this.notify();
  }

  reorderDrives(sourceDriveId, targetDriveId) {
    if (!sourceDriveId || !targetDriveId || sourceDriveId === targetDriveId) return;
    const sourceIndex = this.drives.findIndex(d => d.id === sourceDriveId);
    const targetIndex = this.drives.findIndex(d => d.id === targetDriveId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const [movedDrive] = this.drives.splice(sourceIndex, 1);
    this.drives.splice(targetIndex, 0, movedDrive);
    this.notify();
  }

  // Project CRUD
  addProject(projectData) {
    const newProject = {
      id: `proj-${Date.now()}`,
      name: projectData.name.trim(),
      client: projectData.client ? projectData.client.trim() : 'Geral',
      sizeGB: Number(projectData.sizeGB) || 100,
      drives: Array.isArray(projectData.drives) ? projectData.drives : [],
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
    const updatedDrives = (project.drives || []).filter(d => d !== sourceDriveId);
    if (!updatedDrives.includes(targetDriveId)) {
      updatedDrives.push(targetDriveId);
    }

    this.updateProject(projectId, { drives: updatedDrives });
  }

  duplicateProject(projectId, targetDriveId) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;

    // Keep on original drives AND add target drive (creates a safe backup replica!)
    const currentDrives = project.drives || [];
    if (!currentDrives.includes(targetDriveId)) {
      const updatedDrives = [...currentDrives, targetDriveId];
      this.updateProject(projectId, { drives: updatedDrives });
    }
  }

  removeProjectFromDrive(projectId, driveId) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;

    // Remove o drive do projeto, mas NUNCA exclui o projeto do sistema
    const updatedDrives = (project.drives || []).filter(id => id !== driveId);
    this.updateProject(projectId, { drives: updatedDrives });
  }

  // Calculations & Analytics
  calculateDriveUsage(driveId) {
    const drive = this.drives.find(d => d.id === driveId);
    if (!drive) return { usedGB: 0, totalGB: 0, freeGB: 0, pct: 0, isWarning: false, isCritical: false, projectCount: 0 };

    const driveProjects = this.projects.filter(p => (p.drives || []).includes(driveId));
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
    let hdCount = 0;
    let ssdCount = 0;

    for (const drive of this.drives) {
      totalStorageGB += (drive.totalCapacityGB || 0);
      if (String(drive.type).toUpperCase() === 'SSD') ssdCount++;
      else hdCount++;
    }

    // Calculate unique project data footprint (sum of all projects' sizes)
    const uniqueProjectsDataGB = this.projects.reduce((acc, p) => acc + (p.sizeGB || 0), 0);

    // Calculate actual physical usage across all drives (sum of project size * number of copies)
    let totalPhysicalUsedGB = 0;
    let singleCopyCount = 0;
    let safeBackupCount = 0;
    let unassignedProjectsCount = 0;
    let atRiskCount = 0;

    for (const project of this.projects) {
      const copies = (project.drives || []).length;
      const isArchived = (project.tags || []).some(t => String(t).trim().toLowerCase() === 'arquivado');
      
      totalPhysicalUsedGB += (project.sizeGB || 0) * copies;
      if (copies === 0) {
        unassignedProjectsCount++;
        singleCopyCount++;
        if (!isArchived) atRiskCount++;
      } else if (copies === 1) {
        singleCopyCount++;
        if (!isArchived) atRiskCount++;
      } else {
        safeBackupCount++;
      }
    }

    const totalFreeGB = Math.max(0, totalStorageGB - totalPhysicalUsedGB);
    const globalUsagePct = totalStorageGB > 0 ? Math.round((totalPhysicalUsedGB / totalStorageGB) * 100) : 0;
    const safeBackupPct = totalProjects > 0 ? Math.round((safeBackupCount / totalProjects) * 100) : 0;

    return {
      totalDrives,
      hdCount,
      ssdCount,
      totalProjects,
      unassignedProjectsCount,
      totalStorageGB,
      totalPhysicalUsedGB,
      totalFreeGB,
      globalUsagePct,
      uniqueProjectsDataGB,
      singleCopyCount,
      safeBackupCount,
      safeBackupPct,
      atRiskCount
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
      if (this.filters.redundancy === 'single' && (p.drives || []).length > 1) {
        return false;
      }
      if (this.filters.redundancy === 'safe' && (p.drives || []).length <= 1) {
        return false;
      }

      // Filter by Tag
      if (this.filters.tag !== 'all' && !p.tags.includes(this.filters.tag)) {
        return false;
      }

      // Filter by Drive Type (HD or SSD)
      if (this.filters.driveType !== 'all') {
        const targetType = this.filters.driveType.toUpperCase();
        const driveMatches = (p.drives || []).some(driveId => {
          const drive = this.drives.find(d => d.id === driveId);
          return drive && String(drive.type).toUpperCase() === targetType;
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

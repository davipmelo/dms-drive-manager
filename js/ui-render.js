/* ==========================================================================
   DM`S DRIVE MANAGER - UI RENDER ENGINE
   Dynamic DOM rendering for drives workbench, projects table, and storage dashboard
   ========================================================================== */

import { state } from './state.js';
import { 
  openDriveModal, 
  openProjectModal, 
  openMoveProjectModal, 
  showToast 
} from './modals.js';

// Entry point: re-renders current view & sidebar
export function renderApp() {
  renderHeaderStatus();
  renderSidebarStorage();
  renderFiltersPopover();

  if (state.activeView === 'drives') {
    renderDrivesWorkbench();
  } else if (state.activeView === 'table') {
    renderProjectsTable();
  }
}

// 1. Header Sync Status Pill
function renderHeaderStatus() {
  const syncPill = document.getElementById('sync-status-indicator');
  const syncText = document.getElementById('sync-status-text');
  if (!syncPill || !syncText) return;

  if (state.isCloudConnected) {
    syncPill.className = 'sync-status-pill online';
    syncText.textContent = `Online (${state.currentUser.name || 'Conectado'})`;
  } else {
    syncPill.className = 'sync-status-pill offline';
    syncText.textContent = 'Modo Local (Offline)';
  }

  // Clear button for search
  const clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) {
    clearBtn.classList.toggle('visible', state.filters.searchQuery.length > 0);
  }
}

// 2. Storage & Health Dashboard Sidebar (Always Visible)
function renderSidebarStorage() {
  const sidebar = document.getElementById('sidebar-storage-dashboard');
  if (!sidebar) return;

  const stats = state.calculateGlobalStats();

  // Mini Donut calculation
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.globalUsagePct / 100) * circumference;

  sidebar.innerHTML = `
    <div class="sidebar-dashboard">
      
      <!-- Sidebar Header -->
      <div class="sidebar-header">
        <div class="sidebar-header-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span>Armazenamento</span>
        </div>
        <span class="sidebar-badge">${stats.totalDrives} Drives</span>
      </div>

      <!-- Global Storage Meter Card -->
      <div class="sidebar-card storage-gauge-card">
        <div class="storage-gauge-inner">
          <div class="gauge-donut-wrapper">
            <svg viewBox="0 0 90 90" class="gauge-donut-svg">
              <circle cx="45" cy="45" r="${radius}" fill="transparent" stroke="var(--bg-surface-elevated)" stroke-width="8" />
              <circle cx="45" cy="45" r="${radius}" fill="transparent" stroke="var(--accent-cyan)" stroke-width="8"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${strokeDashoffset}"
                stroke-linecap="round"
                transform="rotate(-90 45 45)"
                style="transition: stroke-dashoffset 0.8s ease;" />
            </svg>
            <div class="gauge-donut-center">
              <span class="gauge-pct">${stats.globalUsagePct}%</span>
              <span class="gauge-label">Uso</span>
            </div>
          </div>

          <div class="gauge-stats-column">
            <div class="gauge-stat-item">
              <span class="stat-dot" style="background: var(--accent-cyan);"></span>
              <div>
                <div class="gauge-stat-label">Espaço Usado</div>
                <div class="gauge-stat-val">${state.constructor.formatGB(stats.totalPhysicalUsedGB)}</div>
              </div>
            </div>
            <div class="gauge-stat-item">
              <span class="stat-dot" style="background: var(--accent-emerald);"></span>
              <div>
                <div class="gauge-stat-label">Espaço Livre</div>
                <div class="gauge-stat-val">${state.constructor.formatGB(stats.totalFreeGB)}</div>
              </div>
            </div>
            <div class="gauge-stat-item">
              <span class="stat-dot" style="background: var(--text-muted);"></span>
              <div>
                <div class="gauge-stat-label">Capacidade Total</div>
                <div class="gauge-stat-val">${state.constructor.formatGB(stats.totalStorageGB)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="sidebar-metrics-grid">
        <div class="metric-pill-card">
          <div class="metric-icon">🗄️</div>
          <div class="metric-info">
            <span class="metric-label">Mídias Físicas</span>
            <span class="metric-val">${stats.totalDrives}</span>
            <span class="metric-sub">${stats.hdCount} HD • ${stats.ssdCount} SSD</span>
          </div>
        </div>

        <div class="metric-pill-card">
          <div class="metric-icon">🎬</div>
          <div class="metric-info">
            <span class="metric-label">Projetos Totais</span>
            <span class="metric-val">${stats.totalProjects}</span>
            <span class="metric-sub">${stats.unassignedProjectsCount > 0 ? `<span style="color:var(--accent-amber); font-weight:700;">${stats.unassignedProjectsCount} sem drive</span>` : 'Todos vinculados'}</span>
          </div>
        </div>

        <div class="metric-pill-card" style="grid-column: 1 / -1;">
          <div class="metric-icon">${stats.safeBackupPct < 60 ? '⚠️' : '🛡️'}</div>
          <div class="metric-info" style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:baseline;">
              <span class="metric-label">Saúde de Backup</span>
              <span class="metric-val" style="font-size:15px; color:${stats.safeBackupPct < 60 ? 'var(--accent-rose)' : 'var(--accent-emerald)'}">${stats.safeBackupPct}%</span>
            </div>
            <div class="sidebar-mini-bar-track">
              <div class="sidebar-mini-bar-fill" style="width:${stats.safeBackupPct}%; background:${stats.safeBackupPct < 60 ? 'var(--accent-rose)' : 'var(--accent-emerald)'};"></div>
            </div>
            <span class="metric-sub">${stats.safeBackupCount} protegidos (2+ cópias) • ${stats.singleCopyCount} em risco</span>
          </div>
        </div>
      </div>

      <!-- Drives Storage List -->
      <div class="sidebar-drives-section">
        <div class="sidebar-section-title">
          <span>Dispositivos de Mídia</span>
          <span style="font-size:10px; color:var(--text-muted);">${state.drives.length}</span>
        </div>

        <div class="sidebar-drives-list">
          ${state.drives.length === 0 ? `
            <div style="font-size:12px; color:var(--text-muted); text-align:center; padding:16px;">
              Nenhum drive cadastrado.
            </div>
          ` : state.drives.map(drive => {
            const usage = state.calculateDriveUsage(drive.id);
            const isSSD = drive.type === 'ssd';
            const barClass = usage.isCritical ? 'critical' : usage.isWarning ? 'warning' : '';
            return `
              <div class="sidebar-drive-item" data-drive-id="${drive.id}">
                <div class="sidebar-drive-header">
                  <div class="sidebar-drive-name-row">
                    <span class="drive-color-dot" style="background:${drive.color || '#06b6d4'};"></span>
                    <span class="sidebar-drive-name" title="${drive.name}">${drive.name}</span>
                  </div>
                  <span class="pill ${isSSD ? 'pill-ssd' : 'pill-hd'}" style="font-size:10px; padding:1px 6px;">
                    ${isSSD ? 'SSD' : 'HD'}
                  </span>
                </div>

                <div class="sidebar-drive-bar-track">
                  <div class="sidebar-drive-bar-fill ${barClass}" style="width: ${usage.pct}%;"></div>
                </div>

                <div class="sidebar-drive-meta">
                  <span>${state.constructor.formatGB(usage.usedGB)} / ${state.constructor.formatGB(usage.totalGB)}</span>
                  <span style="font-weight:600; color:${usage.isCritical ? 'var(--accent-rose)' : 'var(--text-secondary)'};">${usage.pct}%</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

    </div>
  `;

  // Click on a drive in sidebar scrolls to it in the workbench
  sidebar.querySelectorAll('.sidebar-drive-item').forEach(item => {
    item.addEventListener('click', () => {
      const driveCard = document.querySelector(`.drive-card[data-drive-id="${item.dataset.driveId}"]`);
      if (driveCard) {
        driveCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        driveCard.classList.add('drag-target-over');
        setTimeout(() => driveCard.classList.remove('drag-target-over'), 1200);
      }
    });
  });
}

// 3. Floating Filters Popover (Triggered by the button in Workbench)
function renderFiltersPopover() {
  const popover = document.getElementById('filters-menu-popover');
  const countBadge = document.getElementById('active-filters-count');
  const toggleBtn = document.getElementById('btn-toggle-filters-menu');
  if (!popover || !countBadge || !toggleBtn) return;

  const stats = state.calculateGlobalStats();
  const clients = state.getClientsList();

  // Calculate active filters count
  let activeCount = 0;
  if (state.filters.redundancy !== 'all') activeCount++;
  if (state.filters.driveType !== 'all') activeCount++;
  if (state.filters.client !== 'all') activeCount++;
  if (state.filters.tag !== 'all') activeCount++;

  if (activeCount > 0) {
    countBadge.textContent = activeCount;
    countBadge.style.display = 'inline-flex';
    toggleBtn.classList.add('has-active-filters');
  } else {
    countBadge.style.display = 'none';
    toggleBtn.classList.remove('has-active-filters');
  }

  popover.innerHTML = `
    <div class="popover-header">
      <div style="display:flex; align-items:center; gap:6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        <strong>Filtrar Workbench</strong>
      </div>
      ${activeCount > 0 ? `
        <button type="button" class="btn-clear-filters" id="btn-popover-clear">
          Limpar Filtros
        </button>
      ` : ''}
    </div>

    <div class="popover-body">
      <!-- 1. Redundancy / Security Filter -->
      <div class="popover-group">
        <div class="popover-group-label">Segurança de Dados</div>
        <div class="popover-chips-row">
          <button class="filter-chip ${state.filters.redundancy === 'all' ? 'active' : ''}" data-filter-type="redundancy" data-filter-val="all">
            Todos (${stats.totalProjects})
          </button>
          <button class="filter-chip ${state.filters.redundancy === 'single' ? 'active' : ''}" data-filter-type="redundancy" data-filter-val="single">
            ⚠️ Cópia Única (${stats.singleCopyCount})
          </button>
          <button class="filter-chip ${state.filters.redundancy === 'safe' ? 'active' : ''}" data-filter-type="redundancy" data-filter-val="safe">
            🛡️ Com Backup (${stats.safeBackupCount})
          </button>
        </div>
      </div>

      <!-- 2. Drive Type Filter (HD or SSD only) -->
      <div class="popover-group">
        <div class="popover-group-label">Tipo de Mídia</div>
        <div class="popover-chips-row">
          <button class="filter-chip ${state.filters.driveType === 'all' ? 'active' : ''}" data-filter-type="driveType" data-filter-val="all">
            Todos (${stats.totalDrives})
          </button>
          <button class="filter-chip ${state.filters.driveType === 'hd' ? 'active' : ''}" data-filter-type="driveType" data-filter-val="hd">
            🗄️ HD (${stats.hdCount})
          </button>
          <button class="filter-chip ${state.filters.driveType === 'ssd' ? 'active' : ''}" data-filter-type="driveType" data-filter-val="ssd">
            ⚡ SSD (${stats.ssdCount})
          </button>
        </div>
      </div>

      <!-- 3. Client Filter -->
      <div class="popover-group">
        <div class="popover-group-label">Clientes / Produções</div>
        <div class="popover-chips-row">
          <button class="filter-chip ${state.filters.client === 'all' ? 'active' : ''}" data-filter-type="client" data-filter-val="all">
            Todos os Clientes
          </button>
          ${clients.map(client => `
            <button class="filter-chip ${state.filters.client === client ? 'active' : ''}" data-filter-type="client" data-filter-val="${client}">
              🎬 ${client}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Attach filter chip event handlers
  popover.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.dataset.filterType;
      const val = chip.dataset.filterVal;
      state.setFilter(type, val);
    });
  });

  const clearBtn = popover.querySelector('#btn-popover-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.resetFilters();
    });
  }
}

// 4. Drives Workbench View (Drag & Drop Interface)
function renderDrivesWorkbench() {
  const container = document.getElementById('drives-grid-container');
  const unassignedContainer = document.getElementById('unassigned-projects-container');
  if (!container) return;

  const filteredProjects = state.getFilteredProjects();
  const filteredProjectIds = new Set(filteredProjects.map(p => p.id));

  // Projects not assigned to any drive
  const unassignedProjects = state.projects.filter(p => !p.drives || p.drives.length === 0);
  const matchingUnassigned = unassignedProjects.filter(p => filteredProjectIds.has(p.id));

  // Render Unassigned Projects Banner if any exist
  if (unassignedContainer) {
    if (matchingUnassigned.length > 0) {
      unassignedContainer.style.display = 'block';
      unassignedContainer.innerHTML = `
        <div class="unassigned-banner">
          <div class="unassigned-banner-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:16px;">⚠️</span>
              <div>
                <strong style="color:var(--text-primary); font-size:13px;">Projetos Sem Drive Vinculado (${matchingUnassigned.length})</strong>
                <p style="font-size:11px; color:var(--text-muted); margin-top:2px;">Estes projetos continuam salvos no catálogo, mas não estão alocados em nenhum HD/SSD. Arraste-os para um drive abaixo para vincular!</p>
              </div>
            </div>
          </div>
          <div class="unassigned-cards-grid">
            ${matchingUnassigned.map(project => renderProjectCard(project, '')).join('')}
          </div>
        </div>
      `;
      attachProjectCardListeners(unassignedContainer);
    } else {
      unassignedContainer.style.display = 'none';
      unassignedContainer.innerHTML = '';
    }
  }

  // Filter drives if driveType filter is active
  const visibleDrives = state.drives.filter(drive => {
    if (state.filters.driveType !== 'all' && drive.type !== state.filters.driveType) return false;
    return true;
  });

  if (visibleDrives.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <p style="font-size: 16px; margin-bottom: 12px;">Nenhum drive encontrado com os filtros selecionados.</p>
        <button class="btn btn-secondary btn-sm" id="btn-reset-filters">Limpar Filtros</button>
      </div>
    `;
    const resetBtn = document.getElementById('btn-reset-filters');
    if (resetBtn) resetBtn.addEventListener('click', () => state.resetFilters());
    return;
  }

  container.innerHTML = visibleDrives.map(drive => {
    const usage = state.calculateDriveUsage(drive.id);
    const driveProjects = state.projects.filter(p => (p.drives || []).includes(drive.id));
    const matchingProjects = driveProjects.filter(p => filteredProjectIds.has(p.id));

    // Type badge (HD or SSD)
    const isSSD = drive.type === 'ssd';
    const typeClass = isSSD ? 'pill-ssd' : 'pill-hd';
    const typeLabel = isSSD ? '⚡ SSD' : '🗄️ HD';

    // File system class
    const fsClass = `pill-fs-${drive.fileSystem}`;
    const fsLabel = drive.fileSystem.toUpperCase();

    // Capacity bar state
    const barClass = usage.isCritical ? 'critical' : usage.isWarning ? 'warning' : '';

    return `
      <div class="drive-card" data-drive-id="${drive.id}" style="--drive-color: ${drive.color || '#06b6d4'};">
        
        <!-- Header (Clean without serial and without custody) -->
        <div class="drive-card-header">
          <div class="drive-title-area">
            <div class="drive-title-row">
              <span class="drive-name" title="${drive.name}">${drive.name}</span>
            </div>
            <div class="drive-meta-pills">
              <span class="pill ${typeClass}">${typeLabel}</span>
              <span class="pill ${fsClass}">${fsLabel}</span>
            </div>
          </div>
          <div class="drive-actions">
            <button class="btn btn-icon btn-drive-edit" data-drive-id="${drive.id}" title="Editar Drive">
              ✏️
            </button>
            <button class="btn btn-icon btn-add-project-to-drive" data-drive-id="${drive.id}" title="Adicionar Projeto Neste Drive">
              ➕
            </button>
          </div>
        </div>

        <!-- Capacity Meter -->
        <div class="drive-capacity-box">
          <div class="capacity-stats">
            <span class="capacity-used-val">${state.constructor.formatGB(usage.usedGB)} usados</span>
            <span class="capacity-total-val">de ${state.constructor.formatGB(usage.totalGB)}</span>
          </div>
          <div class="capacity-bar-track">
            <div class="capacity-bar-fill ${barClass}" style="width: ${usage.pct}%;"></div>
          </div>
          <div class="capacity-foot">
            <span>${usage.pct}% ocupado</span>
            <span>${state.constructor.formatGB(usage.freeGB)} livres</span>
          </div>
        </div>

        <!-- Droppable Projects List -->
        <div class="drive-projects-list ${matchingProjects.length === 0 ? 'empty-state' : ''}" data-drive-id="${drive.id}">
          ${matchingProjects.length > 0 ? matchingProjects.map(project => renderProjectCard(project, drive.id)).join('') : `
            <div>
              <p>Nenhum projeto neste drive</p>
              <p style="font-size: 11px; margin-top: 4px; color: var(--text-accent);">Arraste um projeto aqui para mover ou duplicar</p>
            </div>
          `}
        </div>

      </div>
    `;
  }).join('');

  // Event Listeners for Drive Actions
  container.querySelectorAll('.btn-drive-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const drive = state.drives.find(d => d.id === btn.dataset.driveId);
      if (drive) openDriveModal(drive);
    });
  });

  container.querySelectorAll('.btn-add-project-to-drive').forEach(btn => {
    btn.addEventListener('click', () => {
      openProjectModal(null, btn.dataset.driveId);
    });
  });

  // Attach Project Card Actions inside drives
  attachProjectCardListeners(container);
}

// Render Individual Project Card
function renderProjectCard(project, currentDriveId) {
  const copies = (project.drives || []).length;
  let backupPill = '';
  if (copies === 0) {
    backupPill = `<span class="pill pill-unassigned" title="Projeto não está em nenhum drive!">⚠️ Sem Drive</span>`;
  } else if (copies >= 2) {
    backupPill = `<span class="pill pill-backup-safe" title="Salvo em ${copies} drives: backup seguro!">🛡️ ${copies} Cópias</span>`;
  } else {
    backupPill = `<span class="pill pill-backup-danger" title="Apenas 1 cópia! Risco se o drive falhar.">⚠️ Cópia Única</span>`;
  }

  return `
    <div class="project-card ${copies === 0 ? 'is-unassigned' : ''}" draggable="true" data-project-id="${project.id}" data-drive-id="${currentDriveId}">
      <div class="project-card-header">
        <div class="project-title-box">
          <div class="project-name" title="${project.name}">${project.name}</div>
          <div class="project-client">🎬 ${project.client}</div>
        </div>
        <div class="project-weight-badge">${state.constructor.formatGB(project.sizeGB)}</div>
      </div>

      <div class="project-meta-row">
        <div class="project-tags">
          ${project.tags.slice(0, 2).map(tag => `<span class="project-tag">${tag}</span>`).join('')}
          ${project.tags.length > 2 ? `<span class="project-tag">+${project.tags.length - 2}</span>` : ''}
        </div>
        ${backupPill}
      </div>

      <div style="display:flex; justify-content:flex-end; gap:4px; margin-top:4px;">
        <button class="btn btn-secondary btn-sm btn-project-move" data-project-id="${project.id}" data-drive-id="${currentDriveId}" style="padding: 2px 8px; font-size: 11px;">
          ${currentDriveId ? 'Mover / Duplicar ➔' : 'Atribuir a Drive ➔'}
        </button>
        <button class="btn btn-secondary btn-sm btn-project-edit" data-project-id="${project.id}" style="padding: 2px 6px; font-size: 11px;">
          ✎
        </button>
      </div>
    </div>
  `;
}

// Project card action buttons
function attachProjectCardListeners(container) {
  container.querySelectorAll('.btn-project-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const project = state.projects.find(p => p.id === btn.dataset.projectId);
      if (project) openProjectModal(project);
    });
  });

  container.querySelectorAll('.btn-project-move').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const project = state.projects.find(p => p.id === btn.dataset.projectId);
      const currentDrive = state.drives.find(d => d.id === btn.dataset.driveId);
      if (project) openMoveProjectModal(project, currentDrive || null);
    });
  });
}

// 5. Projects Table View (Spreadsheet Style)
function renderProjectsTable() {
  const tableBody = document.getElementById('projects-table-body');
  if (!tableBody) return;

  const projects = state.getFilteredProjects();

  if (projects.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
          Nenhum projeto encontrado.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = projects.map(proj => {
    const copies = (proj.drives || []).length;
    let backupBadge = '';
    if (copies === 0) {
      backupBadge = `<span class="pill pill-unassigned">⚠️ Sem Drive</span>`;
    } else if (copies >= 2) {
      backupBadge = `<span class="pill pill-backup-safe">🛡️ Backup Seguro (${copies} drives)</span>`;
    } else {
      backupBadge = `<span class="pill pill-backup-danger">⚠️ Cópia Única (Sem Backup)</span>`;
    }

    const drivesList = (proj.drives || []).map(driveId => {
      const drive = state.drives.find(d => d.id === driveId);
      return drive ? `<span class="pill" style="border: 1px solid ${drive.color}; color: #fff;">${drive.name}</span>` : '';
    }).filter(Boolean).join(' ');

    return `
      <tr>
        <td>
          <div class="table-project-name">${proj.name}</div>
          <div style="font-size:11px; color:var(--text-muted);">${proj.notes || 'Sem observações'}</div>
        </td>
        <td><strong>${proj.client}</strong></td>
        <td><span class="project-weight-badge">${state.constructor.formatGB(proj.sizeGB)}</span></td>
        <td>
          <div style="display:flex; flex-wrap:wrap; gap:4px;">
            ${drivesList || '<span class="pill pill-unassigned" style="font-size:11px;">⚠️ Nenhum drive vinculado</span>'}
          </div>
        </td>
        <td>${backupBadge}</td>
        <td>
          <div style="display:flex; flex-wrap:wrap; gap:3px;">
            ${proj.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}
          </div>
        </td>
        <td>
          <div style="display:flex; gap:6px; align-items:center;">
            <button class="btn btn-secondary btn-sm btn-table-edit" data-project-id="${proj.id}" title="Editar Projeto">Editar</button>
            <button class="btn btn-secondary btn-sm btn-table-move" data-project-id="${proj.id}" title="Mover ou Duplicar Projeto">Mover / Duplicar</button>
            <button class="btn btn-danger btn-sm btn-table-delete" data-project-id="${proj.id}" title="Excluir Projeto do Catálogo" style="padding: 4px 8px;">✕</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tableBody.querySelectorAll('.btn-table-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const project = state.projects.find(p => p.id === btn.dataset.projectId);
      if (project) openProjectModal(project);
    });
  });

  tableBody.querySelectorAll('.btn-table-move').forEach(btn => {
    btn.addEventListener('click', () => {
      const project = state.projects.find(p => p.id === btn.dataset.projectId);
      const sourceDrive = (project.drives && project.drives.length > 0) ? state.drives.find(d => d.id === project.drives[0]) : null;
      if (project) openMoveProjectModal(project, sourceDrive);
    });
  });

  tableBody.querySelectorAll('.btn-table-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const project = state.projects.find(p => p.id === btn.dataset.projectId);
      if (project && confirm(`Tem certeza que deseja excluir permanentemente o projeto "${project.name}" do catálogo e de todos os drives?`)) {
        state.deleteProject(project.id);
        showToast(`Projeto "${project.name}" excluído.`);
      }
    });
  });
}

/* ==========================================================================
   DMS DRIVE MANAGER - UI RENDER ENGINE
   Dynamic DOM rendering for drives workbench, projects table, and analytics
   ========================================================================== */

import { state } from './state.js';
import { 
  openDriveModal, 
  openProjectModal, 
  openMoveProjectModal, 
  openCustodyQuickEdit,
  showToast 
} from './modals.js';

// Entry point: re-renders current view
export function renderApp() {
  renderHeaderStatus();
  renderSidebarFilters();

  if (state.activeView === 'drives') {
    renderDrivesWorkbench();
  } else if (state.activeView === 'table') {
    renderProjectsTable();
  } else if (state.activeView === 'analytics') {
    renderStorageAnalytics();
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

// 2. Sidebar Filters
function renderSidebarFilters() {
  const sidebar = document.getElementById('sidebar-filters');
  if (!sidebar) return;

  const stats = state.calculateGlobalStats();
  const clients = state.getClientsList();
  const custodies = state.getCustodiesList();

  sidebar.innerHTML = `
    <!-- Redundancy Filter -->
    <div class="filter-group">
      <div class="filter-group-title">
        <span>Segurança de Dados</span>
      </div>
      <div class="filter-list">
        <button class="filter-item-btn ${state.filters.redundancy === 'all' ? 'active' : ''}" data-filter-type="redundancy" data-filter-val="all">
          <span>Todos os Projetos</span>
          <span class="filter-pill-count">${stats.totalProjects}</span>
        </button>
        <button class="filter-item-btn ${state.filters.redundancy === 'single' ? 'active' : ''}" data-filter-type="redundancy" data-filter-val="single">
          <span style="display:flex; align-items:center; gap:6px;">
            <span style="color:var(--accent-rose);">⚠️</span> Cópia Única (Risco)
          </span>
          <span class="filter-pill-count">${stats.singleCopyCount}</span>
        </button>
        <button class="filter-item-btn ${state.filters.redundancy === 'safe' ? 'active' : ''}" data-filter-type="redundancy" data-filter-val="safe">
          <span style="display:flex; align-items:center; gap:6px;">
            <span style="color:var(--accent-emerald);">🛡️</span> Com Backup (2+)
          </span>
          <span class="filter-pill-count">${stats.safeBackupCount}</span>
        </button>
      </div>
    </div>

    <!-- Drive Type Filter -->
    <div class="filter-group">
      <div class="filter-group-title">
        <span>Tipo de Drive</span>
      </div>
      <div class="filter-list">
        <button class="filter-item-btn ${state.filters.driveType === 'all' ? 'active' : ''}" data-filter-type="driveType" data-filter-val="all">
          <span>Todos os Tipos</span>
          <span class="filter-pill-count">${stats.totalDrives}</span>
        </button>
        <button class="filter-item-btn ${state.filters.driveType === 'nvme' ? 'active' : ''}" data-filter-type="driveType" data-filter-val="nvme">
          <span>⚡ NVMe M.2</span>
          <span class="filter-pill-count">${state.drives.filter(d => d.type === 'nvme').length}</span>
        </button>
        <button class="filter-item-btn ${state.filters.driveType === 'ssd' ? 'active' : ''}" data-filter-type="driveType" data-filter-val="ssd">
          <span>💾 SSD Externo</span>
          <span class="filter-pill-count">${state.drives.filter(d => d.type === 'ssd').length}</span>
        </button>
        <button class="filter-item-btn ${state.filters.driveType === 'hdd' ? 'active' : ''}" data-filter-type="driveType" data-filter-val="hdd">
          <span>🗄️ HDD Desktop</span>
          <span class="filter-pill-count">${state.drives.filter(d => d.type === 'hdd').length}</span>
        </button>
        <button class="filter-item-btn ${state.filters.driveType === 'raid' ? 'active' : ''}" data-filter-type="driveType" data-filter-val="raid">
          <span>🏢 RAID / Storage</span>
          <span class="filter-pill-count">${state.drives.filter(d => d.type === 'raid').length}</span>
        </button>
      </div>
    </div>

    <!-- Custody Filter -->
    <div class="filter-group">
      <div class="filter-group-title">
        <span>Custódia / Onde Está</span>
      </div>
      <div class="filter-list">
        <button class="filter-item-btn ${state.filters.custody === 'all' ? 'active' : ''}" data-filter-type="custody" data-filter-val="all">
          <span>Todas Localizações</span>
        </button>
        ${custodies.map(cust => `
          <button class="filter-item-btn ${state.filters.custody === cust ? 'active' : ''}" data-filter-type="custody" data-filter-val="${cust}">
            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">📍 ${cust}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Client Filter -->
    <div class="filter-group">
      <div class="filter-group-title">
        <span>Clientes</span>
      </div>
      <div class="filter-list">
        <button class="filter-item-btn ${state.filters.client === 'all' ? 'active' : ''}" data-filter-type="client" data-filter-val="all">
          <span>Todos os Clientes</span>
        </button>
        ${clients.map(client => `
          <button class="filter-item-btn ${state.filters.client === client ? 'active' : ''}" data-filter-type="client" data-filter-val="${client}">
            <span>🎬 ${client}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  // Attach filter click handlers
  sidebar.querySelectorAll('.filter-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.filterType;
      const val = btn.dataset.filterVal;
      state.setFilter(type, val);
    });
  });
}

// 3. Drives Workbench View (Drag & Drop Interface)
function renderDrivesWorkbench() {
  const container = document.getElementById('drives-grid-container');
  if (!container) return;

  const filteredProjects = state.getFilteredProjects();
  const filteredProjectIds = new Set(filteredProjects.map(p => p.id));

  // Filter drives if driveType or custody filter is active
  const visibleDrives = state.drives.filter(drive => {
    if (state.filters.driveType !== 'all' && drive.type !== state.filters.driveType) return false;
    if (state.filters.custody !== 'all' && drive.custody !== state.filters.custody) return false;
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
    const driveProjects = state.projects.filter(p => p.drives.includes(drive.id));
    const matchingProjects = driveProjects.filter(p => filteredProjectIds.has(p.id));

    // Type badge class
    const typeClass = `pill-${drive.type}`;
    const typeLabel = drive.type === 'nvme' ? 'NVMe M.2' : drive.type === 'ssd' ? 'SSD' : drive.type === 'raid' ? 'RAID' : 'HDD 3.5"';

    // File system class
    const fsClass = `pill-fs-${drive.fileSystem}`;
    const fsLabel = drive.fileSystem.toUpperCase();

    // Capacity bar state
    const barClass = usage.isCritical ? 'critical' : usage.isWarning ? 'warning' : '';

    return `
      <div class="drive-card" data-drive-id="${drive.id}" style="--drive-color: ${drive.color || '#06b6d4'};">
        
        <!-- Header -->
        <div class="drive-card-header">
          <div class="drive-title-area">
            <div class="drive-title-row">
              <span class="drive-name" title="${drive.name}">${drive.name}</span>
              <span class="drive-serial">${drive.serial}</span>
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

        <!-- Custody Bar -->
        <div class="drive-custody-row">
          <span style="color:var(--text-muted);">Custódia física:</span>
          <span class="custody-badge-interactive btn-quick-custody" data-drive-id="${drive.id}" title="Clique para alterar a localização">
            📍 <strong>${drive.custody}</strong> ✎
          </span>
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

  container.querySelectorAll('.btn-quick-custody').forEach(btn => {
    btn.addEventListener('click', () => {
      const drive = state.drives.find(d => d.id === btn.dataset.driveId);
      if (drive) openCustodyQuickEdit(drive);
    });
  });

  // Attach Project Card Actions inside drives
  attachProjectCardListeners(container);
}

// Render Individual Project Card
function renderProjectCard(project, currentDriveId) {
  const isSafe = project.drives.length >= 2;
  const backupPill = isSafe
    ? `<span class="pill pill-backup-safe" title="Salvo em ${project.drives.length} drives: seguro!">🛡️ ${project.drives.length} Cópias</span>`
    : `<span class="pill pill-backup-danger" title="Apenas 1 cópia! Risco se o drive falhar.">⚠️ Cópia Única</span>`;

  return `
    <div class="project-card" draggable="true" data-project-id="${project.id}" data-drive-id="${currentDriveId}">
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
          Mover / Duplicar ➔
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
      if (project) openMoveProjectModal(project, currentDrive);
    });
  });
}

// 4. Projects Table View (Spreadsheet Style)
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
    const isSafe = proj.drives.length >= 2;
    const backupBadge = isSafe
      ? `<span class="pill pill-backup-safe">🛡️ Backup Seguro (${proj.drives.length} drives)</span>`
      : `<span class="pill pill-backup-danger">⚠️ Cópia Única (Sem Backup)</span>`;

    const drivesList = proj.drives.map(driveId => {
      const drive = state.drives.find(d => d.id === driveId);
      return drive ? `<span class="pill" style="border: 1px solid ${drive.color}; color: #fff;">${drive.name}</span>` : '';
    }).join(' ');

    return `
      <tr>
        <td>
          <div class="table-project-name">${proj.name}</div>
          <div style="font-size:11px; color:var(--text-muted);">${proj.notes || 'Sem observações'}</div>
        </td>
        <td><strong>${proj.client}</strong></td>
        <td><span class="project-weight-badge">${state.constructor.formatGB(proj.sizeGB)}</span></td>
        <td><div style="display:flex; flex-wrap:wrap; gap:4px;">${drivesList}</div></td>
        <td>${backupBadge}</td>
        <td>
          <div style="display:flex; flex-wrap:wrap; gap:3px;">
            ${proj.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}
          </div>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary btn-sm btn-table-edit" data-project-id="${proj.id}">Editar</button>
            <button class="btn btn-secondary btn-sm btn-table-move" data-project-id="${proj.id}">Mover / Duplicar</button>
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
      const sourceDrive = state.drives.find(d => d.id === project.drives[0]);
      if (project) openMoveProjectModal(project, sourceDrive);
    });
  });
}

// 5. Storage Analytics & Intuitive Charts
function renderStorageAnalytics() {
  const container = document.getElementById('analytics-container');
  if (!container) return;

  const stats = state.calculateGlobalStats();

  // SVG Donut calculation
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.globalUsagePct / 100) * circumference;

  container.innerHTML = `
    <!-- Top Stats Counters -->
    <div class="analytics-grid">
      <div class="stat-card" style="--stat-color: var(--accent-cyan); --stat-glow: rgba(6, 182, 212, 0.15);">
        <div class="stat-header">
          <span class="stat-label">Capacidade Total</span>
          <div class="stat-icon">🗄️</div>
        </div>
        <div class="stat-value">${state.constructor.formatGB(stats.totalStorageGB)}</div>
        <div class="stat-meta">Distribuído em ${stats.totalDrives} drives físicos</div>
      </div>

      <div class="stat-card" style="--stat-color: var(--accent-amber); --stat-glow: rgba(245, 158, 11, 0.15);">
        <div class="stat-header">
          <span class="stat-label">Espaço Ocupado</span>
          <div class="stat-icon">📊</div>
        </div>
        <div class="stat-value">${state.constructor.formatGB(stats.totalPhysicalUsedGB)}</div>
        <div class="stat-meta">${stats.globalUsagePct}% da capacidade total do estúdio</div>
      </div>

      <div class="stat-card" style="--stat-color: var(--accent-emerald); --stat-glow: rgba(16, 185, 129, 0.15);">
        <div class="stat-header">
          <span class="stat-label">Espaço Livre</span>
          <div class="stat-icon">✨</div>
        </div>
        <div class="stat-value">${state.constructor.formatGB(stats.totalFreeGB)}</div>
        <div class="stat-meta">Disponível para novos projetos e gravações</div>
      </div>

      <div class="stat-card" style="--stat-color: ${stats.safeBackupPct < 60 ? 'var(--accent-rose)' : 'var(--accent-emerald)'}; --stat-glow: rgba(16, 185, 129, 0.15);">
        <div class="stat-header">
          <span class="stat-label">Saúde do Backup</span>
          <div class="stat-icon">${stats.safeBackupPct < 60 ? '⚠️' : '🛡️'}</div>
        </div>
        <div class="stat-value">${stats.safeBackupPct}%</div>
        <div class="stat-meta">${stats.safeBackupCount} de ${stats.totalProjects} projetos possuem backup redundante</div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="charts-layout">
      
      <!-- Interactive SVG Donut Chart -->
      <div class="chart-card">
        <div class="chart-card-header">
          <span class="chart-title">Visão Geral de Ocupação</span>
        </div>
        <div class="chart-donut-wrapper">
          <div class="donut-svg-container">
            <svg viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="${radius}" fill="transparent" stroke="var(--bg-surface-elevated)" stroke-width="18" />
              <circle cx="80" cy="80" r="${radius}" fill="transparent" stroke="var(--accent-cyan)" stroke-width="18"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${strokeDashoffset}"
                stroke-linecap="round"
                style="transition: stroke-dashoffset 1s ease;" />
            </svg>
            <div class="donut-center-text">
              <span class="donut-center-pct">${stats.globalUsagePct}%</span>
              <span class="donut-center-sub">Ocupado</span>
            </div>
          </div>

          <div class="donut-legend">
            <div class="legend-item">
              <span class="legend-color-dot" style="background: var(--accent-cyan);"></span>
              <span class="legend-label">Espaço Utilizado:</span>
              <span class="legend-value">${state.constructor.formatGB(stats.totalPhysicalUsedGB)}</span>
            </div>
            <div class="legend-item">
              <span class="legend-color-dot" style="background: var(--bg-surface-elevated);"></span>
              <span class="legend-label">Espaço Livre:</span>
              <span class="legend-value">${state.constructor.formatGB(stats.totalFreeGB)}</span>
            </div>
            <div class="legend-item" style="margin-top: 8px;">
              <span class="legend-color-dot" style="background: var(--accent-emerald);"></span>
              <span class="legend-label">Projetos Seguros (2+ cópias):</span>
              <span class="legend-value">${stats.safeBackupCount}</span>
            </div>
            <div class="legend-item">
              <span class="legend-color-dot" style="background: var(--accent-rose);"></span>
              <span class="legend-label">Projetos em Risco (Cópia única):</span>
              <span class="legend-value">${stats.singleCopyCount}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Capacity Bar List Per Drive -->
      <div class="chart-card">
        <div class="chart-card-header">
          <span class="chart-title">Ocupação por Drive Físico</span>
        </div>
        <div class="bar-chart-list">
          ${state.drives.map(drive => {
            const usage = state.calculateDriveUsage(drive.id);
            const fillColor = usage.isCritical ? 'var(--gradient-critical)' : usage.isWarning ? 'var(--gradient-warning)' : 'var(--gradient-safe)';
            return `
              <div class="bar-chart-row">
                <div class="bar-chart-row-meta">
                  <span class="bar-chart-name">
                    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${drive.color}; margin-right:6px;"></span>
                    ${drive.name} (${drive.custody})
                  </span>
                  <span class="bar-chart-val">${state.constructor.formatGB(usage.usedGB)} / ${state.constructor.formatGB(usage.totalGB)} (${usage.pct}%)</span>
                </div>
                <div class="bar-chart-track">
                  <div class="bar-chart-fill" style="width: ${usage.pct}%; background: ${fillColor};"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

    </div>
  `;
}

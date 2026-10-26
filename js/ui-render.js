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

  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  const activeSection = document.getElementById(`view-${state.activeView}`);
  if (activeSection) activeSection.classList.add('active');

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
      
      <!-- 1. Navigation Section in Sidebar -->
      <div class="sidebar-nav-section">
        <div class="sidebar-header">
          <div class="sidebar-header-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            <span>Navegação</span>
          </div>
        </div>

        <div class="sidebar-nav-tabs">
          <button type="button" class="nav-tab-btn ${state.activeView === 'drives' ? 'active' : ''}" data-view="drives" title="Visualizar Drives">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
            <span>Drives</span>
          </button>
          <button type="button" class="nav-tab-btn ${state.activeView === 'table' ? 'active' : ''}" data-view="table" title="Visualizar Projetos">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>Projetos</span>
          </button>
        </div>
      </div>

      <!-- 2. Storage Header -->
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
              <circle cx="45" cy="45" r="${radius}" fill="transparent" stroke="var(--accent-yellow, #ffbb00)" stroke-width="8"
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
              <span class="stat-dot" style="background: var(--text-muted);"></span>
              <div>
                <div class="gauge-stat-label">Espaço Total</div>
                <div class="gauge-stat-val">${state.constructor.formatGB(stats.totalStorageGB)}</div>
              </div>
            </div>
            <div class="gauge-stat-item">
              <span class="stat-dot" style="background: var(--accent-yellow, #ffbb00);"></span>
              <div>
                <div class="gauge-stat-label">Espaço Usado</div>
                <div class="gauge-stat-val">${state.constructor.formatGB(stats.totalPhysicalUsedGB)}</div>
              </div>
            </div>
            <div class="gauge-stat-item">
              <span class="stat-dot" style="background: #10b981;"></span>
              <div>
                <div class="gauge-stat-label">Espaço Livre</div>
                <div class="gauge-stat-val">${state.constructor.formatGB(stats.totalFreeGB)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="sidebar-metrics-grid">
        <div class="metric-pill-card">
          <div class="metric-info">
            <span class="metric-label">DRIVES</span>
            <span class="metric-val">${stats.totalDrives}</span>
            <span class="metric-sub">${stats.hdCount} HD • ${stats.ssdCount} SSD</span>
          </div>
        </div>

        <div class="metric-pill-card">
          <div class="metric-info">
            <span class="metric-label">PROJETOS</span>
            <span class="metric-val">${stats.totalProjects}</span>
            <span class="metric-sub">${stats.unassignedProjectsCount > 0 ? `<span style="color:var(--accent-yellow); font-weight:700;">${stats.unassignedProjectsCount} sem drive</span>` : 'Todos vinculados'}</span>
          </div>
        </div>

        <div class="metric-pill-card ${stats.atRiskCount > 0 ? 'has-risk' : ''}" id="sidebar-at-risk-card" style="grid-column: 1 / -1; cursor: pointer;">
          <div class="metric-info" style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:baseline;">
              <span class="metric-label" style="${stats.atRiskCount > 0 ? 'color: #ef4444; font-weight: 800;' : ''}">PROJETOS EM RISCO</span>
              <span class="metric-val" style="font-size:16px; font-weight:800; color:${stats.atRiskCount > 0 ? '#ef4444' : 'var(--text-secondary)'};">${stats.atRiskCount}</span>
            </div>
            <span class="metric-sub" style="margin-top: 4px; ${stats.atRiskCount > 0 ? 'color: #fca5a5;' : ''}">
              ${stats.atRiskCount === 0 ? 'Nenhum projeto em risco' : `${stats.atRiskCount} ${stats.atRiskCount === 1 ? 'projeto com cópia única' : 'projetos com cópia única'} (não arquivados)`}
            </span>
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
            const isSSD = String(drive.type).toUpperCase() === 'SSD';
            const barClass = usage.isCritical ? 'critical' : usage.isWarning ? 'warning' : '';
            return `
              <div class="sidebar-drive-item" data-drive-id="${drive.id}">
                <div class="sidebar-drive-header">
                  <div class="sidebar-drive-name-row">
                    <span class="drive-color-dot" style="background:${drive.color || '#ffbb00'};"></span>
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

  // Hover Popover on "Projetos em Risco"
  const atRiskCard = sidebar.querySelector('#sidebar-at-risk-card');
  if (atRiskCard) {
    let tooltip = document.getElementById('at-risk-floating-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'at-risk-floating-tooltip';
      tooltip.className = 'at-risk-floating-tooltip';
      document.body.appendChild(tooltip);
    }

    let hideTimeout = null;

    const showTooltip = () => {
      clearTimeout(hideTimeout);
      const atRiskProjects = stats.atRiskProjects || [];
      const rect = atRiskCard.getBoundingClientRect();

      tooltip.innerHTML = `
        <div class="at-risk-tooltip-header">
          <div style="display:flex; align-items:center; gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${atRiskProjects.length > 0 ? '#ef4444' : '#10b981'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <strong style="color:${atRiskProjects.length > 0 ? '#ef4444' : '#10b981'}; font-size:12px;">
              ${atRiskProjects.length > 0 ? `Projetos em Risco (${atRiskProjects.length})` : 'Tudo Seguro'}
            </strong>
          </div>
        </div>

        ${atRiskProjects.length === 0 ? `
          <div style="font-size:11px; color:var(--text-muted); padding:8px 0; text-align:center;">
            Todos os projetos possuem 2+ cópias ou estão arquivados.
          </div>
        ` : `
          <div class="at-risk-tooltip-list">
            ${atRiskProjects.map(proj => {
              const drive = proj.drives && proj.drives.length > 0 ? state.drives.find(d => d.id === proj.drives[0]) : null;
              return `
                <div class="at-risk-tooltip-item">
                  <div style="font-weight:600; font-size:12px; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${proj.name}</div>
                  <div style="font-size:10px; color:var(--text-muted); display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                    <span>${proj.client} • ${state.constructor.formatGB(proj.sizeGB)}</span>
                    <span style="color:${drive ? (drive.color || '#ffbb00') : '#ef4444'}; font-weight:700;">
                      ${drive ? drive.name : 'Sem Drive'}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      `;

      const topPos = Math.max(10, Math.min(window.innerHeight - 340, rect.top));
      tooltip.style.top = `${topPos}px`;
      tooltip.style.left = `${rect.right + 10}px`;
      tooltip.classList.add('visible');
    };

    const hideTooltip = () => {
      hideTimeout = setTimeout(() => {
        tooltip.classList.remove('visible');
      }, 150);
    };

    atRiskCard.onmouseenter = showTooltip;
    atRiskCard.onmouseleave = hideTooltip;
    tooltip.onmouseenter = () => clearTimeout(hideTimeout);
    tooltip.onmouseleave = hideTooltip;
  }
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
      <!-- 1. Clientes / Produções (Alphabetical) -->
      <div class="popover-group">
        <div class="popover-group-label">Clientes / Produções</div>
        <div class="popover-chips-row">
          <button class="filter-chip ${state.filters.client === 'all' ? 'active' : ''}" data-filter-type="client" data-filter-val="all">
            Todos os Clientes
          </button>
          ${clients.sort((a, b) => a.localeCompare(b, 'pt-BR')).map(client => `
            <button class="filter-chip ${state.filters.client === client ? 'active' : ''}" data-filter-type="client" data-filter-val="${client}">
              ${client}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- 2. Segurança de Dados (Alphabetical: Com Backup, Cópia Única, Todos) -->
      <div class="popover-group">
        <div class="popover-group-label">Segurança de Dados</div>
        <div class="popover-chips-row">
          <button class="filter-chip ${state.filters.redundancy === 'safe' ? 'active' : ''}" data-filter-type="redundancy" data-filter-val="safe">
            Com Backup (${stats.safeBackupCount})
          </button>
          <button class="filter-chip ${state.filters.redundancy === 'single' ? 'active' : ''}" data-filter-type="redundancy" data-filter-val="single">
            Cópia Única (${stats.singleCopyCount})
          </button>
          <button class="filter-chip ${state.filters.redundancy === 'all' ? 'active' : ''}" data-filter-type="redundancy" data-filter-val="all">
            Todos (${stats.totalProjects})
          </button>
        </div>
      </div>

      <!-- 3. Tipo de Mídia (Alphabetical: HD, SSD, Todos) -->
      <div class="popover-group">
        <div class="popover-group-label">Tipo de Mídia</div>
        <div class="popover-chips-row">
          <button class="filter-chip ${String(state.filters.driveType).toUpperCase() === 'HD' ? 'active' : ''}" data-filter-type="driveType" data-filter-val="HD">
            HD (${stats.hdCount})
          </button>
          <button class="filter-chip ${String(state.filters.driveType).toUpperCase() === 'SSD' ? 'active' : ''}" data-filter-type="driveType" data-filter-val="SSD">
            SSD (${stats.ssdCount})
          </button>
          <button class="filter-chip ${state.filters.driveType === 'all' ? 'active' : ''}" data-filter-type="driveType" data-filter-val="all">
            Todos (${stats.totalDrives})
          </button>
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

// 4. Drives Workbench View (Drag & Drop Interface with Grid or List view modes)
function renderDrivesWorkbench() {
  const container = document.getElementById('drives-grid-container');
  const unassignedContainer = document.getElementById('unassigned-projects-container');
  if (!container) return;

  // Toggle buttons active state
  const btnGrid = document.getElementById('btn-view-grid');
  const btnList = document.getElementById('btn-view-list');
  if (btnGrid) btnGrid.classList.toggle('active', state.workbenchLayout === 'grid');
  if (btnList) btnList.classList.toggle('active', state.workbenchLayout === 'list');

  const filteredProjects = state.getFilteredProjects();
  const filteredProjectIds = new Set(filteredProjects.map(p => p.id));

  // Projects not assigned to any drive
  const unassignedProjects = state.projects.filter(p => !p.drives || p.drives.length === 0);
  const matchingUnassigned = unassignedProjects.filter(p => filteredProjectIds.has(p.id));
  matchingUnassigned.sort((a, b) => {
    const clientA = (a.client || '').trim().toLowerCase();
    const clientB = (b.client || '').trim().toLowerCase();
    const comp = clientA.localeCompare(clientB, 'pt-BR', { sensitivity: 'base' });
    if (comp !== 0) return comp;
    const nameA = (a.name || '').trim().toLowerCase();
    const nameB = (b.name || '').trim().toLowerCase();
    return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
  });

  // Render Unassigned Projects Banner if any exist
  if (unassignedContainer) {
    if (matchingUnassigned.length > 0) {
      unassignedContainer.style.display = 'block';
      unassignedContainer.innerHTML = `
        <div class="unassigned-banner">
          <div class="unassigned-banner-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffbb00" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <div>
                <strong style="color:var(--text-primary); font-size:13px;">Projetos Sem Drive Vinculado (${matchingUnassigned.length})</strong>
                <p style="font-size:11px; color:var(--text-muted); margin-top:2px;">Estes projetos continuam salvos no catálogo, mas não estão alocados em nenhum HD ou SSD. Arraste-os para um drive abaixo para vincular!</p>
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

  // Filter drives: if search or project filters are active, only show drives that match or have matching projects
  const searchQuery = (state.filters.searchQuery || '').trim().toLowerCase();
  const isSearchActive = searchQuery.length > 0;

  const visibleDrives = state.drives.filter(drive => {
    // 1. Drive type filter
    if (state.filters.driveType !== 'all') {
      if (String(drive.type).toUpperCase() !== String(state.filters.driveType).toUpperCase()) return false;
    }

    // Projects belonging to this drive that match active filters
    const driveProjects = state.projects.filter(p => (p.drives || []).includes(drive.id));
    const matchingProjects = driveProjects.filter(p => filteredProjectIds.has(p.id));

    // If searching, hide drives without matching projects unless the drive itself matches the search
    if (isSearchActive) {
      const driveMatch = drive.name.toLowerCase().includes(searchQuery) ||
                         (drive.notes && drive.notes.toLowerCase().includes(searchQuery));
      if (!driveMatch && matchingProjects.length === 0) {
        return false;
      }
    } else {
      // If other project filters (client, redundancy, tag) are active, only show drives with matching projects
      const otherFiltersActive = state.filters.client !== 'all' || 
                                 state.filters.redundancy !== 'all' || 
                                 state.filters.tag !== 'all';
      if (otherFiltersActive && matchingProjects.length === 0) {
        return false;
      }
    }

    return true;
  });

  // If no drives exist at all in the system, show clean onboarding empty state
  if (state.drives.length === 0) {
    container.className = 'drives-empty-state-wrap';
    container.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-state-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
          </svg>
        </div>
        <h3 class="empty-state-title">Nenhum drive cadastrado ainda</h3>
        <p class="empty-state-desc">
          Cadastre seus HDs externos, SSDs portáteis ou storages para começar a organizar seus projetos de vídeo e monitorar a capacidade de armazenamento.
        </p>
        <button type="button" class="btn btn-primary" id="btn-empty-add-drive">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Cadastrar Primeiro Drive</span>
        </button>
      </div>
    `;
    const addDriveBtn = document.getElementById('btn-empty-add-drive');
    if (addDriveBtn) {
      addDriveBtn.addEventListener('click', () => openDriveModal());
    }
    return;
  }

  // If drives exist but none match active filters
  if (visibleDrives.length === 0) {
    container.className = state.workbenchLayout === 'list' ? 'drives-list-container' : 'drives-grid';
    container.innerHTML = `
      <div style="width: 100%; text-align: center; padding: 60px 20px; color: var(--text-muted); flex: 1;">
        <p style="font-size: 15px; margin-bottom: 12px; color: var(--text-secondary);">
          ${isSearchActive ? `Nenhum drive ou projeto encontrado para "${state.filters.searchQuery}".` : 'Nenhum drive encontrado com os filtros selecionados.'}
        </p>
        <button class="btn btn-secondary btn-sm" id="btn-reset-filters">Limpar Filtros</button>
      </div>
    `;
    const resetBtn = document.getElementById('btn-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.resetFilters();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.value = '';
      });
    }
    return;
  }

  // Render according to layout mode: 'list' (Table / Master-Detail) or 'grid' (Cards)
  if (state.workbenchLayout === 'list') {
    container.className = 'drives-list-container';
    container.innerHTML = visibleDrives.map(drive => {
      const usage = state.calculateDriveUsage(drive.id);
      const driveProjects = state.projects.filter(p => (p.drives || []).includes(drive.id));
      const matchingProjects = driveProjects.filter(p => filteredProjectIds.has(p.id));
      matchingProjects.sort((a, b) => {
        const clientA = (a.client || '').trim().toLowerCase();
        const clientB = (b.client || '').trim().toLowerCase();
        const comp = clientA.localeCompare(clientB, 'pt-BR', { sensitivity: 'base' });
        if (comp !== 0) return comp;
        const nameA = (a.name || '').trim().toLowerCase();
        const nameB = (b.name || '').trim().toLowerCase();
        return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
      });

      const isSSD = String(drive.type).toUpperCase() === 'SSD';
      const typeClass = isSSD ? 'pill-ssd' : 'pill-hd';
      const typeLabel = isSSD ? 'SSD' : 'HD';

      const fsSlug = (drive.fileSystem || '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const fsClass = `pill-fs-${fsSlug}`;
      const fsLabel = drive.fileSystem;

      const barClass = usage.isCritical ? 'critical' : usage.isWarning ? 'warning' : '';

      return `
        <div class="drive-list-card" data-drive-id="${drive.id}" style="--drive-color: ${drive.color || '#ffbb00'};">
          <!-- Master Drive Header (Draggable for Reordering) -->
          <div class="drive-list-card-header draggable-drive-header" draggable="true" data-drive-id="${drive.id}" title="Arraste para reordenar este drive">
            <div class="drive-list-info-block">
              <span class="drive-drag-handle" title="Arraste para reordenar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="8" cy="6" r="2"></circle>
                  <circle cx="16" cy="6" r="2"></circle>
                  <circle cx="8" cy="12" r="2"></circle>
                  <circle cx="16" cy="12" r="2"></circle>
                  <circle cx="8" cy="18" r="2"></circle>
                  <circle cx="16" cy="18" r="2"></circle>
                </svg>
              </span>
              <span class="drive-list-color-dot" style="background: ${drive.color || '#ffbb00'};"></span>
              <div class="drive-list-title-group">
                <div class="drive-list-title-row">
                  <span class="drive-list-name" title="${drive.name}">${drive.name}</span>
                  <span class="pill ${typeClass}">${typeLabel}</span>
                  <span class="pill ${fsClass}">${fsLabel}</span>
                </div>
                ${drive.notes ? `<span class="drive-list-notes" title="${drive.notes}">${drive.notes}</span>` : ''}
              </div>
            </div>

            <!-- Usage Meter Bar & Stats -->
            <div class="drive-list-meter-block">
              <div class="drive-list-meter-header">
                <span><strong>${state.constructor.formatGB(usage.usedGB)}</strong> usados de <strong>${state.constructor.formatGB(usage.totalGB)}</strong></span>
                <span><strong>${usage.pct}%</strong> (${state.constructor.formatGB(usage.freeGB)} livres)</span>
              </div>
              <div class="drive-list-meter-track">
                <div class="drive-list-meter-fill ${barClass}" style="width: ${usage.pct}%;"></div>
              </div>
            </div>

            <!-- Actions & Count -->
            <div class="drive-list-actions-block">
              <span class="drive-list-badge-count">
                ${matchingProjects.length} ${matchingProjects.length === 1 ? 'PROJETO' : 'PROJETOS'}
              </span>
              <button class="btn btn-secondary btn-sm btn-add-project-to-drive" data-drive-id="${drive.id}" title="Adicionar Projeto Neste Drive">
                + PROJETO
              </button>
              <button class="btn btn-secondary btn-sm btn-drive-edit" data-drive-id="${drive.id}" title="Editar Drive">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                <span>Editar</span>
              </button>
            </div>
          </div>

          <!-- Subprojects Embedded Table -->
          <div class="drive-subprojects-container" data-drive-id="${drive.id}">
            ${matchingProjects.length > 0 ? `
              <table class="drive-subprojects-table">
                <thead>
                  <tr>
                    <th style="width: 32%;">PROJETO</th>
                    <th style="width: 18%;">CLIENTE</th>
                    <th style="width: 12%;">TAMANHO</th>
                    <th style="width: 14%;">SEGURANÇA</th>
                    <th style="width: 24%; text-align: right;">AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  ${matchingProjects.map(project => {
                    const copies = (project.drives || []).length;
                    let backupPill = '';
                    if (copies === 0) {
                      backupPill = `<span class="pill pill-unassigned">Sem Drive</span>`;
                    } else if (copies >= 2) {
                      backupPill = `<span class="pill pill-backup-safe">${copies} Cópias</span>`;
                    } else {
                      backupPill = `<span class="pill pill-backup-danger">Cópia Única</span>`;
                    }

                    return `
                      <tr class="subproject-table-row" draggable="true" data-project-id="${project.id}" data-drive-id="${drive.id}">
                        <td>
                          <div class="subproject-name-cell">
                            <span class="subproject-name" title="${project.name}">${project.name}</span>
                            <div class="subproject-tags" style="display:flex; gap:4px; margin-top:2px; flex-wrap:wrap;">
                              ${project.tags.map(t => {
                                const tc = state.getTagColor(t);
                                return `<span class="project-tag" style="background:${tc}18; color:${tc}; border-color:${tc}44;">${t}</span>`;
                              }).join('')}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span class="subproject-client">${project.client}</span>
                        </td>
                        <td>
                          <span class="subproject-size-badge">${state.constructor.formatGB(project.sizeGB)}</span>
                        </td>
                        <td>
                          ${backupPill}
                        </td>
                        <td>
                          <div class="subproject-actions-cell">
                            <button class="btn btn-remove-from-drive" data-project-id="${project.id}" data-drive-id="${drive.id}" title="Desvincular este projeto deste drive">
                              Remover do Drive
                            </button>
                            <button class="btn btn-secondary btn-sm btn-project-move" data-project-id="${project.id}" data-drive-id="${drive.id}" title="Copiar ou mover para outro drive">
                              Copiar / Mover
                            </button>
                            <button class="btn btn-secondary btn-sm btn-project-edit" data-project-id="${project.id}" title="Editar Projeto">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            ` : `
              <div class="drive-list-empty-state">
                Nenhum projeto alocado neste drive. Arraste um projeto aqui para vincular ou clique em "+ PROJETO".
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');
  } else {
    // Default Grid view
    container.className = 'drives-grid';
    container.innerHTML = visibleDrives.map(drive => {
      const usage = state.calculateDriveUsage(drive.id);
      const driveProjects = state.projects.filter(p => (p.drives || []).includes(drive.id));
      const matchingProjects = driveProjects.filter(p => filteredProjectIds.has(p.id));
      matchingProjects.sort((a, b) => {
        const clientA = (a.client || '').trim().toLowerCase();
        const clientB = (b.client || '').trim().toLowerCase();
        const comp = clientA.localeCompare(clientB, 'pt-BR', { sensitivity: 'base' });
        if (comp !== 0) return comp;
        const nameA = (a.name || '').trim().toLowerCase();
        const nameB = (b.name || '').trim().toLowerCase();
        return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
      });

      const isSSD = String(drive.type).toUpperCase() === 'SSD';
      const typeClass = isSSD ? 'pill-ssd' : 'pill-hd';
      const typeLabel = isSSD ? 'SSD' : 'HD';

      const fsSlug = (drive.fileSystem || '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const fsClass = `pill-fs-${fsSlug}`;
      const fsLabel = drive.fileSystem;

      const barClass = usage.isCritical ? 'critical' : usage.isWarning ? 'warning' : '';

      return `
        <div class="drive-card" data-drive-id="${drive.id}" style="--drive-color: ${drive.color || '#ffbb00'};">
          <div class="drive-card-header draggable-drive-header" draggable="true" data-drive-id="${drive.id}" title="Arraste para reordenar este drive">
            <div class="drive-title-area">
              <div class="drive-title-row">
                <span class="drive-drag-handle" title="Arraste para reordenar">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="8" cy="6" r="2"></circle>
                    <circle cx="16" cy="6" r="2"></circle>
                    <circle cx="8" cy="12" r="2"></circle>
                    <circle cx="16" cy="12" r="2"></circle>
                    <circle cx="8" cy="18" r="2"></circle>
                    <circle cx="16" cy="18" r="2"></circle>
                  </svg>
                </span>
                <span class="drive-name" title="${drive.name}">${drive.name}</span>
              </div>
              <div class="drive-meta-pills">
                <span class="pill ${typeClass}">${typeLabel}</span>
                <span class="pill ${fsClass}">${fsLabel}</span>
              </div>
            </div>
            <div class="drive-actions">
              <button class="btn btn-icon btn-drive-edit" data-drive-id="${drive.id}" title="Editar Drive">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
              <button class="btn btn-icon btn-add-project-to-drive" data-drive-id="${drive.id}" title="Adicionar Projeto Neste Drive">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
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
                <p style="font-size: 11px; margin-top: 4px; color: var(--accent-yellow);">Arraste um projeto aqui para mover ou duplicar</p>
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

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

  // Attach Project Card Actions inside container
  attachProjectCardListeners(container);
}

// Render Individual Project Card (Grid View)
function renderProjectCard(project, currentDriveId) {
  const copies = (project.drives || []).length;
  let backupPill = '';
  if (copies === 0) {
    backupPill = `<span class="pill pill-unassigned" title="Projeto não está em nenhum drive!">Sem Drive</span>`;
  } else if (copies >= 2) {
    backupPill = `<span class="pill pill-backup-safe" title="Salvo em ${copies} drives: backup seguro!">${copies} Cópias</span>`;
  } else {
    backupPill = `<span class="pill pill-backup-danger" title="Apenas 1 cópia! Risco se o drive falhar.">Cópia Única</span>`;
  }

  return `
    <div class="project-card ${copies === 0 ? 'is-unassigned' : ''}" draggable="true" data-project-id="${project.id}" data-drive-id="${currentDriveId}">
      <div class="project-card-header">
        <div class="project-title-box">
          <div class="project-name" title="${project.name}">${project.name}</div>
          <div class="project-client">${project.client}</div>
        </div>
        <div class="project-weight-badge">${state.constructor.formatGB(project.sizeGB)}</div>
      </div>

      <div class="project-meta-row">
        <div class="project-tags">
          ${project.tags.slice(0, 3).map(tag => {
            const tc = state.getTagColor(tag);
            return `<span class="project-tag" style="background:${tc}18; color:${tc}; border-color:${tc}44;">${tag}</span>`;
          }).join('')}
          ${project.tags.length > 3 ? `<span class="project-tag">+${project.tags.length - 3}</span>` : ''}
        </div>
        ${backupPill}
      </div>

      <div class="project-card-actions-row">
        <div class="actions-left">
          ${currentDriveId ? `
            <button class="btn btn-remove-from-drive" data-project-id="${project.id}" data-drive-id="${currentDriveId}" title="Desvincular este projeto deste drive">
              Remover do Drive
            </button>
          ` : ''}
        </div>
        <div class="actions-right">
          <button class="btn btn-secondary btn-sm btn-project-move" data-project-id="${project.id}" data-drive-id="${currentDriveId}">
            ${currentDriveId ? 'Copiar / Mover' : 'Vincular a Drive'}
          </button>
          <button class="btn btn-secondary btn-sm btn-project-edit" data-project-id="${project.id}" title="Editar Projeto">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Render Project Row for List View (Fallback helper)
function renderProjectListRow(project, currentDriveId) {
  const copies = (project.drives || []).length;
  let backupPill = '';
  if (copies === 0) {
    backupPill = `<span class="pill pill-unassigned">Sem Drive</span>`;
  } else if (copies >= 2) {
    backupPill = `<span class="pill pill-backup-safe">${copies} Cópias</span>`;
  } else {
    backupPill = `<span class="pill pill-backup-danger">Cópia Única</span>`;
  }

  return `
    <div class="project-list-row ${copies === 0 ? 'is-unassigned' : ''}" draggable="true" data-project-id="${project.id}" data-drive-id="${currentDriveId}">
      <div class="project-list-left-info">
        <div style="min-width: 0; flex: 1;">
          <div class="project-list-name" title="${project.name}">${project.name}</div>
          <div class="project-list-client">${project.client}</div>
        </div>
        <div class="project-tags" style="display:flex; gap:4px; flex-wrap:wrap;">
          ${project.tags.slice(0, 2).map(tag => {
            const tc = state.getTagColor(tag);
            return `<span class="project-tag" style="background:${tc}18; color:${tc}; border-color:${tc}44;">${tag}</span>`;
          }).join('')}
        </div>
        <div class="project-list-size">${state.constructor.formatGB(project.sizeGB)}</div>
        ${backupPill}
      </div>

      <div class="project-list-actions">
        ${currentDriveId ? `
          <button class="btn btn-remove-from-drive" data-project-id="${project.id}" data-drive-id="${currentDriveId}" title="Remover este projeto deste drive">
            Remover do Drive
          </button>
        ` : ''}
        <button class="btn btn-secondary btn-sm btn-project-move" data-project-id="${project.id}" data-drive-id="${currentDriveId}" title="Copiar ou mover para outro drive">
          ${currentDriveId ? 'Copiar / Mover' : 'Vincular a Drive'}
        </button>
        <button class="btn btn-secondary btn-sm btn-project-edit" data-project-id="${project.id}" title="Editar Projeto">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
}

// Project card action buttons
function attachProjectCardListeners(container) {
  // Edit project
  container.querySelectorAll('.btn-project-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const project = state.projects.find(p => p.id === btn.dataset.projectId);
      if (project) openProjectModal(project);
    });
  });

  // Move or duplicate project
  container.querySelectorAll('.btn-project-move').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const project = state.projects.find(p => p.id === btn.dataset.projectId);
      const currentDrive = state.drives.find(d => d.id === btn.dataset.driveId);
      if (project) openMoveProjectModal(project, currentDrive || null);
    });
  });

  // Remove project from specific drive (WITHOUT deleting the project from catalog)
  container.querySelectorAll('.btn-remove-from-drive').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const projectId = btn.dataset.projectId;
      const driveId = btn.dataset.driveId;
      const project = state.projects.find(p => p.id === projectId);
      const drive = state.drives.find(d => d.id === driveId);
      if (project && drive) {
        if (confirm(`Deseja desvincular o projeto "${project.name}" do drive "${drive.name}"?\n\nO projeto continuará existindo normalmente no catálogo.`)) {
          state.removeProjectFromDrive(projectId, driveId);
          showToast(`Projeto removido do drive "${drive.name}".`);
        }
      }
    });
  });
}

// 5. Projects Table View (Spreadsheet Style)
function renderProjectsTable() {
  const tableBody = document.getElementById('projects-table-body');
  if (!tableBody) return;

  const projects = state.getFilteredProjects();

  // If no projects exist at all in the system, show clean onboarding empty state
  if (state.projects.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <div class="empty-state-card" style="max-width: 440px; margin: 0 auto; background: transparent; border: none; padding: 0;">
            <div class="empty-state-icon" style="width: 50px; height: 50px; margin: 0 auto 14px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
            <h3 class="empty-state-title" style="font-size: 15px;">Nenhum projeto cadastrado ainda</h3>
            <p class="empty-state-desc" style="font-size: 12px; margin-bottom: 18px;">
              Cadastre suas produções, comerciais ou diárias para controlar em quais drives estão salvos e garantir a segurança de backup.
            </p>
            <button type="button" class="btn btn-primary btn-sm" id="btn-empty-add-project" style="margin: 0 auto;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Cadastrar Primeiro Projeto</span>
            </button>
          </div>
        </td>
      </tr>
    `;
    const addProjBtn = document.getElementById('btn-empty-add-project');
    if (addProjBtn) {
      addProjBtn.addEventListener('click', () => openProjectModal());
    }
    return;
  }

  // If projects exist but none match active filters
  if (projects.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
          <p style="font-size: 14px; margin-bottom: 12px; color: var(--text-secondary);">Nenhum projeto encontrado com os filtros selecionados.</p>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-table-reset-filters">Limpar Filtros</button>
        </td>
      </tr>
    `;
    const resetBtn = document.getElementById('btn-table-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.resetFilters();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.value = '';
      });
    }
    return;
  }

  tableBody.innerHTML = projects.map(proj => {
    const copies = (proj.drives || []).length;
    let backupBadge = '';
    if (copies === 0) {
      backupBadge = `<span class="pill pill-unassigned">Sem Drive</span>`;
    } else if (copies >= 2) {
      backupBadge = `<span class="pill pill-backup-safe">Backup Seguro (${copies} drives)</span>`;
    } else {
      backupBadge = `<span class="pill pill-backup-danger">Cópia Única</span>`;
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
            ${drivesList || '<span class="pill pill-unassigned" style="font-size:11px;">Nenhum drive vinculado</span>'}
          </div>
        </td>
        <td>${backupBadge}</td>
        <td>
          <div style="display:flex; flex-wrap:wrap; gap:3px;">
            ${proj.tags.map(t => {
              const tc = state.getTagColor(t);
              return `<span class="project-tag" style="background:${tc}18; color:${tc}; border-color:${tc}44;">${t}</span>`;
            }).join('')}
          </div>
        </td>
        <td>
          <div style="display:flex; gap:6px; align-items:center;">
            <button class="btn btn-secondary btn-sm btn-table-edit" data-project-id="${proj.id}" title="Editar Projeto">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              <span>Editar</span>
            </button>
            <button class="btn btn-secondary btn-sm btn-table-move" data-project-id="${proj.id}" title="Mover ou Duplicar Projeto">Mover / Duplicar</button>
            <button class="btn btn-danger btn-sm btn-table-delete" data-project-id="${proj.id}" title="Excluir Permanentemente do Catálogo" style="padding: 4px 8px;">✕ Excluir</button>
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

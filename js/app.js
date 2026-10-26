/* ==========================================================================
   DMS DRIVE MANAGER - MAIN APPLICATION ENTRY POINT
   Bootstrap, event bus, global keyboard shortcuts, and view coordination
   ========================================================================== */

import { state } from './state.js';
import { firebaseService } from './firebase-service.js';
import { initDragAndDrop } from './drag-drop.js';
import { renderApp } from './ui-render.js';
import { 
  openDriveModal, 
  handleDriveFormSubmit,
  openProjectModal, 
  handleProjectFormSubmit,
  openFirebaseModal,
  handleFirebaseSave,
  openImportExportModal,
  handleExportJSON,
  handleImportJSON,
  handleMoveActionSubmit,
  closeDialog,
  showToast
} from './modals.js';

// DOM Content Loaded Bootstrapper
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎬 DMS Drive Manager inicializando...');

  // 1. Subscribe UI renderer to reactive state
  state.subscribe(() => {
    renderApp();
  });

  // 2. Initialize native Drag and Drop
  initDragAndDrop();

  // 3. Setup Navigation & View Switching
  setupNavigation();

  // 4. Setup Search & Header Actions
  setupSearchAndActions();

  // 5. Setup Modal Forms & Handlers
  setupModalsAndForms();

  // 6. Setup Workbench Filters Dropdown Popover
  setupFiltersDropdown();

  // 7. Setup Workbench View Mode Toggle (Grid / List)
  setupWorkbenchViewToggle();

  // 8. Setup Keyboard Shortcuts
  setupKeyboardShortcuts();

  // 9. Initialize Cloud Service (or fallback to local offline mode)
  await firebaseService.init();

  // 10. Initial Render
  renderApp();
});

// Setup Navigation & View Switching
function setupNavigation() {
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('.nav-tab-btn');
    if (!tab) return;
    const targetView = tab.dataset.view;
    if (!targetView) return;

    state.setActiveView(targetView);
  });

  // Mobile sidebar toggle button
  const toggleSidebarBtn = document.getElementById('btn-toggle-sidebar');
  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', () => {
      const sidebar = document.querySelector('.app-sidebar');
      if (sidebar) sidebar.classList.toggle('open');
    });
  }
}

// Setup Floating Filters Popover in Workbench
function setupFiltersDropdown() {
  const toggleBtn = document.getElementById('btn-toggle-filters-menu');
  const popover = document.getElementById('filters-menu-popover');
  if (!toggleBtn || !popover) return;

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = popover.style.display !== 'none';
    popover.style.display = isOpen ? 'none' : 'block';
    toggleBtn.setAttribute('aria-expanded', !isOpen);
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
      popover.style.display = 'none';
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popover.style.display !== 'none') {
      popover.style.display = 'none';
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

// Setup Grid / List View Toggle in Workbench
function setupWorkbenchViewToggle() {
  const btnGrid = document.getElementById('btn-view-grid');
  const btnList = document.getElementById('btn-view-list');

  if (btnGrid) {
    btnGrid.addEventListener('click', () => {
      state.setWorkbenchLayout('grid');
    });
  }

  if (btnList) {
    btnList.addEventListener('click', () => {
      state.setWorkbenchLayout('list');
    });
  }
}

// Setup Search & Header Buttons
function setupSearchAndActions() {
  const searchInput = document.getElementById('global-search-input');
  const clearBtn = document.getElementById('search-clear-btn');

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.setSearchQuery(e.target.value);
      }, 150);
    });
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.setSearchQuery('');
      searchInput.focus();
    });
  }

  // Quick Action Buttons
  const btnNewDrive = document.getElementById('btn-new-drive');
  if (btnNewDrive) {
    btnNewDrive.addEventListener('click', () => openDriveModal());
  }

  const btnNewProject = document.getElementById('btn-new-project');
  if (btnNewProject) {
    btnNewProject.addEventListener('click', () => openProjectModal());
  }

  const syncPill = document.getElementById('sync-status-indicator');
  if (syncPill) {
    syncPill.addEventListener('click', () => openFirebaseModal());
  }

  const btnExport = document.getElementById('btn-import-export');
  if (btnExport) {
    btnExport.addEventListener('click', () => openImportExportModal());
  }
}

// Setup Modals and Form Submissions
function setupModalsAndForms() {
  // Drive Form
  const driveForm = document.getElementById('drive-form');
  if (driveForm) {
    driveForm.addEventListener('submit', handleDriveFormSubmit);
  }

  // Drive Delete inside modal
  const driveDeleteBtn = document.getElementById('drive-delete-btn');
  if (driveDeleteBtn) {
    driveDeleteBtn.addEventListener('click', () => {
      const driveId = document.getElementById('drive-id-input').value;
      if (driveId && confirm('Tem certeza que deseja remover este drive? Os projetos continuarão salvos no catálogo, apenas sem estarem ligados a nenhum drive.')) {
        state.deleteDrive(driveId);
        firebaseService.deleteDriveFromCloud(driveId);
        showToast('Drive removido. Os projetos foram preservados no catálogo.');
        closeDialog('drive-modal');
      }
    });
  }

  // Color Swatch buttons in Drive Modal
  document.querySelectorAll('#drive-modal .color-swatch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#drive-modal .color-swatch-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('drive-color-input').value = btn.dataset.color;
    });
  });

  // Project Form
  const projectForm = document.getElementById('project-form');
  if (projectForm) {
    projectForm.addEventListener('submit', handleProjectFormSubmit);
  }

  // Project Delete inside modal
  const projectDeleteBtn = document.getElementById('project-delete-btn');
  if (projectDeleteBtn) {
    projectDeleteBtn.addEventListener('click', () => {
      const projId = document.getElementById('project-id-input').value;
      if (projId && confirm('Tem certeza que deseja excluir permanentemente este projeto do catálogo?')) {
        state.deleteProject(projId);
        firebaseService.deleteProjectFromCloud(projId);
        showToast('Projeto excluído com sucesso.');
        closeDialog('project-modal');
      }
    });
  }

  // Move Project Actions
  const btnConfirmMove = document.getElementById('btn-confirm-move');
  if (btnConfirmMove) {
    btnConfirmMove.addEventListener('click', () => handleMoveActionSubmit('move'));
  }

  const btnConfirmDuplicate = document.getElementById('btn-confirm-duplicate');
  if (btnConfirmDuplicate) {
    btnConfirmDuplicate.addEventListener('click', () => handleMoveActionSubmit('duplicate'));
  }

  // Firebase Form
  const fbForm = document.getElementById('firebase-form');
  if (fbForm) {
    fbForm.addEventListener('submit', handleFirebaseSave);
  }

  const fbDisconnectBtn = document.getElementById('fb-disconnect-btn');
  if (fbDisconnectBtn) {
    fbDisconnectBtn.addEventListener('click', () => {
      if (confirm('Deseja desconectar da nuvem e voltar ao modo local?')) {
        firebaseService.clearConfig();
        showToast('Desconectado da nuvem. Operando em Modo Local.');
        closeDialog('firebase-modal');
      }
    });
  }

  // Import / Export
  const btnExportJson = document.getElementById('btn-export-json');
  if (btnExportJson) {
    btnExportJson.addEventListener('click', handleExportJSON);
  }

  const fileInput = document.getElementById('import-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleImportJSON(e.target.files[0]);
      }
    });
  }

  // Close buttons on all dialogs
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const dialog = btn.closest('dialog');
      if (dialog) closeDialog(dialog.id);
    });
  });

  // Close dialog on backdrop click
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        closeDialog(dialog.id);
      }
    });
  });
}

// Global Keyboard Shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Press '/' to focus search input
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const search = document.getElementById('global-search-input');
      if (search) search.focus();
    }
  });
}

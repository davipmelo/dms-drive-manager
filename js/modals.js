/* ==========================================================================
   DMS DRIVE MANAGER - MODALS & DIALOG HANDLERS
   Interactive modals for drives, projects, custody, cloud settings and toasts
   ========================================================================== */

import { state } from './state.js';
import { firebaseService } from './firebase-service.js';

// Toast Notification Manager
export function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Helper to open native <dialog>
function openDialog(dialogId) {
  const dialog = document.getElementById(dialogId);
  if (dialog) {
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }
}

export function closeDialog(dialogId) {
  const dialog = document.getElementById(dialogId);
  if (dialog) {
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  }
}

// ==========================================================================
// 1. DRIVE MODAL (Criar / Editar Drive)
// ==========================================================================
export function openDriveModal(driveToEdit = null) {
  const modal = document.getElementById('drive-modal');
  if (!modal) return;

  const isEdit = !!driveToEdit;
  document.getElementById('drive-modal-title').textContent = isEdit ? 'Editar Drive' : 'Cadastrar Novo Drive';
  document.getElementById('drive-id-input').value = isEdit ? driveToEdit.id : '';
  document.getElementById('drive-name-input').value = isEdit ? driveToEdit.name : '';
  document.getElementById('drive-type-select').value = isEdit ? (String(driveToEdit.type).toUpperCase() === 'SSD' ? 'SSD' : 'HD') : 'HD';
  document.getElementById('drive-fs-select').value = isEdit ? driveToEdit.fileSystem : 'exFAT';
  
  // Capacity: support GB/TB conversion
  const capGB = isEdit ? driveToEdit.totalCapacityGB : 2000;
  if (capGB >= 1000 && capGB % 1000 === 0) {
    document.getElementById('drive-capacity-val').value = capGB / 1000;
    document.getElementById('drive-capacity-unit').value = 'TB';
  } else {
    document.getElementById('drive-capacity-val').value = capGB;
    document.getElementById('drive-capacity-unit').value = 'GB';
  }

  const driveColor = isEdit ? driveToEdit.color : '#ffbb00';
  document.getElementById('drive-color-input').value = driveColor;
  document.getElementById('drive-notes-input').value = isEdit ? (driveToEdit.notes || '') : '';

  // Setup color swatch active states
  const swatches = document.querySelectorAll('#drive-modal .color-swatch-btn');
  swatches.forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.color.toLowerCase() === driveColor.toLowerCase());
  });

  // Delete button only on edit
  const deleteBtn = document.getElementById('drive-delete-btn');
  if (deleteBtn) {
    deleteBtn.style.display = isEdit ? 'inline-flex' : 'none';
  }

  openDialog('drive-modal');
}

export function handleDriveFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('drive-id-input').value;
  const name = document.getElementById('drive-name-input').value.trim();
  const type = document.getElementById('drive-type-select').value === 'SSD' ? 'SSD' : 'HD';
  const fileSystem = document.getElementById('drive-fs-select').value;
  
  const capVal = parseFloat(document.getElementById('drive-capacity-val').value) || 2;
  const capUnit = document.getElementById('drive-capacity-unit').value;
  const totalCapacityGB = capUnit === 'TB' ? capVal * 1000 : capVal;

  const color = document.getElementById('drive-color-input').value || '#ffbb00';
  const notes = document.getElementById('drive-notes-input').value.trim();

  if (!name) {
    showToast('Informe o nome do drive.', 'warning');
    return;
  }

  if (id) {
    // Update existing
    const updated = state.updateDrive(id, { name, type, fileSystem, totalCapacityGB, color, notes });
    if (updated) {
      firebaseService.saveDriveToCloud(updated);
      showToast(`Drive "${name}" atualizado com sucesso!`);
    }
  } else {
    // Create new
    const created = state.addDrive({ name, type, fileSystem, totalCapacityGB, color, notes });
    firebaseService.saveDriveToCloud(created);
    showToast(`Drive "${name}" cadastrado com sucesso!`);
  }

  closeDialog('drive-modal');
}

// ==========================================================================
// 2. PROJECT MODAL (Criar / Editar Projeto)
// ==========================================================================

// Tag management state for project modal
let currentModalProjectTags = [];
let isTagEventsInitialized = false;

function renderModalSelectedTags() {
  const container = document.getElementById('project-selected-tags-box');
  const hiddenInput = document.getElementById('project-tags-input');
  if (!container) return;

  if (hiddenInput) {
    hiddenInput.value = currentModalProjectTags.join(', ');
  }

  if (currentModalProjectTags.length === 0) {
    container.innerHTML = `
      <div style="font-size:11px; color:var(--text-muted); font-style:italic; padding:4px 0;">
        Nenhuma tag selecionada para este projeto.
      </div>
    `;
    return;
  }

  container.innerHTML = currentModalProjectTags.map(tag => {
    const color = state.getTagColor(tag);
    return `
      <span class="selected-tag-pill" style="background:${color}22; color:${color}; border:1px solid ${color}55;">
        <span>${tag}</span>
        <button type="button" class="btn-remove-selected-tag" data-tag="${tag}" title="Remover tag">✕</button>
      </span>
    `;
  }).join('');

  container.querySelectorAll('.btn-remove-selected-tag').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tagToRemove = btn.dataset.tag;
      currentModalProjectTags = currentModalProjectTags.filter(t => t !== tagToRemove);
      renderModalSelectedTags();
    });
  });
}

function populateExistingTagsDropdown() {
  const select = document.getElementById('project-existing-tags-select');
  if (!select) return;

  const allTags = state.getAllTags();
  select.innerHTML = `
    <option value="">-- Selecione uma tag existente (${allTags.length}) --</option>
    ${allTags.map(t => `<option value="${t.name}">${t.name}</option>`).join('')}
  `;
}

function setupProjectModalTagEvents() {
  if (isTagEventsInitialized) return;
  isTagEventsInitialized = true;

  // Existing tags select
  const select = document.getElementById('project-existing-tags-select');
  if (select) {
    select.addEventListener('change', () => {
      const val = select.value.trim();
      if (val && !currentModalProjectTags.includes(val)) {
        currentModalProjectTags.push(val);
        renderModalSelectedTags();
      }
      select.value = '';
    });
  }

  // Tag color swatches inline
  document.querySelectorAll('#new-tag-color-swatches .color-swatch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#new-tag-color-swatches .color-swatch-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const colorInput = document.getElementById('new-tag-color-input');
      if (colorInput) colorInput.value = btn.dataset.color;
    });
  });

  // Add new tag button
  const addBtn = document.getElementById('btn-add-new-tag');
  const nameInput = document.getElementById('new-tag-name-input');
  const handleAddNewTag = () => {
    if (!nameInput) return;
    const name = nameInput.value.trim();
    const colorInput = document.getElementById('new-tag-color-input');
    const color = colorInput ? colorInput.value : '#ffbb00';

    if (!name) {
      showToast('Digite o nome da nova tag.', 'warning');
      nameInput.focus();
      return;
    }

    state.setTag(name, color);
    if (!currentModalProjectTags.includes(name)) {
      currentModalProjectTags.push(name);
    }
    renderModalSelectedTags();
    populateExistingTagsDropdown();
    nameInput.value = '';
    showToast(`Tag "${name}" criada e adicionada!`);
  };

  if (addBtn) {
    addBtn.addEventListener('click', handleAddNewTag);
  }

  if (nameInput) {
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddNewTag();
      }
    });
  }
}

export function openProjectModal(projectToEdit = null, preselectedDriveId = null) {
  const modal = document.getElementById('project-modal');
  if (!modal) return;

  const isEdit = !!projectToEdit;
  document.getElementById('project-modal-title').textContent = isEdit ? 'Editar Projeto' : 'Cadastrar Novo Projeto';
  document.getElementById('project-id-input').value = isEdit ? projectToEdit.id : '';
  document.getElementById('project-name-input').value = isEdit ? projectToEdit.name : '';
  document.getElementById('project-client-input').value = isEdit ? projectToEdit.client : '';
  
  // Size conversion
  const sizeGB = isEdit ? projectToEdit.sizeGB : 250;
  if (sizeGB >= 1000 && sizeGB % 100 === 0) {
    document.getElementById('project-size-val').value = sizeGB / 1000;
    document.getElementById('project-size-unit').value = 'TB';
  } else {
    document.getElementById('project-size-val').value = sizeGB;
    document.getElementById('project-size-unit').value = 'GB';
  }

  // Tags Setup
  setupProjectModalTagEvents();
  currentModalProjectTags = isEdit ? [...(projectToEdit.tags || [])] : [];
  renderModalSelectedTags();
  populateExistingTagsDropdown();
  const newTagNameInput = document.getElementById('new-tag-name-input');
  if (newTagNameInput) newTagNameInput.value = '';

  document.getElementById('project-notes-input').value = isEdit ? (projectToEdit.notes || '') : '';

  // Render Drive Assignment Checkboxes
  const driveCheckboxesContainer = document.getElementById('project-drives-checkboxes');
  driveCheckboxesContainer.innerHTML = '';

  if (state.drives.length === 0) {
    driveCheckboxesContainer.innerHTML = `
      <div style="font-size: 12px; color: var(--text-muted); padding: 8px;">
        Nenhum drive cadastrado no momento. O projeto será salvo desvinculado.
      </div>
    `;
  } else {
    state.drives.forEach(drive => {
      const isChecked = isEdit 
        ? (projectToEdit.drives || []).includes(drive.id)
        : (preselectedDriveId ? drive.id === preselectedDriveId : false);

      const label = document.createElement('label');
      label.className = 'drive-checkbox-item';
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.gap = '8px';
      label.style.padding = '8px 12px';
      label.style.background = 'var(--bg-surface-elevated)';
      label.style.borderRadius = 'var(--radius-sm)';
      label.style.cursor = 'pointer';
      label.style.border = '1px solid var(--border-subtle)';
      label.style.color = '#ffffff';

      label.innerHTML = `
        <input type="checkbox" name="project-drive" value="${drive.id}" ${isChecked ? 'checked' : ''} />
        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${drive.color}; flex-shrink: 0;"></span>
        <span style="font-weight: 500; font-size: 13px; color: #ffffff;">${drive.name}</span>
        <span style="color: #c0c0cb; font-size: 11px; margin-left: auto;">${String(drive.type).toUpperCase()} • ${state.constructor.formatGB(drive.totalCapacityGB)}</span>
      `;

      driveCheckboxesContainer.appendChild(label);
    });
  }

  // Delete button: only allowed when editing on the "Lista de Projetos" table view!
  const deleteBtn = document.getElementById('project-delete-btn');
  if (deleteBtn) {
    const canPermanentlyDelete = isEdit && state.activeView === 'table';
    deleteBtn.style.display = canPermanentlyDelete ? 'inline-flex' : 'none';
  }

  openDialog('project-modal');
}

export function handleProjectFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('project-id-input').value;
  const name = document.getElementById('project-name-input').value.trim();
  const client = document.getElementById('project-client-input').value.trim() || 'Geral';
  
  const sizeVal = parseFloat(document.getElementById('project-size-val').value) || 50;
  const sizeUnit = document.getElementById('project-size-unit').value;
  const sizeGB = sizeUnit === 'TB' ? sizeVal * 1000 : sizeVal;

  const tags = currentModalProjectTags.length > 0 
    ? [...currentModalProjectTags] 
    : document.getElementById('project-tags-input').value.split(',').map(t => t.trim()).filter(Boolean);
  const notes = document.getElementById('project-notes-input').value.trim();

  // Selected drives
  const checkedDrives = Array.from(document.querySelectorAll('input[name="project-drive"]:checked'))
    .map(cb => cb.value);

  if (!name) {
    showToast('Informe o nome do projeto.', 'warning');
    return;
  }

  if (id) {
    const updated = state.updateProject(id, { name, client, sizeGB, drives: checkedDrives, tags, notes });
    if (updated) {
      firebaseService.saveProjectToCloud(updated);
      showToast(checkedDrives.length > 0 ? `Projeto "${name}" atualizado!` : `Projeto "${name}" atualizado (sem drive vinculado).`);
    }
  } else {
    const created = state.addProject({ name, client, sizeGB, drives: checkedDrives, tags, notes });
    firebaseService.saveProjectToCloud(created);
    showToast(checkedDrives.length > 0 ? `Projeto "${name}" registrado com sucesso!` : `Projeto "${name}" registrado (sem drive vinculado).`);
  }

  closeDialog('project-modal');
}

// ==========================================================================
// 3. MOVE OR DUPLICATE PROJECT MODAL
// ==========================================================================
export function openMoveProjectModal(project, sourceDrive = null, targetDrive = null) {
  const modal = document.getElementById('move-project-modal');
  if (!modal) return;

  document.getElementById('move-modal-project-name').textContent = project.name;
  document.getElementById('move-modal-source-name').textContent = sourceDrive ? sourceDrive.name : 'Nenhum (Desvinculado)';

  // Populate target drive select
  const targetSelect = document.getElementById('move-modal-target-select');
  targetSelect.innerHTML = '';

  state.drives.forEach(drive => {
    // Only drives that do not already have this project
    if (drive.id !== (sourceDrive ? sourceDrive.id : null)) {
      const option = document.createElement('option');
      option.value = drive.id;
      option.textContent = `${drive.name} • ${String(drive.type).toUpperCase()} • ${state.calculateDriveUsage(drive.id).freeGB} GB livres`;
      if (targetDrive && drive.id === targetDrive.id) {
        option.selected = true;
      }
      targetSelect.appendChild(option);
    }
  });

  // Store context on modal
  modal.dataset.projectId = project.id;
  modal.dataset.sourceDriveId = sourceDrive ? sourceDrive.id : '';

  openDialog('move-project-modal');
}

export function handleMoveActionSubmit(actionType) {
  const modal = document.getElementById('move-project-modal');
  const projectId = modal.dataset.projectId;
  const sourceDriveId = modal.dataset.sourceDriveId;
  const targetDriveId = document.getElementById('move-modal-target-select').value;

  if (!projectId || !targetDriveId) {
    closeDialog('move-project-modal');
    return;
  }

  const project = state.projects.find(p => p.id === projectId);
  const targetDrive = state.drives.find(d => d.id === targetDriveId);

  if (actionType === 'move') {
    state.moveProject(projectId, sourceDriveId, targetDriveId);
    if (project) firebaseService.saveProjectToCloud(project);
    showToast(`Projeto transferido para "${targetDrive?.name}".`);
  } else if (actionType === 'duplicate') {
    state.duplicateProject(projectId, targetDriveId);
    if (project) firebaseService.saveProjectToCloud(project);
    showToast(`Cópia de segurança criada em "${targetDrive?.name}"! 🛡️`, 'success');
  }

  closeDialog('move-project-modal');
}

// ==========================================================================
// 5. FIREBASE SETTINGS MODAL
// ==========================================================================
export function openFirebaseModal() {
  const modal = document.getElementById('firebase-modal');
  if (!modal) return;

  const currentCfg = firebaseService.getConfig();
  if (currentCfg) {
    document.getElementById('fb-api-key').value = currentCfg.apiKey || '';
    document.getElementById('fb-auth-domain').value = currentCfg.authDomain || '';
    document.getElementById('fb-project-id').value = currentCfg.projectId || '';
    document.getElementById('fb-storage-bucket').value = currentCfg.storageBucket || '';
    document.getElementById('fb-sender-id').value = currentCfg.messagingSenderId || '';
    document.getElementById('fb-app-id').value = currentCfg.appId || '';
  }

  openDialog('firebase-modal');
}

export async function handleFirebaseSave(e) {
  e.preventDefault();
  const config = {
    apiKey: document.getElementById('fb-api-key').value.trim(),
    authDomain: document.getElementById('fb-auth-domain').value.trim(),
    projectId: document.getElementById('fb-project-id').value.trim(),
    storageBucket: document.getElementById('fb-storage-bucket').value.trim(),
    messagingSenderId: document.getElementById('fb-sender-id').value.trim(),
    appId: document.getElementById('fb-app-id').value.trim()
  };

  if (!config.apiKey || !config.projectId) {
    showToast('Preencha pelo menos o API Key e o Project ID do Firebase.', 'warning');
    return;
  }

  firebaseService.saveConfig(config);
  showToast('Configurações salvas. Conectando ao Firebase...', 'success');
  
  const connected = await firebaseService.init();
  if (connected) {
    showToast('Conectado com sucesso ao Firebase Cloud!', 'success');
  } else {
    showToast('Falha na conexão. Verifique as credenciais.', 'error');
  }

  closeDialog('firebase-modal');
}

// ==========================================================================
// 6. IMPORT / EXPORT MODAL
// ==========================================================================
export function openImportExportModal() {
  openDialog('import-export-modal');
}

export function handleExportJSON() {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    drives: state.drives,
    projects: state.projects
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `dms-drives-backup-${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  showToast('Catálogo de drives exportado com sucesso!');
}

export function handleImportJSON(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data.drives) && Array.isArray(data.projects)) {
        state.drives = data.drives;
        state.projects = data.projects;
        state.notify();
        showToast(`Importação concluída: ${data.drives.length} drives e ${data.projects.length} projetos!`);
        closeDialog('import-export-modal');
      } else {
        showToast('Formato de arquivo JSON inválido.', 'error');
      }
    } catch (err) {
      showToast('Erro ao ler arquivo JSON.', 'error');
    }
  };
  reader.readAsText(file);
}

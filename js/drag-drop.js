/* ==========================================================================
   DMS DRIVE MANAGER - DRAG & DROP AND PROJECT MOVER LOGIC
   Native drag-and-drop between drive cards (projects) + drive reordering
   ========================================================================== */

import { state } from './state.js';
import { openMoveProjectModal, showToast } from './modals.js';

let dragType = null; // 'project' | 'drive'
let draggedProjectId = null;
let draggedSourceDriveId = null;
let draggedDriveId = null;

export function initDragAndDrop() {
  document.addEventListener('dragstart', handleDragStart);
  document.addEventListener('dragend', handleDragEnd);
  document.addEventListener('dragover', handleDragOver);
  document.addEventListener('dragleave', handleDragLeave);
  document.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
  // Ignore clicks on buttons/inputs
  if (e.target.closest('button, input, select, textarea, a')) {
    return;
  }

  // 1. Check if dragging a Project Card or Project Row
  const projectCard = e.target.closest('.project-card, .project-list-row, .subproject-table-row');
  if (projectCard) {
    dragType = 'project';
    draggedProjectId = projectCard.dataset.projectId;
    draggedSourceDriveId = projectCard.dataset.driveId;

    projectCard.classList.add('is-dragging');

    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'project',
      projectId: draggedProjectId,
      sourceDriveId: draggedSourceDriveId
    }));
    e.dataTransfer.effectAllowed = 'copyMove';
    return;
  }

  // 2. Check if dragging a Drive (header or handle)
  const driveCard = e.target.closest('.drive-card, .drive-list-card');
  const driveHeader = e.target.closest('.draggable-drive-header, .drive-card-header, .drive-list-card-header, .drive-drag-handle');
  if (driveCard && driveHeader) {
    dragType = 'drive';
    draggedDriveId = driveCard.dataset.driveId;

    driveCard.classList.add('is-drive-dragging');

    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'drive',
      driveId: draggedDriveId
    }));
    e.dataTransfer.effectAllowed = 'move';
  }
}

function handleDragEnd(e) {
  // Clear all drag styling
  document.querySelectorAll('.is-dragging, .is-drive-dragging').forEach(el => {
    el.classList.remove('is-dragging', 'is-drive-dragging');
  });

  document.querySelectorAll('.drive-card.drag-target-over, .drive-list-card.drag-target-over, .drag-drive-reorder-over').forEach(el => {
    el.classList.remove('drag-target-over', 'drag-drive-reorder-over');
  });

  dragType = null;
  draggedProjectId = null;
  draggedSourceDriveId = null;
  draggedDriveId = null;
}

function handleDragOver(e) {
  // A. Reordering Drives
  if (dragType === 'drive') {
    const driveCard = e.target.closest('.drive-card, .drive-list-card');
    if (!driveCard || driveCard.dataset.driveId === draggedDriveId) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!driveCard.classList.contains('drag-drive-reorder-over')) {
      driveCard.classList.add('drag-drive-reorder-over');
    }
    return;
  }

  // B. Moving / Duplicating Projects onto a Drive
  const driveCard = e.target.closest('.drive-card, .drive-list-card');
  if (!driveCard) return;

  const targetDriveId = driveCard.dataset.driveId;
  if (!targetDriveId) return;

  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  if (!driveCard.classList.contains('drag-target-over')) {
    driveCard.classList.add('drag-target-over');
  }
}

function handleDragLeave(e) {
  const driveCard = e.target.closest('.drive-card, .drive-list-card');
  if (!driveCard) return;

  const rect = driveCard.getBoundingClientRect();
  if (
    e.clientX < rect.left ||
    e.clientX >= rect.right ||
    e.clientY < rect.top ||
    e.clientY >= rect.bottom
  ) {
    driveCard.classList.remove('drag-target-over');
    driveCard.classList.remove('drag-drive-reorder-over');
  }
}

function handleDrop(e) {
  // Parse data transfer if needed
  if (!dragType) {
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.type) dragType = data.type;
      if (data.driveId) draggedDriveId = data.driveId;
      if (data.projectId) draggedProjectId = data.projectId;
      if (data.sourceDriveId) draggedSourceDriveId = data.sourceDriveId;
    } catch (err) {}
  }

  // Case 1: Reordering Drives
  if (dragType === 'drive') {
    e.preventDefault();
    document.querySelectorAll('.drag-drive-reorder-over').forEach(el => el.classList.remove('drag-drive-reorder-over'));

    const targetDriveCard = e.target.closest('.drive-card, .drive-list-card');
    if (!targetDriveCard) return;

    const targetDriveId = targetDriveCard.dataset.driveId;
    if (targetDriveId && draggedDriveId && targetDriveId !== draggedDriveId) {
      state.reorderDrives(draggedDriveId, targetDriveId);
      showToast('Ordem dos drives atualizada.');
    }
    return;
  }

  // Case 2: Moving / Duplicating a Project onto a Drive
  const driveCard = e.target.closest('.drive-card, .drive-list-card');
  if (!driveCard) return;

  e.preventDefault();
  driveCard.classList.remove('drag-target-over');

  const targetDriveId = driveCard.dataset.driveId;
  if (!targetDriveId) return;

  let projectId = draggedProjectId;
  let sourceDriveId = draggedSourceDriveId;

  if (!projectId || !targetDriveId) return;

  if (sourceDriveId === targetDriveId) {
    showToast('O projeto já está neste drive.', 'warning');
    return;
  }

  const project = state.projects.find(p => p.id === projectId);
  const targetDrive = state.drives.find(d => d.id === targetDriveId);
  const sourceDrive = state.drives.find(d => d.id === sourceDriveId);

  if (!project || !targetDrive) return;

  if (project.drives.includes(targetDriveId)) {
    showToast(`"${project.name}" já está registrado em ${targetDrive.name}.`, 'warning');
    return;
  }

  // Open the Move or Duplicate Modal prompt
  openMoveProjectModal(project, sourceDrive, targetDrive);
}

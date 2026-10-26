/* ==========================================================================
   DMS DRIVE MANAGER - DRAG & DROP AND PROJECT MOVER LOGIC
   Seamless native drag-and-drop between drive cards + quick action mover
   ========================================================================== */

import { state } from './state.js';
import { openMoveProjectModal, showToast } from './modals.js';

let draggedProjectId = null;
let draggedSourceDriveId = null;

export function initDragAndDrop() {
  document.addEventListener('dragstart', handleDragStart);
  document.addEventListener('dragend', handleDragEnd);
  document.addEventListener('dragover', handleDragOver);
  document.addEventListener('dragleave', handleDragLeave);
  document.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
  const card = e.target.closest('.project-card, .project-list-row');
  if (!card) return;

  draggedProjectId = card.dataset.projectId;
  draggedSourceDriveId = card.dataset.driveId;

  card.classList.add('is-dragging');

  // Provide data for standard HTML5 drag
  e.dataTransfer.setData('text/plain', JSON.stringify({
    projectId: draggedProjectId,
    sourceDriveId: draggedSourceDriveId
  }));
  e.dataTransfer.effectAllowed = 'copyMove';
}

function handleDragEnd(e) {
  const card = e.target.closest('.project-card, .project-list-row');
  if (card) {
    card.classList.remove('is-dragging');
  }

  // Clear all drag target hover indicators
  document.querySelectorAll('.drive-card.drag-target-over, .drive-list-card.drag-target-over').forEach(el => {
    el.classList.remove('drag-target-over');
  });

  draggedProjectId = null;
  draggedSourceDriveId = null;
}

function handleDragOver(e) {
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

  // Ensure we didn't just hover over a child element inside the drive card
  const rect = driveCard.getBoundingClientRect();
  if (
    e.clientX < rect.left ||
    e.clientX >= rect.right ||
    e.clientY < rect.top ||
    e.clientY >= rect.bottom
  ) {
    driveCard.classList.remove('drag-target-over');
  }
}

function handleDrop(e) {
  const driveCard = e.target.closest('.drive-card, .drive-list-card');
  if (!driveCard) return;

  e.preventDefault();
  driveCard.classList.remove('drag-target-over');

  const targetDriveId = driveCard.dataset.driveId;
  if (!targetDriveId) return;

  let projectId = draggedProjectId;
  let sourceDriveId = draggedSourceDriveId;

  // Fallback to dataTransfer if variables are null
  if (!projectId) {
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      projectId = data.projectId;
      sourceDriveId = data.sourceDriveId;
    } catch (err) {
      return;
    }
  }

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

/* ==========================================================================
   DMS DRIVE MANAGER - SAMPLE PRODUCTION DATA
   Realistic data tailored for video production workflows
   ========================================================================== */

export const INITIAL_DRIVES = [
  {
    id: "drive-1",
    name: "SSD SanDisk Extreme Pro 4TB",
    serial: "SD-4TB-01",
    type: "nvme", // nvme, ssd, hdd, raid
    fileSystem: "exfat", // exfat, apfs, hfs, ntfs
    totalCapacityGB: 4000,
    custody: "Davi (Ilha 01 - Edição)",
    color: "#06b6d4", // Cyan
    notes: "SSD principal de edição de diárias 4K/6K em ProRes"
  },
  {
    id: "drive-2",
    name: "SSD Samsung T7 Shield 2TB",
    serial: "SS-2TB-03",
    type: "ssd",
    fileSystem: "apfs",
    totalCapacityGB: 2000,
    custody: "Mochila de Gravação / Set",
    color: "#f59e0b", // Amber
    notes: "Utilizado para descarrego direto das câmeras no set"
  },
  {
    id: "drive-3",
    name: "G-Drive Enterprise 18TB Desktop",
    serial: "GD-18TB-01",
    type: "hdd",
    fileSystem: "exfat",
    totalCapacityGB: 18000,
    custody: "Armário Central - Gaveta B",
    color: "#8b5cf6", // Purple
    notes: "Drive de arquivo bruto e backup primário do estúdio"
  },
  {
    id: "drive-4",
    name: "LaCie Rugged Pro 2TB (Laranja)",
    serial: "LC-2TB-02",
    type: "nvme",
    fileSystem: "exfat",
    totalCapacityGB: 2000,
    custody: "Lucas (Colorista - Remoto)",
    color: "#f97316", // Orange
    notes: "Em trânsito com o colorista para grading no DaVinci"
  },
  {
    id: "drive-5",
    name: "RAID OWC ThunderBay 32TB",
    serial: "TB-32TB-01",
    type: "raid",
    fileSystem: "apfs",
    totalCapacityGB: 32000,
    custody: "Sala do Servidor / Baia 2",
    color: "#10b981", // Emerald
    notes: "Storage central conectado à rede de 10GbE"
  }
];

export const INITIAL_PROJECTS = [
  {
    id: "proj-1",
    name: "Campanha Verão 2026 - Diárias 6K BRAW",
    client: "Moda & Co",
    sizeGB: 1350,
    drives: ["drive-1", "drive-3"], // Backed up on 2 drives!
    tags: ["6K RAW", "DaVinci", "Comercial"],
    createdAt: "2026-10-15",
    updatedAt: "2026-10-24",
    notes: "Material bruto de 3 dias de externa. Áudio sincronizado."
  },
  {
    id: "proj-2",
    name: "Documentário Raízes - Episódio 01",
    client: "Canal Brasil",
    sizeGB: 820,
    drives: ["drive-1"], // Single copy alert!
    tags: ["ProRes 422", "Doc", "Premiere"],
    createdAt: "2026-10-10",
    updatedAt: "2026-10-22",
    notes: "Corte preliminar e entrevistas gravadas com FX6."
  },
  {
    id: "proj-3",
    name: "Comercial Banco Next - Diárias e Renders",
    client: "Agência Apex",
    sizeGB: 680,
    drives: ["drive-2", "drive-3"], // Backed up!
    tags: ["Sony FX3", "XAVC-S", "After Effects"],
    createdAt: "2026-10-20",
    updatedAt: "2026-10-25",
    notes: "Efeitos visuais em pós-produção na Ilha 02."
  },
  {
    id: "proj-4",
    name: "Clipe Musical Aurora - 4K ProRes HQ",
    client: "Gravadora Som Maior",
    sizeGB: 1100,
    drives: ["drive-4"], // Single copy alert!
    tags: ["Música", "Color Grading", "DaVinci"],
    createdAt: "2026-10-18",
    updatedAt: "2026-10-25",
    notes: "HD físico enviado para o colorista Lucas fazer o grade."
  },
  {
    id: "proj-5",
    name: "Arquivo Histórico Institucional 2024-2025",
    client: "Grupo Vanguarda",
    sizeGB: 7400,
    drives: ["drive-3", "drive-5"], // Redundant backup
    tags: ["Arquivo Frio", "Master", "H.265"],
    createdAt: "2026-08-01",
    updatedAt: "2026-09-15",
    notes: "Projetos antigos consolidadaos para liberação de espaço."
  },
  {
    id: "proj-6",
    name: "Vídeo Manifesto Tech - 3D e Motion",
    client: "Inova Corp",
    sizeGB: 410,
    drives: ["drive-1", "drive-5"], // Backed up!
    tags: ["Cinema 4D", "Motion", "Redshift"],
    createdAt: "2026-10-22",
    updatedAt: "2026-10-26",
    notes: "Cenas em 3D renderizadas em EXR multipass."
  }
];

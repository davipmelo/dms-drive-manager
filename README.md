# 🎬 DMS Drive Manager — Studio Pro

> Sistema web moderno de catálogo, rastreamento físico e gestão de redundância de HDs e SSDs para produtoras audiovisuais.

![Dark Theme](https://img.shields.io/badge/Theme-DaVinci%20Dark-161922?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Pronto%20para%20GitHub%20Pages-06b6d4?style=for-the-badge)
![Redundancy](https://img.shields.io/badge/Backup-Alerta%203--2--1-10b981?style=for-the-badge)

---

## 💡 O Que é o Projeto?

O **DMS Drive Manager** foi desenhado especificamente para resolver o gargalo de produtoras de vídeo que lidam com dezenas de HDs e SSDs de projetos em alta rotatividade.

Em vez de precisar plugar drive por drive no computador para saber o que está gravado ou onde foi parar aquele material bruto, o sistema oferece um painel central visual, com drag-and-drop, métricas de capacidade e cálculo automático de segurança de dados.

---

## ⚡ Principais Funcionalidades

### 1. 🗄️ Workbench Visual com Drag & Drop
- Visualize todos os seus HDs e SSDs em cartões intuitivos com barras de capacidade dinâmica (cores dinâmicas para normal, aviso >80% e crítico >92%).
- **Arraste e solte** cartões de projetos entre os drives para **Transferir (Mover)** ou **Duplicar (Criar Backup)**.
- Menus rápidos para quem prefere não arrastar: botão direto *"Mover / Duplicar ➔"*.

### 2. 🛡️ Alerta Automático de Cópia Única (Regra de Backup 3-2-1)
- **`⚠️ Cópia Única (Risco)`**: O sistema identifica automaticamente projetos que estão salvos em apenas 1 drive físico e acende um badge de alerta.
- **`🛡️ 2+ Cópias (Seguro)`**: Mostra quais projetos já possuem backup replicado em outros discos.

### 3. 📍 Rastreamento de Custódia Física ("Com quem está o drive?")
- Registro instantâneo da localização física de cada drive (ex: *"Davi (Ilha 01)"*, *"Armário Central - Gaveta B"*, *"Mochila de Gravação"*, *"Lucas (Colorista Remoto)"*).
- Clique direto na etiqueta de custódia para atualizar a localização em 2 segundos.

### 4. 💾 Compatibilidade de Formatos
- Suporte a tags de sistema de arquivos: **exFAT** (universal Mac/Win), **APFS** (Apple nativo), **HFS+** e **NTFS** (Windows). Evita enviar um HD com formato incompatível para uma ilha de edição.

### 5. 🔍 Busca Instantânea e Filtros Avançados
- Pressione `/` no teclado para buscar instantaneamente por nome do projeto, cliente, tags ou drives.
- Filtre por **Segurança** (projetos sem backup), **Tipo de Drive** (NVMe, SSD, HDD, RAID), **Localização** e **Cliente**.

### 6. 📊 Métricas & Gráficos Intuitivos de Storage
- Gráfico Donut SVG interativo com porcentagem total ocupada x livre em todo o estúdio.
- Ocupação detalhada drive por drive.
- Indicador de saúde geral do backup da produtora.

### 7. ☁️ Sincronização em Tempo Real (Firebase Gratuito) + Modo Local
- Funciona **100% offline / local** imediatamente sem precisar configurar nada (usando LocalStorage).
- Possui modal de configuração rápida para conectar ao **Firebase Firestore**: sincroniza em tempo real entre todas as máquinas da produtora (até 10+ editores) no plano gratuito do Google.

---

## 🚀 Como Publicar no GitHub Pages (`davipmelo.github.io/dms-drive-manager`)

O projeto foi construído em arquitetura estática pura (HTML5 + CSS Moderno + ES Modules), o que significa que **não exige build, Node.js ou configuração complexa no GitHub Actions**. Basta enviar os arquivos para o repositório!

### Passo a Passo no Terminal:

1. No terminal da pasta do projeto, execute:
   ```bash
   git add .
   git commit -m "feat: inicializando dms drive manager"
   git branch -M main
   git remote add origin https://github.com/davipmelo/dms-drive-manager.git
   git push -u origin main
   ```

2. No GitHub:
   - Acesse o seu repositório: `https://github.com/davipmelo/dms-drive-manager`
   - Vá na aba **Settings** (Configurações)
   - Na barra lateral esquerda, clique em **Pages**
   - Em **Build and deployment > Source**, selecione: **Deploy from a branch**
   - Em **Branch**, selecione `main` e a pasta `/ (root)`
   - Clique em **Save**

3. Pronto! Em 1 minuto o site estará acessível no link:
   👉 **`https://davipmelo.github.io/dms-drive-manager/`**

---

## ☁️ Como Ativar a Sincronização em Tempo Real (Firebase Gratuito)

Se você quiser que toda a sua equipe veja as alterações em tempo real (quando alguém mover um projeto, atualizar no computador de todo mundo na hora):

1. Acesse [Firebase Console](https://console.firebase.google.com/) com sua conta Google.
2. Clique em **Adicionar projeto** (ex: `dms-produtora`).
3. No menu lateral, clique em **Criação > Firestore Database** e clique em **Criar banco de dados**.
4. Em **Regras**, defina para permitir leitura e gravação:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
5. No painel do projeto, clique no ícone de engrenagem ⚙️ (Configurações do Projeto) > **Geral** > Adicionar app **Web (ícone `</>`)**.
6. Copie as chaves do objeto `firebaseConfig` (`apiKey`, `projectId`, etc.).
7. Abra o DMS Drive Manager no navegador, clique na pílula **Modo Local (Offline)** no topo direito, cole as credenciais e clique em **Salvar e Conectar**.

Todos os navegadores conectados passarão a sincronizar instantaneamente!

---

## 📂 Estrutura de Arquivos

```
dms-drive-manager/
├── index.html              # Estrutura principal da aplicação (HTML5 semântico e diálogos)
├── css/
│   ├── theme.css           # Variáveis de design system, cores DaVinci dark e resets
│   ├── layout.css          # Topbar, barra lateral de filtros e containers responsivos
│   ├── components.css      # Cartões de drives, cartões de projetos, drag & drop e modais
│   └── charts.css          # Gráfico Donut SVG, barras de progresso e tabela de projetos
├── js/
│   ├── state.js            # Store reativo, cálculos de capacidade e filtros
│   ├── sample-data.js      # Dados iniciais realistas de produtora de vídeo
│   ├── firebase-service.js # Integração com Firestore Realtime e Auth
│   ├── drag-drop.js        # Motor nativo de Drag and Drop entre discos
│   ├── modals.js           # Gerenciadores de formulários e caixas de diálogo
│   ├── ui-render.js        # Renderizador dinâmico de interface
│   └── app.js              # Inicialização e atalhos de teclado
└── README.md               # Este guia completo de uso e deploy
```

# 🎬 DM`S DRIVE MANAGER

> Sistema web moderno e limpo de catálogo e gestão de redundância de HDs e SSDs para produtoras audiovisuais.

![Dark Theme](https://img.shields.io/badge/Theme-DaVinci%20Dark-161922?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Pronto%20para%20GitHub%20Pages-06b6d4?style=for-the-badge)
![Redundancy](https://img.shields.io/badge/Backup-Alerta%203--2--1-10b981?style=for-the-badge)

---

## 💡 O Que é o Projeto?

O **DM`S DRIVE MANAGER** foi desenhado especificamente para resolver o gargalo de produtoras de vídeo que lidam com dezenas de HDs e SSDs de projetos em alta rotatividade.

Em vez de precisar plugar drive por drive no computador para saber o que está gravado, o sistema oferece um painel central visual, com drag-and-drop, métricas de capacidade e cálculo automático de segurança de dados.

---

## ⚡ Principais Funcionalidades

### 1. 🗄️ Workbench Visual com Modos de Exibição (Grade & Lista)
- Alterne entre a **Visualização em Grade** e a **Visualização em Lista** limpa e intuitiva com um clique.
- **Arraste e solte** cartões de projetos entre os drives para **Transferir (Mover)** ou **Duplicar (Criar Backup)** em ambos os modos.
- Remova projetos de drives específicos com o botão dedicado *"Remover do Drive"*, mantendo-os preservados no catálogo geral.

### 2. 🛡️ Alerta Automático de Cópia Única (Regra de Backup 3-2-1)
- **`Cópia Única`**: O sistema identifica automaticamente projetos salvos em apenas 1 drive físico e sinaliza a necessidade de backup.
- **`2+ Cópias`**: Mostra quais projetos já possuem backup replicado em outros discos.

### 3. 📊 Dashboard de Armazenamento Sempre Visível na Sidebar
- Gráfico Donut SVG compacto com porcentagem total ocupada x livre em todo o estúdio com destaques em amarelo (`#ffbb00`).
- Ocupação detalhada por HD e SSD em tempo real ao lado das suas tarefas diárias.
- Indicador de saúde geral do backup da produtora.

### 4. 🌪️ Filtros Organizados em Ordem Alfabética
- Filtros elegantes através de popover flutuante no canto superior do Workbench, liberando a interface.
- Todos os campos e opções organizados em ordem alfabética e sem poluição de emojis: **Clientes**, **Segurança de Dados** e **Tipo de Mídia** (HD e SSD).

### 5. 📦 Semântica Segura de Remoção de Projetos
- Na **Visão em Drives**: use o botão *"Remover do Drive"* para desvincular um projeto de um disco específico sem apagá-lo do catálogo.
- Na **Lista de Projetos**: use o botão *"✕ Excluir"* para exclusão permanente do projeto do sistema e de todos os discos.

### 6. 💾 Formatação & Tipos de Mídia Padronizados
- Tipos de mídia estritamente **SSD** e **HD**.
- Suporte a formatos de disco: **exFAT**, **APFS**, **HFS+** e **NTFS**.

### 7. ☁️ Sincronização em Tempo Real (Firebase Gratuito) + Modo Local
- Funciona **100% offline / local** imediatamente sem precisar configurar nada (usando LocalStorage).
- Conexão opcional com o **Firebase Firestore** para sincronização em tempo real entre computadores da equipe.

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
│   ├── sample-data.js      # Estrutura base de dados (100% limpo para novos usuários)
│   ├── firebase-service.js # Integração com Firestore Realtime e Auth
│   ├── drag-drop.js        # Motor nativo de Drag and Drop entre discos
│   ├── modals.js           # Gerenciadores de formulários e caixas de diálogo
│   ├── ui-render.js        # Renderizador dinâmico de interface
│   └── app.js              # Inicialização e atalhos de teclado
└── README.md               # Este guia completo de uso e deploy
```

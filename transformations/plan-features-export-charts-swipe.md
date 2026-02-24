# Plan Détaillé : Export/Import, Graphiques, Bottom Nav & Swipe

**Date** : 2026-02-10  
**Statut** : EN COURS  
**Estimation totale** : 13-17 heures

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Phase 1 : Export/Import des Données](#phase-1--exportimport-des-données)
3. [Phase 2 : UX Mobile (Bottom Nav + Swipe)](#phase-2--ux-mobile-bottom-nav--swipe)
4. [Phase 3 : Graphiques de Visualisation](#phase-3--graphiques-de-visualisation)
5. [Tests E2E](#tests-e2e)
6. [Checklist Finale](#checklist-finale)

---

## Vue d'Ensemble

### Objectifs

1. **Export/Import** : Sauvegarder et restaurer les données
   - JSON : Backup complet (import/export)
   - OFX : Export vers GnuCash (import également supporté)
   
2. **UX Mobile Améliorée** :
   - Bottom navigation bar (remplace hamburger menu)
   - Swipe gestures sur cartes (transactions, goals)

3. **Visualisations** :
   - Graphiques Pie : Dépenses par catégorie
   - Graphiques Line : Évolution budget (6 et 12 mois)
   - Graphiques Bar : Revenus vs Dépenses

### Décisions Clés (Validées par l'Utilisateur)

| Question | Réponse |
|----------|---------|
| Import OFX ? | **Oui** |
| Stratégie import si données existent | **Demander** (avec comparaison fraîcheur) |
| Type graphique dépenses | **Pie** (camembert) |
| Période évolution budget | **6 et 12 mois** (sélecteur) |
| Bibliothèque graphiques | **Chart.js** |
| Icônes bottom nav | **Émojis** (🏠💸💰🎯) |
| Animation active bottom nav | **Oui** (icône grossit) |
| Swipe left | **Révéler boutons** Modifier/Supprimer |
| Desktop boutons | **Toujours visibles** |

---

## Phase 1 : Export/Import des Données

**Estimation** : 4-5 heures  
**Priorité** : CRITIQUE (prévention perte de données)

---

### 1.1 Ajouter Méthodes DB pour Export Complet

**Fichier** : `frontend/src/lib/db.js`

**Méthodes à ajouter** :

```javascript
// Récupérer TOUS les budgets (actuellement on ne peut que getBudget(month))
async getAllBudgets() {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('budgets', 'readonly');
    const store = tx.objectStore('budgets');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Importer en masse des transactions
async importTransactions(transactions) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    
    for (const txData of transactions) {
      const { id, ...data } = txData; // Supprimer l'ID pour éviter conflits
      store.add(data);
    }
    
    tx.oncomplete = () => resolve({ imported: transactions.length });
    tx.onerror = () => reject(tx.error);
  });
}

// Idem pour budgets et goals
async importBudgets(budgets) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('budgets', 'readwrite');
    const store = tx.objectStore('budgets');
    
    for (const budget of budgets) {
      store.put(budget); // put = update or insert
    }
    
    tx.oncomplete = () => resolve({ imported: budgets.length });
    tx.onerror = () => reject(tx.error);
  });
}

async importGoals(goals) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('goals', 'readwrite');
    const store = tx.objectStore('goals');
    
    for (const goalData of goals) {
      const { id, ...data } = goalData;
      store.add(data);
    }
    
    tx.oncomplete = () => resolve({ imported: goals.length });
    tx.onerror = () => reject(tx.error);
  });
}

// Vider complètement la DB (pour remplacement)
async clearAll() {
  await Promise.all([
    this.clearStore('transactions'),
    this.clearStore('budgets'),
    this.clearStore('goals')
  ]);
}

async clearStore(storeName) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Récupérer les métadonnées (pour comparaison fraîcheur)
async getMetadata() {
  const transactions = await this.getTransactions();
  const goals = await this.getGoals();
  
  const dates = [
    ...transactions.map(t => t.createdAt),
    ...goals.map(g => g.createdAt)
  ].filter(Boolean);
  
  return {
    totalTransactions: transactions.length,
    totalGoals: goals.length,
    lastModified: dates.length > 0 ? new Date(Math.max(...dates.map(d => new Date(d)))) : null
  };
}
```

---

### 1.2 Export JSON

**Fichier** : `frontend/src/lib/export.js` (nouveau)

**Format JSON** :
```json
{
  "version": "1.0",
  "appName": "Mon Budget",
  "exportDate": "2026-02-10T21:52:00.000Z",
  "metadata": {
    "totalTransactions": 15,
    "totalBudgets": 3,
    "totalGoals": 2
  },
  "data": {
    "transactions": [...],
    "budgets": [...],
    "goals": [...]
  }
}
```

**Code** :
```javascript
import { db } from './db.js';

export async function exportToJSON() {
  try {
    // Récupérer toutes les données
    const [transactions, budgets, goals] = await Promise.all([
      db.getTransactions(),
      db.getAllBudgets(),
      db.getGoals()
    ]);
    
    // Construire l'objet d'export
    const exportData = {
      version: "1.0",
      appName: "Mon Budget",
      exportDate: new Date().toISOString(),
      metadata: {
        totalTransactions: transactions.length,
        totalBudgets: budgets.length,
        totalGoals: goals.length
      },
      data: {
        transactions,
        budgets,
        goals
      }
    };
    
    // Créer le fichier
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Télécharger
    const a = document.createElement('a');
    a.href = url;
    a.download = `mon-budget-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    
    // Cleanup
    URL.revokeObjectURL(url);
    
    return { success: true, count: transactions.length + budgets.length + goals.length };
  } catch (error) {
    console.error('Export JSON failed:', error);
    throw new Error(`Erreur lors de l'export : ${error.message}`);
  }
}
```

---

### 1.3 Import JSON avec Comparaison de Fraîcheur

**Fichier** : `frontend/src/lib/export.js`

**Code** :
```javascript
export async function importFromJSON(file) {
  try {
    // Lire le fichier
    const text = await file.text();
    const importData = JSON.parse(text);
    
    // Validation
    if (importData.version !== "1.0") {
      throw new Error(`Version incompatible : ${importData.version}. Version attendue : 1.0`);
    }
    
    if (importData.appName !== "Mon Budget") {
      throw new Error("Ce fichier n'est pas un export de Mon Budget");
    }
    
    // Récupérer métadonnées actuelles
    const currentMetadata = await db.getMetadata();
    const hasExistingData = currentMetadata.totalTransactions > 0 || currentMetadata.totalGoals > 0;
    
    if (hasExistingData) {
      // Comparer fraîcheur
      const importDate = new Date(importData.exportDate);
      const currentDate = currentMetadata.lastModified;
      
      return {
        requiresConfirmation: true,
        importData,
        comparison: {
          import: {
            date: importDate,
            transactions: importData.metadata.totalTransactions,
            budgets: importData.metadata.totalBudgets,
            goals: importData.metadata.totalGoals
          },
          current: {
            date: currentDate,
            transactions: currentMetadata.totalTransactions,
            goals: currentMetadata.totalGoals
          },
          importIsNewer: currentDate ? importDate > currentDate : true
        }
      };
    }
    
    // Pas de données existantes, import direct
    await performImport(importData);
    return { success: true, imported: true };
    
  } catch (error) {
    console.error('Import JSON failed:', error);
    throw new Error(`Erreur lors de l'import : ${error.message}`);
  }
}

export async function confirmImport(importData, strategy) {
  if (strategy === 'replace') {
    await db.clearAll();
  } else if (strategy === 'cancel') {
    return { success: false, cancelled: true };
  }
  // strategy === 'merge' : ne rien faire, juste ajouter
  
  await performImport(importData);
  return { success: true, imported: true, strategy };
}

async function performImport(importData) {
  const { transactions, budgets, goals } = importData.data;
  
  await Promise.all([
    db.importTransactions(transactions),
    db.importBudgets(budgets),
    db.importGoals(goals)
  ]);
}
```

---

### 1.4 Export OFX (GnuCash)

**Fichier** : `frontend/src/lib/export-ofx.js` (nouveau)

**Format OFX 2.x** (XML) - Compatible GnuCash :

**Mappings** :
- `income` → `<TRNTYPE>CREDIT</TRNTYPE>` + montant positif
- `expense` → `<TRNTYPE>DEBIT</TRNTYPE>` + montant négatif
- `category` → `<NAME>`
- `description` → `<MEMO>`
- `id` → `<FITID>` (unique ID)
- `date` → `<DTPOSTED>` format YYYYMMDD000000

**Code** :
```javascript
import { db } from './db.js';

export async function exportToOFX() {
  try {
    const transactions = await db.getTransactions();
    const dashboard = await db.getDashboard();
    
    const ofxXML = buildOFXDocument(transactions, dashboard.balance);
    
    // Télécharger
    const blob = new Blob([ofxXML], { type: 'application/x-ofx' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mon-budget-${new Date().toISOString().slice(0, 10)}.ofx`;
    a.click();
    URL.revokeObjectURL(url);
    
    return { success: true, count: transactions.length };
  } catch (error) {
    console.error('Export OFX failed:', error);
    throw new Error(`Erreur lors de l'export OFX : ${error.message}`);
  }
}

function buildOFXDocument(transactions, balance) {
  const now = new Date();
  const dtserver = formatOFXDateTime(now);
  
  // Dates min/max des transactions
  const dates = transactions.map(t => new Date(t.date)).filter(d => !isNaN(d));
  const dtstart = dates.length > 0 ? formatOFXDate(new Date(Math.min(...dates))) : formatOFXDate(now);
  const dtend = dates.length > 0 ? formatOFXDate(new Date(Math.max(...dates))) : formatOFXDate(now);
  
  // Construire les transactions OFX
  const transactionsXML = transactions.map(tx => buildOFXTransaction(tx)).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<OFX>
  <SIGNONMSGSRSV1>
    <SONRS>
      <STATUS>
        <CODE>0</CODE>
        <SEVERITY>INFO</SEVERITY>
      </STATUS>
      <DTSERVER>${dtserver}</DTSERVER>
      <LANGUAGE>FRA</LANGUAGE>
    </SONRS>
  </SIGNONMSGSRSV1>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <TRNUID>1</TRNUID>
      <STATUS>
        <CODE>0</CODE>
        <SEVERITY>INFO</SEVERITY>
      </STATUS>
      <STMTRS>
        <CURDEF>EUR</CURDEF>
        <BANKACCTFROM>
          <BANKID>MONBUDGET</BANKID>
          <ACCTID>MAIN</ACCTID>
          <ACCTTYPE>CHECKING</ACCTTYPE>
        </BANKACCTFROM>
        <BANKTRANLIST>
          <DTSTART>${dtstart}</DTSTART>
          <DTEND>${dtend}</DTEND>
${transactionsXML}
        </BANKTRANLIST>
        <LEDGERBAL>
          <BALAMT>${balance.toFixed(2)}</BALAMT>
          <DTASOF>${dtserver}</DTASOF>
        </LEDGERBAL>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;
}

function buildOFXTransaction(tx) {
  const trntype = tx.type === 'income' ? 'CREDIT' : 'DEBIT';
  const amount = tx.type === 'income' ? tx.amount : -tx.amount;
  const dtposted = formatOFXDate(new Date(tx.date));
  const memo = tx.description || '';
  
  return `          <STMTTRN>
            <TRNTYPE>${trntype}</TRNTYPE>
            <DTPOSTED>${dtposted}</DTPOSTED>
            <TRNAMT>${amount.toFixed(2)}</TRNAMT>
            <FITID>${tx.id}</FITID>
            <NAME>${escapeXML(tx.category)}</NAME>
            <MEMO>${escapeXML(memo)}</MEMO>
          </STMTTRN>`;
}

function formatOFXDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}000000`;
}

function formatOFXDateTime(date) {
  const dateStr = formatOFXDate(date).slice(0, 8); // YYYYMMDD
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${dateStr}${hours}${minutes}${seconds}`;
}

function escapeXML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

---

### 1.5 Import OFX

**Fichier** : `frontend/src/lib/export-ofx.js`

**Code** :
```javascript
export async function importFromOFX(file) {
  try {
    const text = await file.text();
    const transactions = parseOFX(text);
    
    // Même logique que JSON : vérifier si données existantes
    const currentMetadata = await db.getMetadata();
    const hasExistingData = currentMetadata.totalTransactions > 0;
    
    if (hasExistingData) {
      return {
        requiresConfirmation: true,
        transactions,
        comparison: {
          import: {
            transactions: transactions.length,
            source: 'OFX'
          },
          current: {
            transactions: currentMetadata.totalTransactions
          }
        }
      };
    }
    
    // Import direct
    await db.importTransactions(transactions);
    return { success: true, imported: transactions.length };
    
  } catch (error) {
    console.error('Import OFX failed:', error);
    throw new Error(`Erreur lors de l'import OFX : ${error.message}`);
  }
}

function parseOFX(ofxText) {
  // Parser XML OFX
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(ofxText, 'text/xml');
  
  // Vérifier erreur parsing
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Fichier OFX invalide (XML malformé)');
  }
  
  // Extraire les transactions
  const stmtTrns = xmlDoc.querySelectorAll('STMTTRN');
  const transactions = [];
  
  for (const stmtTrn of stmtTrns) {
    const trntype = stmtTrn.querySelector('TRNTYPE')?.textContent;
    const dtposted = stmtTrn.querySelector('DTPOSTED')?.textContent;
    const trnamt = parseFloat(stmtTrn.querySelector('TRNAMT')?.textContent || '0');
    const name = stmtTrn.querySelector('NAME')?.textContent || 'Non catégorisé';
    const memo = stmtTrn.querySelector('MEMO')?.textContent || '';
    
    // Conversion OFX → Mon Budget
    const type = trntype === 'CREDIT' ? 'income' : 'expense';
    const amount = Math.abs(trnamt);
    const date = parseOFXDate(dtposted);
    
    transactions.push({
      type,
      amount,
      category: name,
      description: memo,
      date,
      createdAt: new Date().toISOString()
    });
  }
  
  return transactions;
}

function parseOFXDate(ofxDate) {
  // Format: YYYYMMDD000000 ou YYYYMMDDHHMMSS
  const year = ofxDate.slice(0, 4);
  const month = ofxDate.slice(4, 6);
  const day = ofxDate.slice(6, 8);
  return `${year}-${month}-${day}`;
}
```

---

### 1.6 UI Export/Import dans Dashboard

**Fichier** : `frontend/src/routes/+page.svelte`

**Ajout section en bas** :

```svelte
<script>
  import { exportToJSON, importFromJSON, confirmImport } from '$lib/export.js';
  import { exportToOFX, importFromOFX } from '$lib/export-ofx.js';
  
  let importFileInput;
  let importing = false;
  let importResult = null;
  let showImportDialog = false;
  let importComparison = null;
  let pendingImport = null;
  let error = null;
  
  async function handleExportJSON() {
    try {
      await exportToJSON();
    } catch (e) {
      error = e.message;
    }
  }
  
  async function handleExportOFX() {
    try {
      await exportToOFX();
    } catch (e) {
      error = e.message;
    }
  }
  
  async function handleImportClick(format) {
    importFileInput.setAttribute('accept', format === 'json' ? '.json' : '.ofx');
    importFileInput.dataset.format = format;
    importFileInput.click();
  }
  
  async function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const format = event.target.dataset.format;
    importing = true;
    error = null;
    
    try {
      const result = format === 'json' 
        ? await importFromJSON(file)
        : await importFromOFX(file);
      
      if (result.requiresConfirmation) {
        showImportDialog = true;
        importComparison = result.comparison;
        pendingImport = { data: result.importData || result.transactions, format };
      } else {
        importResult = result;
        await loadDashboard();
      }
    } catch (e) {
      error = e.message;
    } finally {
      importing = false;
      event.target.value = '';
    }
  }
  
  async function handleConfirmImport(strategy) {
    try {
      if (pendingImport.format === 'json') {
        await confirmImport(pendingImport.data, strategy);
      } else {
        if (strategy === 'replace') {
          await db.clearStore('transactions');
        }
        await db.importTransactions(pendingImport.data);
      }
      
      showImportDialog = false;
      importResult = { success: true };
      await loadDashboard();
    } catch (e) {
      error = e.message;
    }
  }
</script>

<!-- Section données -->
<div class="card">
  <h2 class="mb-2">Gestion des données</h2>
  
  <div class="data-actions">
    <button class="secondary" onclick={handleExportJSON}>
      📥 Exporter JSON
    </button>
    <button class="secondary" onclick={handleExportOFX}>
      📊 Exporter OFX
    </button>
    <button class="secondary" onclick={() => handleImportClick('json')}>
      📤 Importer JSON
    </button>
    <button class="secondary" onclick={() => handleImportClick('ofx')}>
      📄 Importer OFX
    </button>
  </div>
  
  <input 
    type="file" 
    bind:this={importFileInput}
    onchange={handleImportFile}
    style="display: none"
  />
  
  <p class="text-muted mt-2">
    <strong>JSON</strong> : Sauvegarde complète (transactions, budgets, objectifs).<br/>
    <strong>OFX</strong> : Compatible GnuCash, LibreOffice Calc (transactions uniquement).
  </p>
  
  {#if importing}
    <p class="text-muted mt-2">Import en cours...</p>
  {/if}
  
  {#if error}
    <p class="error mt-2">{error}</p>
  {/if}
  
  {#if importResult?.success}
    <p class="text-success mt-2">✓ Import réussi !</p>
  {/if}
</div>

<!-- Dialogue de confirmation -->
{#if showImportDialog}
  <div class="modal-overlay" onclick={() => showImportDialog = false}>
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
      <h3>Confirmer l'import</h3>
      
      <p>Vous avez déjà des données. Que voulez-vous faire ?</p>
      
      <div class="comparison">
        <div>
          <h4>Données à importer</h4>
          <p>Transactions : {importComparison.import.transactions}</p>
          {#if importComparison.import.date}
            <p>Date : {new Date(importComparison.import.date).toLocaleDateString('fr-FR')}</p>
          {/if}
        </div>
        <div>
          <h4>Données actuelles</h4>
          <p>Transactions : {importComparison.current.transactions}</p>
          {#if importComparison.current.date}
            <p>Date : {new Date(importComparison.current.date).toLocaleDateString('fr-FR')}</p>
          {/if}
        </div>
      </div>
      
      {#if importComparison.importIsNewer !== undefined}
        {#if importComparison.importIsNewer}
          <p class="text-success">✓ Les données à importer sont plus récentes</p>
        {:else}
          <p class="text-warning">⚠️ Les données actuelles semblent plus récentes</p>
        {/if}
      {/if}
      
      <div class="modal-actions">
        <button class="danger" onclick={() => handleConfirmImport('replace')}>
          Remplacer tout
        </button>
        <button class="primary" onclick={() => handleConfirmImport('merge')}>
          Fusionner
        </button>
        <button class="secondary" onclick={() => showImportDialog = false}>
          Annuler
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .data-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    margin-bottom: 12px;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }
  
  .modal-content {
    background: var(--bg-card);
    padding: 24px;
    border-radius: var(--radius);
    max-width: 500px;
    width: 90%;
  }
  
  .comparison {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin: 16px 0;
    padding: 16px;
    background: var(--bg);
    border-radius: var(--radius);
  }
  
  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 16px;
  }
  
  .text-success {
    color: var(--secondary);
  }
  
  .text-warning {
    color: var(--warning);
  }
  
  @media (max-width: 767px) {
    .data-actions {
      grid-template-columns: 1fr 1fr;
    }
    
    .comparison {
      grid-template-columns: 1fr;
    }
  }
</style>
```

---

## Phase 2 : UX Mobile (Bottom Nav + Swipe)

**Estimation** : 3-4 heures  
**Priorité** : Haute

---

### 2.1 Bottom Navigation Bar

**Fichier** : `frontend/src/routes/+layout.svelte`

**Remplacer le hamburger menu par bottom nav sur mobile** :

```svelte
<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import '../app.css';
</script>

<!-- Navbar desktop / Header simple mobile -->
<nav class="navbar">
  <div class="nav-brand">Mon Budget</div>
  
  <!-- Desktop : liens horizontaux -->
  <div class="nav-links desktop-only">
    <a href="{base}/" class:active={$page.url.pathname === base + '/'}>Tableau de bord</a>
    <a href="{base}/transactions" class:active={$page.url.pathname.includes('/transactions')}>Transactions</a>
    <a href="{base}/budget" class:active={$page.url.pathname.includes('/budget')}>Budget</a>
    <a href="{base}/goals" class:active={$page.url.pathname.includes('/goals')}>Objectifs</a>
  </div>
</nav>

<main>
  <slot />
</main>

<!-- Bottom nav (mobile uniquement) -->
<nav class="bottom-nav mobile-only">
  <a href="{base}/" class:active={$page.url.pathname === base + '/'}>
    <span class="icon">🏠</span>
    <span class="label">Dashboard</span>
  </a>
  <a href="{base}/transactions" class:active={$page.url.pathname.includes('/transactions')}>
    <span class="icon">💸</span>
    <span class="label">Transactions</span>
  </a>
  <a href="{base}/budget" class:active={$page.url.pathname.includes('/budget')}>
    <span class="icon">💰</span>
    <span class="label">Budget</span>
  </a>
  <a href="{base}/goals" class:active={$page.url.pathname.includes('/goals')}>
    <span class="icon">🎯</span>
    <span class="label">Objectifs</span>
  </a>
</nav>

<style>
  /* Garder styles navbar existants */
  
  /* Desktop only */
  .mobile-only {
    display: none;
  }
  
  /* Bottom nav */
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--bg-card);
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 8px 0 max(8px, env(safe-area-inset-bottom));
    z-index: 1000;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.2);
  }
  
  .bottom-nav a {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    color: var(--text-muted);
    min-width: 60px;
    text-align: center;
    transition: all 0.2s ease;
  }
  
  .bottom-nav a.active {
    color: var(--primary);
  }
  
  .bottom-nav a.active .icon {
    transform: scale(1.2);
  }
  
  .bottom-nav .icon {
    font-size: 1.5rem;
    transition: transform 0.2s ease;
  }
  
  .bottom-nav .label {
    font-size: 0.7rem;
    font-weight: 500;
  }
  
  /* Mobile */
  @media (max-width: 767px) {
    .desktop-only {
      display: none;
    }
    
    .mobile-only {
      display: flex;
    }
    
    main {
      padding-bottom: 80px;
    }
    
    .navbar {
      padding: 12px 16px;
    }
    
    .nav-brand {
      font-size: 1.1rem;
    }
  }
</style>
```

---

### 2.2 Swipe Gestures Utility

**Fichier** : `frontend/src/lib/swipe.js` (nouveau)

```javascript
/**
 * Active les gestes de swipe sur un élément
 */
export function enableSwipe(element, options = {}) {
  const { onSwipeLeft, onSwipeRight, threshold = 80 } = options;
  
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let isDragging = false;
  
  function handleTouchStart(e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
    element.style.transition = 'none';
  }
  
  function handleTouchMove(e) {
    if (!isDragging) return;
    
    currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX;
    const diffY = currentY - startY;
    
    // Swipe horizontal uniquement
    if (Math.abs(diffX) > Math.abs(diffY)) {
      e.preventDefault();
      element.style.transform = `translateX(${diffX}px)`;
    }
  }
  
  function handleTouchEnd() {
    if (!isDragging) return;
    
    const diffX = currentX - startX;
    element.style.transition = 'transform 0.3s ease';
    
    if (diffX < -threshold && onSwipeLeft) {
      onSwipeLeft();
    } else if (diffX > threshold && onSwipeRight) {
      onSwipeRight();
    } else {
      element.style.transform = '';
    }
    
    isDragging = false;
    startX = 0;
    currentX = 0;
  }
  
  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: false });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });
  
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

export function revealActions(element) {
  const actionsWidth = 140;
  element.style.transform = `translateX(-${actionsWidth}px)`;
}

export function hideActions(element) {
  element.style.transform = '';
}
```

---

### 2.3 Appliquer Swipe aux Transactions

**Fichier** : `frontend/src/routes/transactions/+page.svelte`

**Modifications HTML + Script** :

Voir plan complet pour le code détaillé (structure wrapper + swipeable + actions)

---

### 2.4 Appliquer Swipe aux Objectifs

**Fichier** : `frontend/src/routes/goals/+page.svelte`

**Même approche que transactions**

---

## Phase 3 : Graphiques de Visualisation

**Estimation** : 4-5 heures

---

### 3.1 Installation

```bash
npm install chart.js
```

---

### 3.2 Utilitaires

**Fichier** : `frontend/src/lib/charts.js` (nouveau)

Voir plan complet pour les fonctions `createPieChart()`, `createLineChart()`, `createBarChart()`

---

### 3.3 Dashboard : Revenus vs Dépenses (Bar)

**Fichier** : `frontend/src/routes/+page.svelte`

Ajouter canvas + script pour créer graphique bar

---

### 3.4 Budget : Dépenses par Catégorie (Pie)

**Fichier** : `frontend/src/routes/budget/+page.svelte`

Ajouter canvas + script pour créer graphique pie

---

### 3.5 Budget : Évolution Budget (Line)

**Fichier** : `frontend/src/routes/budget/+page.svelte`

Ajouter canvas + toggle 6/12 mois

---

## Tests E2E

### Nouveaux tests à ajouter :

1. `frontend/e2e/export-import.spec.ts` - Export/Import JSON/OFX
2. `frontend/e2e/charts.spec.ts` - Présence des graphiques
3. `frontend/e2e/navigation.spec.ts` - Bottom nav

---

## Checklist Finale

### Fichiers à Créer
- [ ] `frontend/src/lib/export.js`
- [ ] `frontend/src/lib/export-ofx.js`
- [ ] `frontend/src/lib/swipe.js`
- [ ] `frontend/src/lib/charts.js`
- [ ] `frontend/e2e/export-import.spec.ts`
- [ ] `frontend/e2e/charts.spec.ts`

### Fichiers à Modifier
- [ ] `frontend/src/lib/db.js`
- [ ] `frontend/src/routes/+layout.svelte`
- [ ] `frontend/src/routes/+page.svelte`
- [ ] `frontend/src/routes/transactions/+page.svelte`
- [ ] `frontend/src/routes/budget/+page.svelte`
- [ ] `frontend/src/routes/goals/+page.svelte`
- [ ] `frontend/package.json`
- [ ] `frontend/e2e/navigation.spec.ts`

### Validation
- [ ] 70+ tests E2E passent
- [ ] Build sans erreurs
- [ ] Test manuel mobile
- [ ] Commit + push
- [ ] Déploiement OK

---

## Ordre d'Exécution

### Sprint 1 (4-5h) : Export/Import
1. Méthodes DB
2. Export JSON
3. Import JSON + dialogue
4. Export OFX
5. Import OFX
6. Tests E2E

### Sprint 2 (3-4h) : UX Mobile
7. Bottom nav
8. Swipe utility
9. Apply swipe transactions/goals
10. Tests E2E

### Sprint 3 (4-5h) : Graphiques
11. Setup Chart.js
12. Utilitaires
13. Dashboard bar chart
14. Budget pie + line charts
15. Tests E2E

---

**TOTAL : 13-17 heures**

**Prêt pour l'implémentation ! 🚀**

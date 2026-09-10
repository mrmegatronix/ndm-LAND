const fs = require('fs');
const path = require('path');
require('dotenv').config();

const workspaceDir = path.resolve(__dirname, '..');
const outputFile = path.join(__dirname, 'index.html');

// PIN configurations
const EXPECTED_PIN = process.env.PIN || '791355';
const EXPECTED_HASH = simpleHash(EXPECTED_PIN);
const DEMO_PIN = process.env.DEMO_PIN || '0001';

const ignoreDirs = ['node_modules', '.git', '.vscode', '.github', '_UNUSED', 'extra-slides', 'images', 'scratch', '_old', 'z_OLD', '_menus', '_backgrounds', '.venv', 'venv'];

function findHtmlFiles(dir, repoName, baseDir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        if (ignoreDirs.includes(file)) continue;
        const filePath = path.join(dir, file);
        try {
            if (fs.statSync(filePath).isDirectory()) {
                findHtmlFiles(filePath, repoName, baseDir, fileList);
            } else if (file.endsWith('.html')) {
                const relPath = path.relative(baseDir, filePath).replace(/\\/g, '/');
                fileList.push(relPath);
            }
        } catch (e) {
            // Ignore broken symlinks
        }
    }
    return fileList.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));
}

function getPreviewImage(repoPath, repoName) {
    const images = [
        '_preview/cover.jpg', '_preview/cover.png', '_preview/preview.png',
        'preview.png', 'preview.jpg', 'cover.png', 'cover.jpg', 'screenshot.png', 'screenshot.jpg'
    ];
    for (const img of images) {
        if (fs.existsSync(path.join(repoPath, img))) {
            return `../${repoName}/${img}`;
        }
    }
    return null;
}

function generateRepoCard(repo, borderColor, titleColor, icon) {
    const repoDir = path.join(workspaceDir, repo);
    const htmlFiles = findHtmlFiles(repoDir, repo, repoDir);
    if (htmlFiles.length === 0) return '';
    
    const previewImg = getPreviewImage(repoDir, repo);
    const previewHtml = previewImg ? `<img src="${previewImg}" class="repo-preview-img" alt="${repo} preview" onerror="this.style.display='none'"/>` : '';
    
    const linksHtml = htmlFiles.map(f => {
        const ghUrl = `../${repo}/${f}`;
        const absoluteUrl = `https://mrmegatronix.github.io/${repo}/${f}`;
        const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(absoluteUrl)}`;
        return `<li style="display:flex; align-items:center; gap: 8px;">
            <a href="${ghUrl}" target="_blank" class="mod-link" style="flex:1;"><i data-lucide="file"></i> ${f}</a>
            <a href="${ghUrl}" target="_blank" title="Scan or Click to open in new window" style="display:block; flex-shrink:0; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
               <img src="${qrApi}" style="width: 44px; height: 44px; border-radius: 8px; background: white; padding: 2px;" alt="QR Code" />
            </a>
        </li>`;
    }).join('');

    return `
    <div class="repo-card border-${borderColor}" data-repo="${repo}">
        <details>
            <summary class="repo-title text-${titleColor}">
                <div style="display:flex; align-items:center; gap:0.5rem; width:100%;">
                    <input type="checkbox" class="repo-select-checkbox" value="${repo}" style="display:none; transform: scale(1.5); margin-right: 10px;" />
                    <i data-lucide="${icon}"></i> ${repo}
                </div>
            </summary>
            ${previewHtml}
            <ul class="repo-links">
                ${linksHtml}
            </ul>
        </details>
    </div>`;
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

function buildHtml() {
    console.log('Building ndm-LAND index.html...');
    
    const allDirs = fs.readdirSync(workspaceDir);
    
    // Filter out "ct" repos and _ctos-beta
    const ndmRepos = allDirs.filter(d => {
        const fullPath = path.join(workspaceDir, d);
        if (!fs.statSync(fullPath).isDirectory() || ignoreDirs.includes(d) || d === 'ndm-LAND') return false;
        
        const lower = d.toLowerCase();
        if (lower.includes('ct') || lower === '_ctos-beta') {
            return false;
        }
        return true;
    }).sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));

    const testReposList = ['__auto-dash', 'HAOS-kiosk', 'ProxmoxMaster', 'PowerShell_IPv4NetworkScanner'];
    
    const testRepos = ndmRepos.filter(r => testReposList.includes(r));
    const devRepos = ndmRepos.filter(r => !testReposList.includes(r));
    
    const devHtml = devRepos.map(repo => generateRepoCard(repo, 'cyan', 'cyan', 'flask-conical')).join('');
    const testHtml = testRepos.map(repo => generateRepoCard(repo, 'gold', 'gold', 'hammer')).join('');

    const template = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NDM Ecosystem Hub</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: rgba(255, 255, 255, 0.02);
      --card-hover: rgba(255, 255, 255, 0.04);
      --border: rgba(255, 255, 255, 0.06);
      --border-hover: rgba(255, 255, 255, 0.12);
      --text: #f1f5f9;
      --muted: #64748b;
      
      --blue: #3b82f6; --blue-glow: rgba(59, 130, 246, 0.15); --blue-hover: #60a5fa;
      --gold: #d4af37; --gold-glow: rgba(212, 175, 55, 0.15); --gold-hover: #f59e0b;
      --cyan: #06b6d4; --cyan-glow: rgba(6, 182, 212, 0.15); --cyan-hover: #22d3ee;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body { 
      font-family: 'Inter', sans-serif; 
      background: radial-gradient(circle at top right, #111827, #030712); 
      color: var(--text); 
      min-height: 100vh; 
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      overflow-y: auto;
    }
    
    .header { padding: 1.5rem 2.5rem 0.5rem; max-width: 1800px; width: 100%; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
    .header-title { font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 700; background: linear-gradient(135deg, #fff 30%, var(--cyan) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .header-subtitle { font-size: 0.8rem; color: var(--muted); margin-top: 0.2rem; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; }
    
    .container { 
      display: grid; 
      grid-template-columns: repeat(2, 1fr);
      flex: 1;
      padding: 1rem 2.5rem 2rem; 
      gap: 2rem; 
      max-width: 1800px; 
      width: 100%;
      margin: 0 auto; 
      box-sizing: border-box;
      min-height: calc(100vh - 120px);
    }
    @media (max-width: 768px) {
      .container { grid-template-columns: 1fr; padding: 1rem; }
      .header { flex-direction: column; align-items: flex-start; gap: 1rem; padding: 1.5rem 1rem 0.5rem; }
    }
    
    .column { display: flex; flex-direction: column; background: var(--card-bg); border: 1px solid var(--border); border-radius: 24px; padding: 1.5rem; overflow: hidden; backdrop-filter: blur(16px); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4); height: 100%; }
    .column-header { font-family: 'Outfit', sans-serif; font-size: 1.3rem; font-weight: 600; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
    .column-content { flex: 1; overflow-y: auto; padding-right: 0.5rem; }
    
    /* Scrollbar */
    ::-webkit-scrollbar { width: 24px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 20px; border: 6px solid var(--card-bg); }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
    
    /* Links & Cards */
    .repo-card { margin-bottom: 1rem; background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1rem; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .repo-card:hover { transform: translateY(-2px); background: var(--card-hover); border-color: var(--border-hover); }
    
    .repo-card.border-blue { border-left: 4px solid var(--blue); } .repo-card.border-blue:hover { box-shadow: 0 0 20px var(--blue-glow); }
    .repo-card.border-gold { border-left: 4px solid var(--gold); } .repo-card.border-gold:hover { box-shadow: 0 0 20px var(--gold-glow); }
    .repo-card.border-cyan { border-left: 4px solid var(--cyan); } .repo-card.border-cyan:hover { box-shadow: 0 0 20px var(--cyan-glow); }

    .repo-title { font-family: 'Outfit', sans-serif; font-size: 1.2rem; color: #fff; padding: 12px 6px; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; list-style: none; }
    .repo-title::-webkit-details-marker { display: none; }
    .text-blue { color: var(--blue-hover); } .text-gold { color: var(--gold-hover); } .text-cyan { color: var(--cyan-hover); }

    .repo-links { list-style: none; display: flex; flex-direction: column; gap: 0.3rem; margin-top: 0.5rem; }
    .mod-link { color: #94a3b8; text-decoration: none; display: flex; align-items: center; gap: 0.8rem; font-size: 1rem; transition: all 0.2s; padding: 14px 16px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.03); margin-bottom: 4px; }
    .mod-link:hover { color: #fff; background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); transform: translateX(4px); }
    .mod-link i { width: 14px; height: 14px; opacity: 0.7; }
    
    .repo-preview-img { width: 100%; border-radius: 12px; margin: 10px 0; object-fit: cover; max-height: 200px; border: 1px solid var(--border); }
    
    .manage-btn { padding: 0.5rem 1rem; border-radius: 99px; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid var(--border); cursor: pointer; font-family: 'Outfit'; font-weight: 600; font-size: 0.9rem; transition: all 0.2s; }
    .manage-btn:hover { background: rgba(255,255,255,0.1); }
    .manage-actions { display: flex; gap: 10px; align-items: center; }
  </style>
</head>
<body>

  <header class="header">
    <div>
      <h1 class="header-title">NDM Ecosystem Hub</h1>
      <div class="header-subtitle">Development & Testing Grounds</div>
    </div>
    <div class="manage-actions">
        <button id="expand-all-btn" class="manage-btn"><i data-lucide="chevron-down" style="width:14px;height:14px;margin-right:4px;vertical-align:text-bottom;"></i> Expand</button>
        <button id="collapse-all-btn" class="manage-btn"><i data-lucide="chevron-up" style="width:14px;height:14px;margin-right:4px;vertical-align:text-bottom;"></i> Collapse</button>
        <button id="manage-links-btn" class="manage-btn"><i data-lucide="edit-2" style="width:14px;height:14px;margin-right:4px;vertical-align:text-bottom;"></i> Manage Links</button>
        <button id="download-archive-btn" class="manage-btn" style="display:none; border-color: #ef4444; color: #ef4444;"><i data-lucide="download" style="width:14px;height:14px;margin-right:4px;vertical-align:text-bottom;"></i> Save Changes</button>
    </div>
  </header>

  <div class="container">
    <!-- Dev-LAND (Alpha) -->
    <div class="column">
      <div class="column-header" style="color: var(--cyan);"><i data-lucide="flask-conical"></i> Dev-LAND (Alpha)</div>
      <div class="column-content">
        ${devHtml}
      </div>
    </div>

    <!-- Test-LAND (Beta) -->
    <div class="column">
      <div class="column-header" style="color: var(--gold);"><i data-lucide="hammer"></i> Test-LAND (Beta)</div>
      <div class="column-content">
        ${testHtml}
      </div>
    </div>
  </div>

  <script>
    lucide.createIcons();
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    
    const expandBtn = document.getElementById('expand-all-btn');
    const collapseBtn = document.getElementById('collapse-all-btn');
    if(expandBtn) expandBtn.addEventListener('click', () => document.querySelectorAll('details').forEach(d => d.open = true));
    if(collapseBtn) collapseBtn.addEventListener('click', () => document.querySelectorAll('details').forEach(d => d.open = false));
    
    const manageBtn = document.getElementById('manage-links-btn');
    const downloadBtn = document.getElementById('download-archive-btn');
    const checkboxes = document.querySelectorAll('.repo-select-checkbox');
    let isManageMode = false;

    manageBtn.addEventListener('click', () => {
        isManageMode = !isManageMode;
        checkboxes.forEach(cb => cb.style.display = isManageMode ? 'inline-block' : 'none');
        downloadBtn.style.display = isManageMode ? 'inline-flex' : 'none';
        manageBtn.innerHTML = isManageMode ? 
            '<i data-lucide="x" style="width:14px;height:14px;margin-right:4px;vertical-align:text-bottom;"></i> Cancel' : 
            '<i data-lucide="edit-2" style="width:14px;height:14px;margin-right:4px;vertical-align:text-bottom;"></i> Manage Links';
        lucide.createIcons();
    });

    downloadBtn.addEventListener('click', () => {
        const selected = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
        if (selected.length === 0) {
            alert('No links selected to remove!');
            return;
        }
        
        const data = { archiveRepos: selected };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'archive_changes.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        manageBtn.click();
        checkboxes.forEach(cb => cb.checked = false);
    });
  </script>
</body>
</html>`;

    fs.writeFileSync(outputFile, template);
    console.log('Successfully generated ndm-LAND index.html');
}

buildHtml();

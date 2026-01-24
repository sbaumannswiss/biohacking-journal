/**
 * Mobile Build Script für Capacitor
 * 
 * Verschiebt API-Routen temporär, da diese beim statischen Export nicht unterstützt werden.
 * Die API-Routen laufen auf Vercel, die native App verbindet sich via HTTP.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '..', 'app', 'api');
const API_BACKUP_DIR = path.join(__dirname, '..', 'app', '_api_backup');
const AUTH_DIR = path.join(__dirname, '..', 'app', 'auth');
const AUTH_BACKUP_DIR = path.join(__dirname, '..', 'app', '_auth_backup');
const MIDDLEWARE_FILE = path.join(__dirname, '..', 'middleware.ts');
const MIDDLEWARE_BACKUP = path.join(__dirname, '..', 'middleware.ts.bak');

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function deleteDirSync(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function backupAndRemove(src, backup) {
  if (fs.existsSync(src)) {
    // Backup erstellen
    if (fs.statSync(src).isDirectory()) {
      deleteDirSync(backup);
      copyDirSync(src, backup);
      deleteDirSync(src);
    } else {
      fs.copyFileSync(src, backup);
      fs.unlinkSync(src);
    }
    console.log(`✓ Backed up and removed: ${path.basename(src)}`);
    return true;
  }
  return false;
}

function restore(backup, dest) {
  if (fs.existsSync(backup)) {
    if (fs.statSync(backup).isDirectory()) {
      deleteDirSync(dest);
      copyDirSync(backup, dest);
      deleteDirSync(backup);
    } else {
      fs.copyFileSync(backup, dest);
      fs.unlinkSync(backup);
    }
    console.log(`✓ Restored: ${path.basename(dest)}`);
    return true;
  }
  return false;
}

async function main() {
  let apiBackedUp = false;
  let authBackedUp = false;
  let middlewareBackedUp = false;

  try {
    console.log('\n🔧 Preparing mobile build...\n');

    // 1. API-Routen temporär entfernen (Backup erstellen)
    apiBackedUp = backupAndRemove(API_DIR, API_BACKUP_DIR);

    // 2. Auth-Routen temporär entfernen (enthält auch route.ts)
    authBackedUp = backupAndRemove(AUTH_DIR, AUTH_BACKUP_DIR);

    // 3. Middleware temporär entfernen (nicht kompatibel mit static export)
    middlewareBackedUp = backupAndRemove(MIDDLEWARE_FILE, MIDDLEWARE_BACKUP);

    // 3. Build ausführen
    console.log('\n📦 Building Next.js for Capacitor...\n');
    execSync('npx cross-env CAPACITOR_BUILD=true next build', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });

    console.log('\n✅ Mobile build successful!\n');

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exitCode = 1;

  } finally {
    // Dateien wiederherstellen
    console.log('\n🔄 Restoring files...\n');
    
    if (apiBackedUp) {
      restore(API_BACKUP_DIR, API_DIR);
    }
    
    if (authBackedUp) {
      restore(AUTH_BACKUP_DIR, AUTH_DIR);
    }
    
    if (middlewareBackedUp) {
      restore(MIDDLEWARE_BACKUP, MIDDLEWARE_FILE);
    }
  }
}

main();

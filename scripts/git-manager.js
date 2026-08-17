import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';

const projectDir = path.resolve('.');

async function main() {
  console.log("Checking project dir:", projectDir);
  
  // 1. Init git repo if not exists
  try {
    await git.init({ fs, dir: projectDir, defaultBranch: 'main' });
    console.log("Git repo initialized / verified at", projectDir);
  } catch (err) {
    console.error("Error initializing git:", err);
  }
  
  // 2. Read git status matrix to see what files need adding
  const statusMatrix = await git.statusMatrix({
    fs,
    dir: projectDir,
    ignored: false
  });
  
  console.log(`Found ${statusMatrix.length} files in directory scan.`);
  
  // Filter files that should be added
  const filesToAdd = statusMatrix
    .filter(row => row[2] === 2 || row[2] === 0 || row[1] !== row[2]) // modified or untracked
    .map(row => row[0])
    .filter(f => !f.startsWith('node_modules') && !f.startsWith('.git') && !f.startsWith('dist'));
    
  console.log(`Files to stage: ${filesToAdd.length}`);
  
  for (const file of filesToAdd) {
    await git.add({ fs, dir: projectDir, filepath: file });
  }
  console.log("All files staged successfully.");
  
  // 3. Commit
  try {
    const sha = await git.commit({
      fs,
      dir: projectDir,
      message: "feat: Complete Mondal Barir Pujo (Furfura Mondal Poribar) 2026 platform with studio Dhak audio engine & responsive UI",
      author: {
        name: "Debanjan Mondal",
        email: "debanjan@furfuramondalporibar.com"
      }
    });
    console.log("Committed with SHA:", sha);
  } catch (err) {
    console.log("Commit notice:", err.message);
  }
  
  // 4. Check remote
  const remotes = await git.listRemotes({ fs, dir: projectDir });
  console.log("Existing remotes:", remotes);
  
  const hasOrigin = remotes.some(r => r.remote === 'origin');
  if (!hasOrigin) {
    await git.addRemote({
      fs,
      dir: projectDir,
      remote: 'origin',
      url: 'https://github.com/DebanjanTest/furfura_mondal_poribar.git'
    });
    console.log("Added remote origin: https://github.com/DebanjanTest/furfura_mondal_poribar.git");
  } else {
    // Update remote url if needed
    await git.deleteRemote({ fs, dir: projectDir, remote: 'origin' });
    await git.addRemote({
      fs,
      dir: projectDir,
      remote: 'origin',
      url: 'https://github.com/DebanjanTest/furfura_mondal_poribar.git'
    });
  }
  
  // 5. Test fetching or checking remote
  console.log("Testing remote connection to https://github.com/DebanjanTest/furfura_mondal_poribar.git ...");
  try {
    const remoteInfo = await git.getRemoteInfo({
      http,
      url: 'https://github.com/DebanjanTest/furfura_mondal_poribar.git'
    });
    console.log("Remote branches/refs found:", Object.keys(remoteInfo.refs || {}));
  } catch (err) {
    console.log("Remote info status:", err.message);
  }
}

main().catch(console.error);

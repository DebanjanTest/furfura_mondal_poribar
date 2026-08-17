import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';

const projectDir = path.resolve('.');

async function main() {
  console.log("Staging new files (netlify.toml, _redirects)...");
  
  const statusMatrix = await git.statusMatrix({
    fs,
    dir: projectDir,
    ignored: false
  });
  
  const filesToAdd = statusMatrix
    .filter(row => row[2] === 2 || row[2] === 0 || row[1] !== row[2])
    .map(row => row[0])
    .filter(f => !f.startsWith('node_modules') && !f.startsWith('.git') && !f.startsWith('dist'));
    
  for (const file of filesToAdd) {
    await git.add({ fs, dir: projectDir, filepath: file });
  }
  
  const sha = await git.commit({
    fs,
    dir: projectDir,
    message: "ci(netlify): Add netlify.toml and _redirects for 1-click zero-config deploy",
    author: {
      name: "Debanjan Mondal",
      email: "debanjan@furfuramondalporibar.com"
    }
  });
  console.log("Committed:", sha);
  
  const token = process.argv[2];
  if (token) {
    console.log("Pushing commit to GitHub...");
    await git.push({
      fs,
      http,
      dir: projectDir,
      remote: 'origin',
      ref: 'main',
      force: false,
      onAuth: () => ({ username: token, password: '' })
    });
    console.log("✅ Pushed netlify.toml to GitHub!");
  }
}

main().catch(console.error);

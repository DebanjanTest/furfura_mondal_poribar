import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';

const projectDir = path.resolve('.');

async function pushRepo(token) {
  if (!token) {
    console.error("No token provided!");
    process.exit(1);
  }

  console.log("Preparing push to https://github.com/DebanjanTest/furfura_mondal_poribar.git (branch: main)...");
  
  // Ensure current branch is main
  const currentBranch = await git.currentBranch({ fs, dir: projectDir });
  console.log("Current branch:", currentBranch);

  try {
    const pushResult = await git.push({
      fs,
      http,
      dir: projectDir,
      remote: 'origin',
      ref: 'main',
      force: true,
      onAuth: () => {
        return {
          username: token,
          password: ''
        };
      },
      onProgress: (evt) => {
        console.log(`[Push Progress] ${evt.phase}: ${evt.loaded}/${evt.total || '?'}`);
      }
    });

    console.log("✅ Git push succeeded!");
    console.log("Push details:", JSON.stringify(pushResult, null, 2));
  } catch (err) {
    console.warn("Attempt 1 error:", err.message);
    
    // Try fallback auth pattern (username + password)
    console.log("Retrying with OAuth token auth pattern...");
    try {
      const fallbackResult = await git.push({
        fs,
        http,
        dir: projectDir,
        remote: 'origin',
        ref: 'main',
        force: true,
        onAuth: () => {
          return {
            username: 'x-access-token',
            password: token
          };
        }
      });
      console.log("✅ Git push succeeded on fallback auth!");
      console.log("Push details:", JSON.stringify(fallbackResult, null, 2));
    } catch (err2) {
      console.error("❌ Fallback error:", err2.message);
      if (err2.data) console.error("Error data:", err2.data);
    }
  }
}

const token = process.argv[2];
pushRepo(token).catch(console.error);

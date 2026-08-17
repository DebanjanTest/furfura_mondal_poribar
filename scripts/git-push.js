import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';

const projectDir = path.resolve('.');

async function pushRepo(token = null) {
  try {
    console.log("Attempting push to origin/main...");
    const pushResult = await git.push({
      fs,
      http,
      dir: projectDir,
      remote: 'origin',
      ref: 'main',
      force: true,
      onAuth: () => {
        if (token) {
          return { username: token };
        }
        return undefined;
      }
    });
    console.log("Push result:", pushResult);
  } catch (err) {
    console.error("Push status:", err.message);
    if (err.data) console.error("Error data:", err.data);
  }
}

// Check if token passed as CLI arg or environment variable
const token = process.argv[2] || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
pushRepo(token).catch(console.error);

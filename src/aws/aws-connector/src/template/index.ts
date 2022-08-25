import fs from 'fs';
import path from 'path';

function getCFNTemplate() {
  return fs.readFileSync(path.join(__dirname, 'CFNTemplate.yml'), 'utf-8');
}

function getInstallCfn() {
  return fs.readFileSync(path.join(__dirname, 'installCfn.html'), 'utf-8');
}

export { getCFNTemplate, getInstallCfn };

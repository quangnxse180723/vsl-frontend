const fs = require('fs');
const path = require('path');
const srcDir = path.join('F:', 'sba-project', 'vsl-Frontend', 'vsl-frontend', 'src');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk(srcDir, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    
    content = content.replace(/from\s+['\"]\.\.\/data['\"]/g, "from '../constants/data'");
    content = content.replace(/from\s+['\"]\.\/data['\"]/g, "from './constants/data'");
    
    content = content.replace(/from\s+['\"]\.\.\/hook\/(.*?)['\"]/g, "from '../hooks/$1'");
    content = content.replace(/from\s+['\"]\.\/hook\/(.*?)['\"]/g, "from './hooks/$1'");
    
    content = content.replace(/from\s+['\"]\.\/layout\/(.*?)['\"]/g, "from '../layouts/$1'");
    content = content.replace(/from\s+['\"]\.\.\/components\/layout\/(.*?)['\"]/g, "from '../layouts/$1'");
    
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('Fixed imports in ' + filePath);
    }
  }
});

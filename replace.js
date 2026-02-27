const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('req.user.sub')) {
                content = content.replace(/req\.user\.sub/g, 'req.user.userId');
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

replaceInDir('./src');

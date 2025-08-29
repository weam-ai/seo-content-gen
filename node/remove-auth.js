const fs = require('fs');
const path = require('path');

// List of controller files that need authentication removed
const controllerFiles = [
  'src/modules/activity-events/activity-events.controller.ts',
  'src/modules/designations/designations.controller.ts',
  'src/modules/dashboard/dashboard.controller.ts',
  'src/modules/roles/roles.controller.ts',
  'src/modules/gemini/gemini.controller.ts',
  'src/modules/system-prompts/system-prompts.controller.ts',
  'src/modules/guidelines/guidelines.controller.ts',
  'src/modules/projects/projects.controller.ts',
  'src/modules/article/article.controller.ts',
  'src/modules/time-tracking/time-tracking.controller.ts',
  'src/modules/prompt-types/prompt-types.controller.ts',

  'src/modules/collab/collab.controller.ts',
  'src/modules/comments/comments.controller.ts',
  'src/modules/openai/openai.controller.ts',
  'src/modules/meeting-notes/meeting-note.controller.ts',
  'src/modules/article-documents/article-documents.controller.ts',
  'src/modules/chat-history/chat-history.controller.ts'
];

function removeAuthFromFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove imports
    content = content.replace(/import\s*{[^}]*JwtAuthGuard[^}]*}\s*from\s*['"][^'"]*['"];?\s*\n?/g, '');
    content = content.replace(/import\s*{[^}]*PermissionsGuard[^}]*}\s*from\s*[^;]*;\s*\n?/g, '');
    content = content.replace(/import\s*{[^}]*RolesGuard[^}]*}\s*from\s*[^;]*;\s*\n?/g, '');
    content = content.replace(/import\s*{[^}]*Permissions[^}]*}\s*from\s*[^;]*;\s*\n?/g, '');
    content = content.replace(/import\s*{[^}]*Roles[^}]*}\s*from\s*[^;]*;\s*\n?/g, '');
    
    // Remove UseGuards from imports
    content = content.replace(/(import\s*{[^}]*),\s*UseGuards([^}]*})/g, '$1$2');
    content = content.replace(/(import\s*{)\s*UseGuards,\s*([^}]*})/g, '$1 $2');
    content = content.replace(/,\s*UseGuards\s*}/g, ' }');
    content = content.replace(/{\s*UseGuards\s*}/g, '{}');
    
    // Remove @UseGuards decorators
    content = content.replace(/@UseGuards\([^)]*\)\s*\n?/g, '');
    
    // Remove @Permissions decorators
    content = content.replace(/@Permissions\([^)]*\)\s*\n?/g, '');
    
    // Remove @Roles decorators
    content = content.replace(/@Roles\([^)]*\)\s*\n?/g, '');
    
    // Clean up empty import lines
    content = content.replace(/import\s*{\s*}\s*from\s*[^;]*;\s*\n?/g, '');
    
    // Clean up multiple empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Removed authentication from ${filePath}`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Process all controller files
controllerFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    removeAuthFromFile(fullPath);
  } else {
    console.log(`⚠️  File not found: ${fullPath}`);
  }
});

console.log('\n🎉 Authentication removal completed!');
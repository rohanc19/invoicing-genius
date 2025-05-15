const fs = require('fs');
const path = require('path');

// Function to recursively find files with specific extensions
function findFiles(dir, extensions) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively search directories
      results = results.concat(findFiles(filePath, extensions));
    } else {
      // Check if file has one of the specified extensions
      const ext = path.extname(file).toLowerCase();
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// Function to fix paths in a file
function fixPathsInFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace absolute paths with relative paths
    // This is a simple replacement and might need to be adjusted based on your specific files
    content = content.replace(/"\//g, '"./');
    content = content.replace(/'\//g, '\'./');
    content = content.replace(/url\(\//g, 'url(./');
    
    // Write the modified content back to the file
    fs.writeFileSync(filePath, content);
    console.log(`Fixed paths in: ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
  }
}

// Main function
function main() {
  const buildDir = path.join(__dirname, 'build');
  
  // Find all JS and CSS files
  const extensions = ['.js', '.css'];
  const files = findFiles(buildDir, extensions);
  
  console.log(`Found ${files.length} files to process`);
  
  // Fix paths in each file
  files.forEach(fixPathsInFile);
  
  console.log('Path fixing complete!');
}

// Run the main function
main();

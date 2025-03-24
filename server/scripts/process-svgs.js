const fs = require('fs');
const path = require('path');
const { transform } = require('@svgr/core');

// Change these paths according to your project structure:
const inputDir = path.resolve(__dirname, 'client/public/assets/svgs'); // Folder with original SVGs
const outputDir = path.resolve(__dirname, 'client/src/assets/svgs');     // Folder to output React components

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.readdir(inputDir, (err, files) => {
  if (err) {
    console.error('Error reading input directory:', err);
    process.exit(1);
  }

  files.forEach(file => {
    if (file.endsWith('.svg')) {
      const filePath = path.join(inputDir, file);
      fs.readFile(filePath, 'utf8', async (err, svgContent) => {
        if (err) {
          console.error(`Error reading file ${file}:`, err);
          return;
        }

        try {
          // Clean the SVG:
          // Replace all occurrences of vectornator:* with data-vectornator-*
          // and remove the xmlns:vectornator declaration.
          const cleanedSvg = svgContent
            .replace(/vectornator:([a-zA-Z0-9_-]+)/g, 'data-vectornator-$1')
            .replace(/xmlns:vectornator="[^"]*"/g, '');

          // Transform the SVG into a React component using SVGR.
          // Using jsxRuntime: 'classic' ensures that React is imported.
          const jsCode = await transform(
            cleanedSvg,
            {
              icon: false,
              jsxRuntime: 'classic',
              plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx', '@svgr/plugin-prettier']
            },
            {
              componentName: path.basename(file, '.svg'),
              filePath: filePath,
              caller: { name: 'my-svgr-tool' } // Optional: useful for SVGR plugins interoperability.
            }
          );

          // Write the generated component to the output directory with a .jsx extension.
          const outputFileName = path.join(outputDir, file.replace('.svg', '.jsx'));
          fs.writeFile(outputFileName, jsCode, 'utf8', err => {
            if (err) {
              console.error(`Error writing file ${outputFileName}:`, err);
            } else {
              console.log(`Processed ${file} into ${outputFileName}`);
            }
          });
        } catch (error) {
          console.error(`Error transforming file ${file}:`, error);
        }
      });
    }
  });
});

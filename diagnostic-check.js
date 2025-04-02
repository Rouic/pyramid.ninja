// Create a simple script to check Tailwind CSS processing
// Save as diagnostic-check.js and run with: node diagnostic-check.js
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwindcss = require('@tailwindcss/postcss');
const autoprefixer = require('autoprefixer');
const postcssImport = require('postcss-import');

// Read your CSS file
const css = fs.readFileSync(path.resolve('./src/styles/globals.css'), 'utf8');

// Process with PostCSS and Tailwind
postcss([
  postcssImport,
  tailwindcss,
  autoprefixer
])
  .process(css, { from: './src/styles/globals.css', to: './diagnostic-output.css' })
  .then(result => {
    // Write the processed CSS to a file for inspection
    fs.writeFileSync('./diagnostic-output.css', result.css);
    console.log('✅ CSS processed successfully! Check diagnostic-output.css');
    
    // Count utility classes as a sanity check
    const bgColorClasses = (result.css.match(/\.bg-[a-z]+-[0-9]+/g) || []).length;
    const textClasses = (result.css.match(/\.text-[a-z]+-[0-9]+/g) || []).length;
    const paddingClasses = (result.css.match(/\.p[xy]?-[0-9]+/g) || []).length;
    
    console.log(`Found approximately:`);
    console.log(`- ${bgColorClasses} background color classes`);
    console.log(`- ${textClasses} text color classes`);
    console.log(`- ${paddingClasses} padding classes`);
    
    if (bgColorClasses === 0 && textClasses === 0 && paddingClasses === 0) {
      console.log('⚠️ No utility classes found! This suggests Tailwind is not generating utilities.');
    }
  })
  .catch(error => {
    console.error('❌ Error processing CSS:', error);
  });
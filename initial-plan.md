# **reMarkable Daily Puzzle Generator**

## **Project Architecture & Technical Plan**

A fully automated, on-demand puzzle generation system built in Node.js and TypeScript. çThe system generates separate 3-page PDFs for each puzzle type (e.g., one for Word Search, one for Sudoku) and pushes them directly to their own dedicated folders on the reMarkable e-ink tablet via the reMarkable Cloud API.

## **1\. System Architecture**

> * **Trigger Mechanism:** Android device using the 'HTTP Request Shortcuts' app to fire a POST webhook.  
> * **Compute / Hosting:** GitHub Actions (workflow\_dispatch trigger) acting as a free, serverless runner.  
> * **Core Logic:** Node.js \+ TypeScript script utilizing pdfkit for PDF generation and sudoku-gen for Sudoku logic.  
> * **Delivery & Routing:** Direct push to the reMarkable Cloud, with routing logic to upload the Word Search PDF into a \`/Word Search\` directory on the tablet, and the Sudoku PDF into a \`/Sudoku\` directory on the tablet.

## **2\. Document Layout Strategy (Per Puzzle)**

Instead of combining them, the system creates an individual 3-page PDF for each puzzle generated.

> * **Page 1: The Puzzle**  
  * The full-page Word Search grid OR the full-page Sudoku grid.  
> * **Page 2: The Filler**  
  * A blank page with centered text (e.g., "Answer Key on Next Page") to prevent accidentally swiping directly to the solution.  
> * **Page 3: Answer Key**  
  * The highlighted Word Search solution OR the completed Sudoku grid.

## **3\. Development Plan (Antigravity CLI / Neovim)**

### **Phase 1: Project Scaffolding**

> 1. Initialize a Node.js TypeScript project.  
> 2. Install necessary dependencies: npm install pdfkit sudoku-gen and their types.

### **Phase 2: PDF Generation Logic**

> 1. **Word Search Module:** Generate a 15x15 grid and create the 3-page PDF.  
> 2. **Sudoku Module:** Generate a 9x9 grid using \`sudoku-gen\` and create the 3-page PDF.

### **Phase 3: Cloud Delivery & Device Routing**

> 1. Obtain the reMarkable API device token.  
> 2. Configure the upload script to define the target directory on the reMarkable (e.g., upload \`wordsearch.pdf\` to the \`/Puzzles/Word Search/\` folder, and \`sudoku.pdf\` to \`/Puzzles/Sudoku/\`).  
> 3. Create the GitHub Actions workflow configuration.

### **Phase 4: On-Demand Trigger Configuration**

> 1. Set up the HTTP Request Shortcuts app on Android to trigger the GitHub webhook.

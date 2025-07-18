// content.js
// handles professor name extraction and formatting
// passes them to background script

// Import our utility modules
import { extractAllProfessorNames } from './utils/extractors.js';
import { processAllNames } from './utils/formatters.js';

// Function to run the extraction and formatting process
function runExtraction() {
  // Extract all professor names using our utility function
  const rawProfessorNames = extractAllProfessorNames();
  console.log('Raw extracted professor names:', rawProfessorNames);
  
  // Format the names into a standard structure
  const formattedProfessors = processAllNames(rawProfessorNames);
  console.log('Formatted professor data:', formattedProfessors);
  
  // Send the formatted professor data to the background script
  chrome.runtime.sendMessage({
    action: 'processProfessors',
    professors: formattedProfessors
  }, response => {
    console.log('Response from background script:', response);
  });
}

// Wrap extension functionality in a try-catch to handle context invalidation gracefully
try {
  // Track the last processed nodes to avoid reprocessing
  const processedNodes = new WeakSet();
  
  // Run the extraction when the page is fully loaded
  window.addEventListener('load', () => {
    console.log('Notre Dame professor extraction script running...');
    runExtraction();
  });
  
  // Set up the MutationObserver to detect both URL changes and DOM content changes
  let lastUrl = location.href;
  const observer = new MutationObserver((mutations) => {
    try {
      // Check if URL changed
      const url = location.href;
      let urlChanged = false;
      
      if (url !== lastUrl) {
        lastUrl = url;
        console.log('URL changed, extracting professors again...');
        urlChanged = true;
        runExtraction();
      }
      
      // Check for new professor elements in the DOM
      if (!urlChanged) { // Skip if URL changed since we already ran extraction
        let hasNewProfessorElements = false;
        
        // Look for new nodes that might contain professor information
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
              // Skip non-element nodes
              if (node.nodeType !== Node.ELEMENT_NODE) continue;
              
              // Skip already processed nodes
              if (processedNodes.has(node)) continue;
              
              // Mark node as processed
              processedNodes.add(node);
              
              // Check if this node or its children might contain professor information
              if (
                node.querySelector('.result__flex--9.text--right') ||
                node.querySelector('.result__flex--9.text--right.rmp-professor-name') ||
                node.querySelector('.instructor-detail') ||
                node.querySelector('.calendar_viewing__instr') ||
                node.classList?.contains('result__flex--9') ||
                node.classList?.contains('instructor-detail') ||
                node.classList?.contains('calendar_viewing__instr')
              ) {
                hasNewProfessorElements = true;
                break;
              }
            }
          }
          
          if (hasNewProfessorElements) break;
        }
        
        // Only run extraction if we found potential new professor elements
        if (hasNewProfessorElements) {
          console.log('New professor elements detected, extracting professors...');
          runExtraction();
        }
      }
    } catch (error) {
      // If extension context is invalidated, stop the observer
      if (error.message.includes('Extension context invalidated')) {
        observer.disconnect();
        console.log('Extension context invalidated, observer stopped');
      } else {
        console.error('Error in MutationObserver:', error);
      }
    }
  });
  
  // Start observing document for both URL changes and DOM content changes
  observer.observe(document, { subtree: true, childList: true });
  
} catch (error) {
  console.error('Error initializing Notre Dame professor extraction:', error);
}

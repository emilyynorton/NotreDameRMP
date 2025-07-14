// content-bundle.js
// bundled version of content script with imports included
// to be injected into chrome webpage

// ==== BEGIN extractors.js ====
// Functions to extract professor names from various HTML structures

/**
 * Extracts professor names from spans with class "result__flex--9 text--right"
 * @returns {Set} Set of professor names
 */
function extractFromResultFlex() {
  const professorNames = new Set();
  const instructorSpans = document.querySelectorAll('span.result__flex--9.text--right');
  
  instructorSpans.forEach(span => {
    // Case 1: Regular format with "Instructor:" in the text content
    if (span.textContent.includes('Instructor:')) {
      const instructorText = span.textContent.trim();
      const name = instructorText.substring(instructorText.indexOf('Instructor:') + 'Instructor:'.length).trim();
      if (name && name !== 'TBD' && name !== 'Staff' && name !== 'TBA') {
        professorNames.add(name);
      }
    }
    
    // Case 2: "Instructor:" in sr-only span with professor name as text node
    const srOnlySpan = span.querySelector('.sr-only');
    if (srOnlySpan && srOnlySpan.textContent.includes('Instructor:')) {
      // Extract all text nodes that follow the sr-only span
      let professorName = '';
      let foundSrOnly = false;
      
      // Loop through all child nodes
      for (const node of span.childNodes) {
        if (foundSrOnly && node.nodeType === Node.TEXT_NODE) {
          professorName += node.textContent;
        }
        
        if (node === srOnlySpan) {
          foundSrOnly = true;
        }
      }
      
      // Clean up the extracted name
      professorName = professorName.trim();
      professorName = professorName.replace(/^"\s*/, '').replace(/\s*"$/, ''); // Remove quotes if present
      
      if (professorName && professorName !== 'TBD' && professorName !== 'Staff' && professorName !== 'TBA') {
        professorNames.add(professorName);
      }
    }
  });
  
  return professorNames;
}

/**
 * Extracts professor names from divs with class "instructor-detail"
 * @returns {Set} Set of professor names
 */
function extractFromInstructorDetail() {
  const professorNames = new Set();
  const instructorDetailDivs = document.querySelectorAll('div.instructor-detail');
  
  instructorDetailDivs.forEach(div => {
    const name = div.textContent.trim();
    if (name && name !== 'TBD' && name !== 'Staff' && name !== 'TBA') {
      professorNames.add(name);
    }
  });
  
  return professorNames;
}

/**
 * Extracts professor names from divs with class "calendar_viewing__instr"
 * @returns {Set} Set of professor names
 */
function extractFromCalendarViewing() {
  const professorNames = new Set();
  const calendarInstrDivs = document.querySelectorAll('div.calendar_viewing__instr');
  
  calendarInstrDivs.forEach(div => {
    const name = div.textContent.trim();
    if (name && name !== 'TBD' && name !== 'Staff' && name !== 'TBA') {
      professorNames.add(name);
    }
  });
  
  return professorNames;
}

/**
 * Extracts professor names from divs with class "course-section-instr"
 * @returns {Set} Set of professor names
 */
function extractFromCourseSectionInstr() {
  const professorNames = new Set();
  const courseSectionInstrDivs = document.querySelectorAll('div.course-section-instr');
  
  courseSectionInstrDivs.forEach(div => {
    // Look for the header text span
    const headerTextSpan = div.querySelector('.header-text');
    if (headerTextSpan && headerTextSpan.textContent.includes('Instructor:')) {
      // Extract all text nodes that follow the header-text span
      let professorName = '';
      let foundHeaderSpan = false;
      
      // Loop through all child nodes
      for (const node of div.childNodes) {
        if (foundHeaderSpan && node.nodeType === Node.TEXT_NODE) {
          professorName += node.textContent;
        }
        
        if (node === headerTextSpan) {
          foundHeaderSpan = true;
        }
      }
      
      // Clean up the extracted name
      professorName = professorName.trim();
      professorName = professorName.replace(/^"|"$/g, ''); // Remove quotes if present
      
      if (professorName && professorName !== 'TBD' && professorName !== 'Staff' && professorName !== 'TBA') {
        professorNames.add(professorName);
      }
    }
  });
  
  return professorNames;
}

/**
 * Extracts professor names from divs with class "course-section-instructorresult-html"
 * @returns {Set} Set of professor names
 */
function extractFromCourseSectionInstructorResult() {
  const professorNames = new Set();
  const instructorResultDivs = document.querySelectorAll('div.course-section-instructorresult-html');
  
  instructorResultDivs.forEach(div => {
    // Look for the header text span
    const headerTextSpan = div.querySelector('.header-text');
    if (headerTextSpan && headerTextSpan.textContent.includes('Instructor:')) {
      // Extract all text nodes that follow the header-text span
      let professorName = '';
      let foundHeaderSpan = false;
      
      // Loop through all child nodes
      for (const node of div.childNodes) {
        if (foundHeaderSpan && node.nodeType === Node.TEXT_NODE) {
          professorName += node.textContent;
        }
        
        if (node === headerTextSpan) {
          foundHeaderSpan = true;
        }
      }
      
      // Clean up the extracted name
      professorName = professorName.trim();
      professorName = professorName.replace(/^"|"$/g, ''); // Remove quotes if present
      
      if (professorName && professorName !== 'TBD' && professorName !== 'Staff' && professorName !== 'TBA') {
        professorNames.add(professorName);
      }
    }
  });
  
  return professorNames;
}

/**
 * Extracts all professor names from all possible HTML structures
 * @returns {Array} Array of professor names
 */
function extractAllProfessorNames() {
  const professorNames = new Set();
  
  // Combine results from all extractors
  const fromResultFlex = extractFromResultFlex();
  const fromInstructorDetail = extractFromInstructorDetail();
  const fromCalendarViewing = extractFromCalendarViewing();
  const fromCourseSectionInstr = extractFromCourseSectionInstr();
  const fromCourseSectionInstructorResult = extractFromCourseSectionInstructorResult();
  
  // Add all names to the combined set
  fromResultFlex.forEach(name => professorNames.add(name));
  fromInstructorDetail.forEach(name => professorNames.add(name));
  fromCalendarViewing.forEach(name => professorNames.add(name));
  fromCourseSectionInstr.forEach(name => professorNames.add(name));
  fromCourseSectionInstructorResult.forEach(name => professorNames.add(name));
  
  return Array.from(professorNames);
}

// ==== END extractors.js ====

// ==== BEGIN formatters.js ====
// Functions to standardize professor name formats

/**
 * Standardizes a professor's name for RateMyProfessor searching
 * Handles various formats like "Lastname, Firstname", "F. Lastname", etc.
 * 
 * @param {string} name - The raw professor name
 * @returns {object} - Object containing firstName, lastName, and fullName
 */
function standardizeNameFormat(name) {
  // Remove any extra whitespace
  name = name.trim();
  
  // If empty, return null
  if (!name) {
    return null;
  }
  
  let firstName = "";
  let lastName = "";
  
  // Handle "Lastname, Firstname" format
  if (name.includes(',')) {
    const parts = name.split(',').map(part => part.trim());
    lastName = parts[0];
    firstName = parts[1];
  } 
  // Handle "F. Lastname" format (like "J. Rodriguez")
  else if (name.includes('.')) {
    const parts = name.split('.');
    firstName = parts[0].trim(); // This will be just the initial
    lastName = parts.slice(1).join('.').trim();
  }
  // Handle full "Firstname Lastname" format
  else if (name.includes(' ')) {
    const parts = name.split(' ');
    firstName = parts[0];
    lastName = parts.slice(1).join(' ');
  }
  // Just a single name, assume it's the last name
  else {
    lastName = name;
  }
  
  // Create standardized full name (Firstname Lastname)
  const fullName = `${firstName} ${lastName}`.trim();
  
  return {
    firstName,
    lastName,
    fullName
  };
}

/**
 * Processes an array of professor names to standardized format
 * 
 * @param {string[]} names - Array of raw professor names
 * @returns {object[]} - Array of standardized name objects
 */
function processAllNames(names) {
  return names
    .map(name => standardizeNameFormat(name))
    .filter(nameObj => nameObj !== null);
}

// ==== END formatters.js ====

// ==== BEGIN content.js ====
// Main content script that runs on Notre Dame class search pages

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
            
            // Mark this node as processed
            processedNodes.add(node);
            
            // Check if this node or its children might contain professor information
            if (
              node.querySelector('.result__flex--9.text--right') ||
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
    console.error('Error in MutationObserver:', error);
  }
});

// Start observing document for both URL changes and DOM content changes
observer.observe(document, { subtree: true, childList: true });

// Listen for messages from background script (for receiving processed data)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'professorsProcessed') {
    console.log('Received processed professor data:', request.professors);
    // When we receive processed professor data, update our local cache
    setupTooltips(request.professors);
  }
});

// Create tooltip functionality
let tooltip = null;
let professorData = {};
let currentHoveredElement = null;
let tooltipHovered = false;

// Initialize tooltip system
function setupTooltips(professors = null) {
  console.log('Setting up RMP tooltips');
  
  // If we received new data, update our cache
  if (professors && Array.isArray(professors)) {
    professors.forEach(prof => {
      if (prof.fullName) {
        professorData[prof.fullName] = prof;
      }
    });
    console.log(`Updated professor data cache with ${professors.length} professors`);
  }
  
  // Create tooltip element if it doesn't exist
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'rmp-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
    
    // Add mouse enter/leave event listeners to the tooltip
    tooltip.addEventListener('mouseenter', () => {
      tooltipHovered = true;
    });
    
    tooltip.addEventListener('mouseleave', () => {
      tooltipHovered = false;
      tooltip.style.display = 'none';
      currentHoveredElement = null; // Clear the current hovered element
    });
    
    // Add a small indicator that the extension is active
    const indicator = document.createElement('div');
    indicator.style.position = 'fixed';
    indicator.style.bottom = '5px';
    indicator.style.right = '5px';
    indicator.style.backgroundColor = 'rgba(12, 35, 64, 0.7)'; // Notre Dame blue
    indicator.style.color = 'white';
    indicator.style.padding = '3px 6px';
    indicator.style.fontSize = '10px';
    indicator.style.borderRadius = '3px';
    indicator.style.zIndex = '10000';
    indicator.textContent = 'ND RMP Active';
    document.body.appendChild(indicator);
  }
  
  // First load any existing professor data from storage
  chrome.storage.local.get('ndProfessors', (result) => {
    if (result.ndProfessors && Array.isArray(result.ndProfessors)) {
      result.ndProfessors.forEach(prof => {
        if (prof.fullName) {
          professorData[prof.fullName] = prof;
        }
      });
      console.log(`Loaded ${result.ndProfessors.length} professors from storage`);
    }
    
    // Attach hover listeners to professor elements
    attachTooltipListeners();
  });
}

// Attach tooltip listeners to all professor elements
function attachTooltipListeners() {
  // Result Flex professor names
  document.querySelectorAll('span.result__flex--9.text--right').forEach(span => {
    // Force attach to ALL result__flex--9 elements with Instructor text regardless of previous attachment
    if (span.textContent.includes('Instructor:')) {
      // Add a debug class to track which elements we've processed
      if (span.hasAttribute('data-rmp-attached')) {
        span.setAttribute('data-rmp-reattached', 'true');
      }
      
      // Always set these attributes and event listeners to ensure consistency
      span.setAttribute('data-rmp-attached', 'true');
      span.style.cursor = 'help';
      span.classList.add('rmp-professor-name');
      
      // Remove existing event listeners to prevent duplicates
      span.removeEventListener('mouseenter', handleProfessorHover);
      span.removeEventListener('mouseleave', handleProfessorLeave);
      
      // Add new event listeners
      span.addEventListener('mouseenter', handleProfessorHover);
      span.addEventListener('mouseleave', handleProfessorLeave);
    }
  });
  
  // Instructor Detail professor names
  document.querySelectorAll('div.instructor-detail').forEach(div => {
    const name = div.textContent.trim();
    if (name && name !== 'TBD' && name !== 'Staff' && name !== 'TBA' && !div.hasAttribute('data-rmp-attached')) {
      div.setAttribute('data-rmp-attached', 'true');
      div.style.cursor = 'help';
      div.classList.add('rmp-professor-name');
      div.addEventListener('mouseenter', handleProfessorHover);
      div.addEventListener('mouseleave', handleProfessorLeave);
    }
  });
  
  // Calendar Viewing professor names
  document.querySelectorAll('div.calendar_viewing__instr').forEach(div => {
    const name = div.textContent.trim();
    if (name && name !== 'TBD' && name !== 'Staff' && name !== 'TBA' && !div.hasAttribute('data-rmp-attached')) {
      div.setAttribute('data-rmp-attached', 'true');
      div.style.cursor = 'help';
      div.classList.add('rmp-professor-name');
      div.addEventListener('mouseenter', handleProfessorHover);
      div.addEventListener('mouseleave', handleProfessorLeave);
    }
  });
  
  // Course Section Instructor names
  document.querySelectorAll('div.course-section-instr').forEach(div => {
    if (!div.hasAttribute('data-rmp-attached')) {
      const headerTextSpan = div.querySelector('.header-text');
      if (headerTextSpan && headerTextSpan.textContent.includes('Instructor:')) {
        // Extract text nodes to check if there's a valid professor name
        let hasValidName = false;
        for (const node of div.childNodes) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() && 
              !['TBD', 'Staff', 'TBA'].includes(node.textContent.trim())) {
            hasValidName = true;
            break;
          }
        }
        
        if (hasValidName) {
          div.setAttribute('data-rmp-attached', 'true');
          div.style.cursor = 'help';
          div.classList.add('rmp-professor-name');
          div.addEventListener('mouseenter', handleProfessorHover);
          div.addEventListener('mouseleave', handleProfessorLeave);
        }
      }
    }
  });
  
  // Course Section Instructor Result HTML names
  document.querySelectorAll('div.course-section-instructorresult-html').forEach(div => {
    // Force attach to ALL course-section-instructorresult-html elements regardless of previous attachment
    // This ensures we don't miss any elements due to timing or DOM updates
    const headerTextSpan = div.querySelector('.header-text');
    if (headerTextSpan && headerTextSpan.textContent.includes('Instructor:')) {
      // Extract text nodes to check if there's a valid professor name
      let hasValidName = false;
      let professorName = '';
      
      // Loop through all child nodes to verify there's a valid name
      for (const node of div.childNodes) {
        if (node !== headerTextSpan && node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.trim();
          if (text && !['TBD', 'Staff', 'TBA'].includes(text)) {
            hasValidName = true;
            professorName += text;
          }
        }
      }
      
      // Clean up and verify the name
      professorName = professorName.trim().replace(/^"|"$/g, '');
      
      if (hasValidName && professorName) {
        // Add a debug class to track which elements we've processed
        if (div.hasAttribute('data-rmp-attached')) {
          div.setAttribute('data-rmp-reattached', 'true');
        }
        
        // Always set these attributes and event listeners to ensure consistency
        div.setAttribute('data-rmp-attached', 'true');
        div.style.cursor = 'help';
        div.classList.add('rmp-professor-name');
        
        // Remove existing event listeners to prevent duplicates
        div.removeEventListener('mouseenter', handleProfessorHover);
        div.removeEventListener('mouseleave', handleProfessorLeave);
        
        // Add new event listeners
        div.addEventListener('mouseenter', handleProfessorHover);
        div.addEventListener('mouseleave', handleProfessorLeave);
      }
    }
  });
}

// Handle mouse enter on professor name
function handleProfessorHover(event) {
  const element = event.currentTarget;
  currentHoveredElement = element;
  console.log('Hover detected on professor element:', element);
  
  // Extract professor name
  let professorName;
  
  if (element.classList.contains('result__flex--9')) {
    // More aggressive extraction for result__flex--9 elements
    console.log('Processing result__flex--9 element:', element.outerHTML);
    
    // First check if this has an sr-only span
    const srOnlySpan = element.querySelector('.sr-only');
    if (srOnlySpan && srOnlySpan.textContent.includes('Instructor:')) {
      console.log('Found sr-only span with Instructor text');
      
      // Extract all text from this element that is NOT in the sr-only span
      let name = '';
      let extractedFromNode = false;
      
      // Clone element content to avoid DOM manipulation issues
      const elementClone = element.cloneNode(true);
      
      // First remove the sr-only span from our clone to make extraction cleaner
      const cloneSrOnly = elementClone.querySelector('.sr-only');
      if (cloneSrOnly) cloneSrOnly.remove();
      
      // Now extract text from the remaining content
      name = elementClone.textContent.trim();
      extractedFromNode = true;
      
      // If we failed to extract from nodes, fall back to using substring
      if (!extractedFromNode || !name) {
        const fullText = element.textContent.trim();
        name = fullText.substring(fullText.indexOf('Instructor:') + 'Instructor:'.length).trim();
        console.log('Used fallback extraction, got:', name);
      }
      
      // Clean up the extracted name
      professorName = name.trim();
      professorName = professorName.replace(/^"\s*/, '').replace(/\s*"$/, ''); // Remove quotes if present
      console.log('Extracted professor name:', professorName);
    } else {
      // Regular case: Instructor: text is part of the element's text content
      const text = element.textContent.trim();
      console.log('Processing regular result__flex--9, text content:', text);
      if (text.includes('Instructor:')) {
        professorName = text.substring(text.indexOf('Instructor:') + 'Instructor:'.length).trim();
      } else {
        professorName = text;
      }
      console.log('Extracted professor name:', professorName);
    }
  } else if (element.classList.contains('course-section-instr') || element.classList.contains('course-section-instructorresult-html')) {
    // Handle course-section-instr and course-section-instructorresult-html elements
    const headerTextSpan = element.querySelector('.header-text');
    if (headerTextSpan && headerTextSpan.textContent.includes('Instructor:')) {
      // Extract all text nodes that follow the header-text span
      let name = '';
      let foundHeaderSpan = false;
      
      // Loop through all child nodes
      for (const node of element.childNodes) {
        if (foundHeaderSpan && node.nodeType === Node.TEXT_NODE) {
          name += node.textContent;
        }
        
        if (node === headerTextSpan) {
          foundHeaderSpan = true;
        }
      }
      
      // Clean up the extracted name
      professorName = name.trim();
      professorName = professorName.replace(/^"\s*/, '').replace(/\s*"$/, ''); // Remove quotes if present
    } else {
      professorName = element.textContent.trim();
    }
  } else {
    // Default case for other element types
    professorName = element.textContent.trim();
  }
  
  if (!professorName || professorName === 'TBD' || professorName === 'Staff' || professorName === 'TBA') {
    return;
  }
  
  console.log('Hovering on professor:', professorName);
  
  // Position tooltip near the element
  const rect = element.getBoundingClientRect();
  tooltip.style.top = (window.scrollY + rect.bottom + 5) + 'px';
  tooltip.style.left = (window.scrollX + rect.left) + 'px';
  
  // Check if we already have data for this professor
  if (professorName in professorData) {
    const professor = professorData[professorName];
    
    if (professor.found) {
      // Show tooltip with existing data
      tooltip.innerHTML = `
        <h3>${professor.fullName || professorName}</h3>
        ${professor.rmpData.department ? `<div class="rmp-department">${professor.rmpData.department}</div>` : ''}
        <div class="rmp-rating">
          <span class="rmp-stars">${getRatingStars(professor.rating)}</span>
          <span class="rmp-rating-value">${professor.rating ? professor.rating + '/5' : 'No rating'}</span>
        </div>
        <div class="rmp-details">
          <p><strong>${professor.numRatings}</strong> ${professor.numRatings === 1 ? 'rating' : 'ratings'}</p>
          ${professor.difficulty ? `<p>Difficulty: <strong>${professor.difficulty}</strong>/5</p>` : ''}
          ${professor.wouldTakeAgain ? `<p>Would take again: <strong>${professor.wouldTakeAgain}%</strong></p>` : ''}
        </div>
        ${professor.rmpData.legacyId ? `<a href="https://www.ratemyprofessors.com/professor/${professor.rmpData.legacyId}" target="_blank">View on RateMyProfessors</a>` : ''}
      `;
    } else {
      // We know this professor doesn't have ratings
      tooltip.innerHTML = `
        <h3>${professorName}</h3>
        <p>No ratings found on RateMyProfessors</p>
      `;
    }
  } else {
    // We don't have data yet, show loading and request it
    tooltip.innerHTML = `
      <h3>${professorName}</h3>
      <div class="loading-spinner"></div>
      <p>Loading RateMyProfessor data...</p>
    `;
    
    // Add a variable to track if extension is in invalid state
    if (window.ndExtensionInvalidated) {
      tooltip.innerHTML = `
        <h3>${professorName}</h3>
        <p>Extension needs to be reloaded</p>
        <button id="nd-refresh-page-btn" style="background: #0d6efd; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Refresh Page</button>
      `;
      
      // Add event listener to refresh button
      setTimeout(() => {
        const refreshBtn = document.getElementById('nd-refresh-page-btn');
        if (refreshBtn) {
          refreshBtn.addEventListener('click', () => {
            window.location.reload();
          });
        }
      }, 100);
      
      return;
    }
    
    // Request data from the background script with error handling
    try {
      chrome.runtime.sendMessage({
        action: 'searchProfessor',
        professorName: professorName
      }, response => {
        // Handle chrome.runtime.lastError which indicates extension context invalidation
        if (chrome.runtime.lastError) {
          console.error('Extension error:', chrome.runtime.lastError.message);
          window.ndExtensionInvalidated = true;
          tooltip.innerHTML = `
            <h3>${professorName}</h3>
            <p>Extension needs to be reloaded</p>
            <button id="nd-refresh-page-btn" style="background: #0d6efd; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Refresh Page</button>
          `;
          
          // Add event listener to refresh button
          setTimeout(() => {
            const refreshBtn = document.getElementById('nd-refresh-page-btn');
            if (refreshBtn) {
              refreshBtn.addEventListener('click', () => {
                window.location.reload();
              });
            }
          }, 100);
          
          return;
        }
        
        // Check if we have a valid response (could be undefined if extension context is invalid)
        if (!response) {
          window.ndExtensionInvalidated = true;
          tooltip.innerHTML = `
            <h3>${professorName}</h3>
            <p>Extension needs to be reloaded</p>
            <button id="nd-refresh-page-btn" style="background: #0d6efd; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Refresh Page</button>
          `;
          
          // Add event listener to refresh button
          setTimeout(() => {
            const refreshBtn = document.getElementById('nd-refresh-page-btn');
            if (refreshBtn) {
              refreshBtn.addEventListener('click', () => {
                window.location.reload();
              });
            }
          }, 100);
          
          return;
        }
        
        // Make sure we're still hovering over the same element
        if (currentHoveredElement !== element) return;
      
        if (response && response.success) {
          const profData = response.professor;
          // Create a standardized professor object
          const prof = {
            fullName: professorName,
            rmpData: profData,
            rating: profData.avgRatingRounded || null,
            numRatings: profData.numRatings || 0,
          difficulty: profData.avgDifficultyRounded || null,
          wouldTakeAgain: profData.wouldTakeAgainPercentRounded || null,
          found: true
        };
        
        // Save to our cache
        professorData[professorName] = prof;
        
        // Save to Chrome storage
        chrome.storage.local.get('ndProfessors', (result) => {
          const allProfs = result.ndProfessors || [];
          allProfs.push(prof);
          chrome.storage.local.set({ 'ndProfessors': allProfs });
        });
        
        // Update tooltip
        tooltip.innerHTML = `
          <h3>${prof.fullName}</h3>
          ${prof.rmpData.department ? `<div class="rmp-department">${prof.rmpData.department}</div>` : ''}
          <div class="rmp-rating">
            <span class="rmp-stars">${getRatingStars(prof.rating)}</span>
            <span class="rmp-rating-value">${prof.rating ? prof.rating + '/5' : 'No rating'}</span>
          </div>
          <div class="rmp-details">
            <p><strong>${prof.numRatings}</strong> ${prof.numRatings === 1 ? 'rating' : 'ratings'}</p>
            ${prof.difficulty ? `<p>Difficulty: <strong>${prof.difficulty}</strong>/5</p>` : ''}
            ${prof.wouldTakeAgain ? `<p>Would take again: <strong>${prof.wouldTakeAgain}%</strong></p>` : ''}
          </div>
          ${prof.rmpData.legacyId ? `<a href="https://www.ratemyprofessors.com/professor/${prof.rmpData.legacyId}" target="_blank">View on RateMyProfessors</a>` : ''}
        `;
      } else {
        // Not found on RMP
        tooltip.innerHTML = `
          <h3>${professorName}</h3>
          <p>No ratings found on RateMyProfessors</p>
        `;
        
        // Save this negative result
        const notFoundProf = {
          fullName: professorName,
          found: false
        };
        
        // Save to our cache
        professorData[professorName] = notFoundProf;
        
        // Save to Chrome storage
        chrome.storage.local.get('ndProfessors', (result) => {
          const allProfs = result.ndProfessors || [];
          allProfs.push(notFoundProf);
          chrome.storage.local.set({ 'ndProfessors': allProfs });
        });
      }
    });
    } catch (error) {
      // Handle extension context invalidated errors
      console.error('Extension error:', error);
      tooltip.innerHTML = `
        <h3>${professorName}</h3>
        <p>Error: ${error.message || 'Extension error'}</p>
        <small>Try refreshing the page</small>
      `;
    }
  }
  
  // Show the tooltip
  tooltip.style.display = 'block';
}

// Handle mouse leave from professor name
function handleProfessorLeave() {
  // Instead of hiding immediately, we'll wait to see if mouse enters the tooltip
  setTimeout(() => {
    if (!tooltipHovered) {
      tooltip.style.display = 'none';
      currentHoveredElement = null; // Clear the current hovered element
    }
  }, 200); // Slightly longer timeout for better user experience
}

// Helper function to generate star rating display using Font Awesome icons
function getRatingStars(rating) {
  if (!rating) return '<span class="stars"><i class="fa fa-star-o"></i><i class="fa fa-star-o"></i><i class="fa fa-star-o"></i><i class="fa fa-star-o"></i><i class="fa fa-star-o"></i></span>';
  
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  
  let starsHtml = '<span class="stars">';
  
  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fa fa-star"></i>';
  }
  
  // Add half star if needed
  if (halfStar) {
    starsHtml += '<i class="fa fa-star-half-o"></i>';
  }
  
  // Add empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<i class="fa fa-star-o"></i>';
  }
  
  starsHtml += '</span>';
  return starsHtml;
}

// Setup tooltips on page load
setupTooltips();

// Set up MutationObserver to catch new professor elements
const tooltipObserver = new MutationObserver(mutations => {
  let shouldCheck = false;
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      shouldCheck = true;
      break;
    }
  }
  
  if (shouldCheck) {
    // Add a small delay to ensure the DOM is fully updated
    setTimeout(() => {
      // First run the regular attachment
      attachTooltipListeners();
      
      console.log('Performing extra checks for missed elements...');
      
      // Extra check for result__flex--9 elements with Instructor text
      document.querySelectorAll('span.result__flex--9.text--right').forEach(span => {
        if (span.textContent.includes('Instructor:') && !span.hasAttribute('data-rmp-attached')) {
          console.log('Found missed result__flex--9 element, attaching listeners');
          span.setAttribute('data-rmp-missed', 'true');
          span.style.cursor = 'help';
          span.classList.add('rmp-professor-name');
          span.addEventListener('mouseenter', handleProfessorHover);
          span.addEventListener('mouseleave', handleProfessorLeave);
        }
      });
      
      // Extra check for course-section-instructorresult-html elements
      document.querySelectorAll('div.course-section-instructorresult-html:not([data-rmp-attached])').forEach(div => {
        console.log('Found missed course-section-instructorresult-html element, attaching listeners');
        div.setAttribute('data-rmp-missed', 'true');
        div.style.cursor = 'help';
        div.classList.add('rmp-professor-name');
        div.addEventListener('mouseenter', handleProfessorHover);
        div.addEventListener('mouseleave', handleProfessorLeave);
      });
      
      // Force-reprocess all spans with rmp-professor-name class to ensure they have working listeners
      document.querySelectorAll('.rmp-professor-name').forEach(el => {
        // Ensure all elements have event listeners by removing and re-adding them
        el.removeEventListener('mouseenter', handleProfessorHover);
        el.removeEventListener('mouseleave', handleProfessorLeave);
        el.addEventListener('mouseenter', handleProfessorHover);
        el.addEventListener('mouseleave', handleProfessorLeave);
        el.setAttribute('data-rmp-reprocessed', 'true');
      });
      
    }, 100); // 100ms delay to allow DOM to settle
  }
});

// Immediately apply attachment to ensure all current elements are processed
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(attachTooltipListeners, 500);
});

// Process the page immediately in case DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(attachTooltipListeners, 100);
}

// More aggressive observer configuration
tooltipObserver.observe(document.body, { 
  childList: true, 
  subtree: true,
  attributes: true, 
  attributeFilter: ['class', 'data-rmp-attached'] 
});

// content-bundle.js
// bundled version of content script with imports included
// to be injected into chrome webpage

// extractors.js - functions to get professor names from HTML

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

// Global event handling for professor tooltips
let globalListenersAttached = false;
let professorElementsProcessed = false;

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
  professorElementsProcessed = true;
  
  // Result Flex professor names
  document.querySelectorAll('span.result__flex--9.text--right').forEach(span => {
    // Force attach to ALL result__flex--9 elements with Instructor text regardless of previous attachment
    if (span.textContent.includes('Instructor:')) {
      // Add a debug class to track which elements we've processed
      if (span.hasAttribute('data-rmp-attached')) {
        span.setAttribute('data-rmp-reattached', 'true');
      }
      
      // Always set these attributes to mark professor elements
      span.setAttribute('data-rmp-attached', 'true');
      span.style.cursor = 'help';
      span.classList.add('rmp-professor-name');
      span.style.pointerEvents = 'auto'; // Ensure hover events reach this element
      span.style.position = 'relative'; // For z-index to work properly
      span.style.zIndex = '100'; // Higher z-index to ensure hover detection
      
      // We'll use global event handlers instead of direct attachment
      // But keep the direct handlers as a fallback
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
      div.style.pointerEvents = 'auto'; // Ensure hover events reach this element
      div.style.position = 'relative'; // For z-index to work properly
      div.style.zIndex = '100'; // Higher z-index to ensure hover detection
      
      // We'll primarily use global event handlers but keep direct handlers as fallback
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
      div.style.pointerEvents = 'auto'; // Ensure hover events reach this element
      div.style.position = 'relative'; // For z-index to work properly
      div.style.zIndex = '100'; // Higher z-index to ensure hover detection
      
      // We'll primarily use global event handlers but keep direct handlers as fallback
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

function positionTooltip(tooltip, anchorElement) {
  // Prepare tooltip for accurate measurement
  tooltip.style.visibility = 'hidden';
  tooltip.style.top = '0px';
  tooltip.style.left = '-9999px';
  tooltip.style.display = 'block';

  setTimeout(() => {
    const rect = anchorElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Vertical position: start aligned with anchor top
    let topPosition = scrollY + rect.top;

    // Adjust if bottom would fall off screen
    const tooltipBottom = topPosition + tooltipHeight;
    const maxBottom = scrollY + window.innerHeight - 10;

    if (tooltipBottom > maxBottom) {
      topPosition = maxBottom - tooltipHeight;
    }

    // Prevent tooltip from going too high
    topPosition = Math.max(scrollY + 5, topPosition);

    // Horizontal position: prefer right side
    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft = rect.left;

    let leftPosition;
    if (spaceRight >= tooltipWidth + 10) {
      // Enough space on the right
      leftPosition = scrollX + rect.right + 10;
    } else {
      // Not enough space on the right — position to the left
      leftPosition = scrollX + rect.left - tooltipWidth - 10;
    }

    // Apply styles
    tooltip.style.top = `${topPosition}px`;
    tooltip.style.left = `${leftPosition}px`;
    tooltip.style.visibility = 'visible';
  }, 0);
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
  
  // Reset any previously set inline styles
  tooltip.style.maxHeight = '';
  tooltip.style.width = '';
  
  // Check if we already have data for this professor
  if (professorName in professorData) {
    const professor = professorData[professorName];
    
    if (professor.found) {
      // Create a unique ID for this professor
      const professorId = `prof_${Math.random().toString(36).substr(2, 9)}`;
      
      // Always use RateMyProfessor name when available
      const fullName = (professor.rmpData && professor.rmpData.firstName && professor.rmpData.lastName) ? 
                     `${professor.rmpData.firstName} ${professor.rmpData.lastName}` : 
                     professorName;
      const department = professor.rmpData.department || 'N/A';
      const avgRating = professor.rating ? professor.rating.toFixed(1) : 'N/A';
      const numRatings = professor.numRatings || 0;
      const wouldTakeAgain = professor.wouldTakeAgain ? `${parseFloat(professor.wouldTakeAgain).toFixed(2)}%` : 'N/A';
      const avgDifficulty = professor.difficulty ? professor.difficulty.toFixed(1) : 'N/A';
      const rmpUrl = professor.rmpData.legacyId ? 
        `https://www.ratemyprofessors.com/professor/${professor.rmpData.legacyId}` : null;
      
      // Get reviews to display
      let reviewsHTML = '<p style="margin:10px 0; color:#666; text-align:center;">No ratings available</p>';
      
      // Try to find reviews to display (up to 3)
      const ratings = [];
      
      // Add the most useful rating if available
      if (professor.rmpData.mostUsefulRating) {
        ratings.push({
          ...professor.rmpData.mostUsefulRating,
          isMostUseful: true
        });
      }
      
      // Add additional ratings if available
      if (professor.rmpData.ratings && professor.rmpData.ratings.edges) {
        // Add up to 2 more ratings (we already have the most useful one)
        professor.rmpData.ratings.edges.forEach(edge => {
          // Make sure we don't add the same rating twice if it's already the most useful one
          if (edge.node && 
              (!professor.rmpData.mostUsefulRating || 
               edge.node.id !== professor.rmpData.mostUsefulRating.id)) {
            // Only add if we have fewer than 3 ratings
            if (ratings.length < 3) {
              ratings.push({
                ...edge.node,
                isMostUseful: false
              });
            }
          }
        });
      }
      
      if (ratings.length > 0) {
        reviewsHTML = ratings.map(rating => {
          const date = rating.date ? new Date(rating.date).toLocaleDateString() : 'Unknown date';
          const comment = rating.comment || 'No comment provided';
          const course = rating.class || 'Unknown course';
          const quality = rating.qualityRating || 'N/A';
          const difficulty = rating.difficultyRatingRounded || 'N/A';
          const wouldTakeAgain = rating.iWouldTakeAgain === null ? 'N/A' : rating.iWouldTakeAgain ? 'Yes' : 'No';
          const grade = rating.grade || 'Not provided';
          
          return `
            <div class="review-item">
              ${rating.isMostUseful ? '<div style="background-color:#f8f9fa;padding:3px 5px;margin-bottom:5px;border-radius:3px;font-size:11px;color:#555;display:inline-block;">Most Helpful Rating</div>' : ''}
              <p><strong>Course:</strong> ${course} | <strong>Grade:</strong> ${grade}</p>
              <p>
                <strong>Rating:</strong> ${quality}/5 | 
                <strong>Difficulty:</strong> ${difficulty}/5 | 
                <strong>Would take again:</strong> ${wouldTakeAgain}
              </p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Comment:</strong> "${comment.substring(0, 150)}${comment.length > 150 ? '...' : ''}"</p>
            </div>
          `;
        }).join('');
      }
      
      // Top tags
      let tagsHTML = '';
      if (professor.rmpData.teacherRatingTags && professor.rmpData.teacherRatingTags.length > 0) {
        const topTags = professor.rmpData.teacherRatingTags
          .sort((a, b) => b.tagCount - a.tagCount)
          .slice(0, 3);
          
        tagsHTML = `
          <div class="top-tags">
            <p><strong>Top Tags:</strong> ${topTags.map(tag => tag.tagName).join(', ')}</p>
          </div>
        `;
      }
      
      // Get background color based on rating
      const getRatingColor = (rating) => {
        if (!rating || rating === 'N/A') return '#999999';
        rating = parseFloat(rating);
        if (rating >= 4) return '#49a63f';
        if (rating >= 3) return '#bbb84f';
        if (rating >= 2) return '#e2923c';
        return '#d54741';
      };
      
      // Show tooltip with enhanced data
      tooltip.innerHTML = `
        <div class="tooltip-header" style="margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:8px;">
          <h3 style="margin:0; font-size:16px;">${fullName} 
            <span style="display:inline-block; background-color:${getRatingColor(avgRating)}; color:white; padding:3px 6px; border-radius:3px; font-size:12px; margin-left:5px;">${avgRating}</span>
          </h3>
          <p style="margin:4px 0 0 0; color:#666;">${department}</p>
          ${rmpUrl ? `<p style="margin:4px 0 0 0; color:#49a63f;"><a href="${rmpUrl}" target="_blank" style="color:#49a63f;">Click to see full profile</a></p>` : ''}
        </div>
        <div class="tooltip-body">
          <div class="rating-stats" style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <div>
              <p style="margin:0;"><strong>Overall:</strong> <span class="rmp-stars">${getRatingStars(avgRating)}</span> <span style="color:#2196F3; font-weight:bold;">${avgRating}/5</span></p>
              <p style="margin:4px 0 0 0;"><strong>Difficulty:</strong> ${avgDifficulty}/5</p>
            </div>
            <div>
              <p style="margin:0;"><strong>Would take again:</strong> ${wouldTakeAgain}</p>
              <p style="margin:4px 0 0 0;"><strong>Total ratings:</strong> ${numRatings}</p>
            </div>
          </div>
          ${tagsHTML}
          <div class="reviews-section" style="margin-top:10px; border-top:1px solid #eee; padding-top:8px;">
            <h4 style="margin:0 0 8px 0; font-size:15px; font-weight:bold; color:#2196F3;">Student Reviews</h4>
            <div class="reviews-container" style="max-height:200px; overflow-y:auto;">
              ${reviewsHTML}
            </div>
          </div>
        </div>
        <div class="tooltip-footer" style="margin-top:8px; font-size:12px; color:#666; text-align:left;">
          <p style="margin:0;">Data from RateMyProfessors.com</p>
        </div>
      `;
      
      // Add click event to open RMP profile
      if (rmpUrl) {
        const rmpLink = tooltip.querySelector('a[target="_blank"]');
        if (rmpLink) {
          rmpLink.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open(rmpUrl, '_blank');
          });
        }
      }
    } else {
      // We know this professor doesn't have ratings
      // Always prioritize RateMyProfessor name format when available
      const firstName = professor.rmpFirstName || (professor.firstName || '');
      const lastName = professor.rmpLastName || (professor.lastName || '');
      // Try to construct the best possible name, prioritizing RMP name
      const displayName = firstName && lastName ? `${firstName} ${lastName}` : 
                         (professor.rmpFullName || professorName);
      tooltip.innerHTML = `
        <div class="tooltip-header" style="margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:8px;">
          <div style="display:flex; align-items:center;">
            <h3 style="margin:0; font-size:16px;">${displayName}</h3>
            <p style="margin:0 0 0 10px; color:#666; font-size:12px;">No ratings found on RateMyProfessors</p>
          </div>
        </div>
      `;
    }
  } else {
    // We don't have data yet, show loading and request it
    tooltip.innerHTML = `
      <div class="tooltip-header" style="margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:8px;">
            <h3 style="margin:0; font-size:16px;">${professorName}</h3>
            <p style="margin:4px 0 0 0; color:#666; font-size:12px;">Looking up official name...</p>
      </div>
      <div class="tooltip-body" style="text-align: center; padding: 5px 0;">
        <p style="margin:0; color:#666;">Loading RateMyProfessor data...</p>
      </div>
    `;
    
    // Add a variable to track if extension is in invalid state
    if (window.ndExtensionInvalidated) {
      tooltip.innerHTML = `
        <div class="tooltip-header" style="margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:8px;">
          <h3 style="margin:0; font-size:16px;">${professorName}</h3>
        </div>
        <div class="tooltip-body" style="text-align: center; padding: 15px 0;">
          <p style="margin:10px 0; color:#666;">Extension needs to be reloaded</p>
          <button id="nd-refresh-page-btn" style="background: #0d6efd; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Refresh Page</button>
        </div>
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
            <div class="tooltip-header" style="margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:8px;">
              <h3 style="margin:0; font-size:16px;">${professorName}</h3>
            </div>
            <div class="tooltip-body" style="text-align: center; padding: 15px 0;">
              <p style="margin:10px 0; color:#666;">Extension needs to be reloaded</p>
              <button id="nd-refresh-page-btn" style="background: #0d6efd; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Refresh Page</button>
            </div>
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
            <div class="tooltip-header" style="margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:8px;">
              <h3 style="margin:0; font-size:16px;">${professorName}</h3>
            </div>
            <div class="tooltip-body" style="text-align: center; padding: 15px 0;">
              <p style="margin:10px 0; color:#666;">Extension needs to be reloaded</p>
              <button id="nd-refresh-page-btn" style="background: #0d6efd; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Refresh Page</button>
            </div>
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
          // Create a standardized professor object with RateMyProfessor name explicitly stored
          const prof = {
            fullName: professorName,  // Original name from website
            rmpData: profData,
            // Store RateMyProfessor name components separately for consistent display
            rmpFirstName: profData.firstName || '',
            rmpLastName: profData.lastName || '',
            rmpFullName: profData.firstName && profData.lastName ? `${profData.firstName} ${profData.lastName}` : '',
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
        
        // Update tooltip with consistent enhanced format
        // Get background color based on rating
        const getRatingColor = (rating) => {
          if (!rating || rating === 'N/A') return '#999999';
          rating = parseFloat(rating);
          if (rating >= 4) return '#49a63f';
          if (rating >= 3) return '#bbb84f';
          if (rating >= 2) return '#e2923c';
          return '#d54741';
        };
        
        // Get reviews to display
        let reviewsHTML = '<p style="margin:10px 0; color:#666; text-align:center;">No ratings available</p>';
        
        // Try to find reviews to display (up to 3)
        const ratings = [];
        
        // Add the most useful rating if available
        if (prof.rmpData.mostUsefulRating) {
          ratings.push({
            ...prof.rmpData.mostUsefulRating,
            isMostUseful: true
          });
        }
        
        // Add additional ratings if available
        if (prof.rmpData.ratings && prof.rmpData.ratings.edges) {
          // Add up to 2 more ratings (we already have the most useful one)
          prof.rmpData.ratings.edges.forEach(edge => {
            // Make sure we don't add the same rating twice if it's already the most useful one
            if (edge.node && 
                (!prof.rmpData.mostUsefulRating || 
                 edge.node.id !== prof.rmpData.mostUsefulRating.id)) {
              // Only add if we have fewer than 3 ratings
              if (ratings.length < 3) {
                ratings.push({
                  ...edge.node,
                  isMostUseful: false
                });
              }
            }
          });
        }
        
        if (ratings.length > 0) {
          reviewsHTML = ratings.map(rating => {
            const date = rating.date ? new Date(rating.date).toLocaleDateString() : 'Unknown date';
            const comment = rating.comment || 'No comment provided';
            const course = rating.class || 'Unknown course';
            const quality = rating.qualityRating || 'N/A';
            const difficulty = rating.difficultyRatingRounded || 'N/A';
            const wouldTakeAgain = rating.iWouldTakeAgain === null ? 'N/A' : rating.iWouldTakeAgain ? 'Yes' : 'No';
            const grade = rating.grade || 'Not provided';
            
            return `
              <div class="review-item">
                ${rating.isMostUseful ? '<div style="background-color:#f8f9fa;padding:3px 5px;margin-bottom:5px;border-radius:3px;font-size:11px;color:#555;display:inline-block;">Most Helpful Rating</div>' : ''}
                <p><strong>Course:</strong> ${course} | <strong>Grade:</strong> ${grade}</p>
                <p>
                  <strong>Rating:</strong> ${quality}/5 | 
                  <strong>Difficulty:</strong> ${difficulty}/5 | 
                  <strong>Would take again:</strong> ${wouldTakeAgain}
                </p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Comment:</strong> "${comment.substring(0, 150)}${comment.length > 150 ? '...' : ''}"</p>
              </div>
            `;
          }).join('');
        }
        
        // Top tags
        let tagsHTML = '';
        if (prof.rmpData.teacherRatingTags && prof.rmpData.teacherRatingTags.length > 0) {
          const topTags = prof.rmpData.teacherRatingTags
            .sort((a, b) => b.tagCount - a.tagCount)
            .slice(0, 3);
            
          tagsHTML = `
            <div class="top-tags">
              <p><strong>Top Tags:</strong> ${topTags.map(tag => tag.tagName).join(', ')}</p>
            </div>
          `;
        }
        
        // Display RMP URL
        const rmpUrl = prof.rmpData.legacyId ? 
          `https://www.ratemyprofessors.com/professor/${prof.rmpData.legacyId}` : null;
        
        tooltip.innerHTML = `
          <div class="tooltip-header" style="margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:8px;">
            <h3 style="margin:0; font-size:16px;">${(prof.rmpData && prof.rmpData.firstName && prof.rmpData.lastName) ? `${prof.rmpData.firstName} ${prof.rmpData.lastName}` : prof.fullName} 
              <span style="display:inline-block; background-color:${getRatingColor(prof.rating)}; color:white; padding:3px 6px; border-radius:3px; font-size:12px; margin-left:5px;">${prof.rating ? prof.rating.toFixed(1) : 'N/A'}</span>
            </h3>
            <p style="margin:4px 0 0 0; color:#666;">${prof.rmpData.department || 'N/A'}</p>
            ${rmpUrl ? `<p style="margin:4px 0 0 0; color:#49a63f;"><a href="${rmpUrl}" target="_blank" style="color:#49a63f;">Click to see full profile</a></p>` : ''}
          </div>
          <div class="tooltip-body">
            <div class="rating-stats" style="display:flex; justify-content:space-between; margin-bottom:10px;">
              <div>
                <p style="margin:0;"><strong>Overall:</strong> <span class="rmp-stars">${getRatingStars(prof.rating)}</span> <span style="color:#2196F3; font-weight:bold;">${prof.rating ? prof.rating.toFixed(1) + '/5' : 'N/A'}</span></p>
                <p style="margin:4px 0 0 0;"><strong>Difficulty:</strong> ${prof.difficulty ? prof.difficulty.toFixed(1) : 'N/A'}/5</p>
              </div>
              <div>
                <p style="margin:0;"><strong>Would take again:</strong> ${prof.wouldTakeAgain ? parseFloat(prof.wouldTakeAgain).toFixed(2) + '%' : 'N/A'}</p>
                <p style="margin:4px 0 0 0;"><strong>Total ratings:</strong> ${prof.numRatings || 0}</p>
              </div>
            </div>
            ${tagsHTML}
            <div class="reviews-section" style="margin-top:10px; border-top:1px solid #eee; padding-top:8px;">
              <h4 style="margin:0 0 8px 0; font-size:15px; font-weight:bold; color:#2196F3;">Student Reviews</h4>
              <div class="reviews-container" style="max-height:200px; overflow-y:auto;">
                ${reviewsHTML}
              </div>
            </div>
          </div>
          <div class="tooltip-footer" style="margin-top:8px; font-size:12px; color:#666; text-align:left;">
            <p style="margin:0;">Data from RateMyProfessors.com</p>
          </div>
        `;
        
        // Add click event to open RMP profile
        if (rmpUrl) {
          const rmpLink = tooltip.querySelector('a[target="_blank"]');
          if (rmpLink) {
            rmpLink.addEventListener('click', (e) => {
              e.stopPropagation();
              window.open(rmpUrl, '_blank');
            });
          }
        }
      } else {
        // Not found on RMP
        // Get name from the response if available, otherwise use the website name
        const displayName = response.convertedName || professorName;
        tooltip.innerHTML = `
          <div class="tooltip-header" style="margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:8px;">
            <div style="display:flex; align-items:center;">
              <h3 style="margin:0; font-size:16px;">${professorName}</h3>
              <p style="margin:0 0 0 10px; color:#666; font-size:12px;">No ratings found on RateMyProfessors</p>
            </div>
          </div>
        `;
        
        // Save this negative result
        const notFoundProf = {
          fullName: professorName,
          // If we have a converted name from the API, save it
          rmpFullName: response.convertedName || null,
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
  positionTooltip(tooltip, element);
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

// Set up global event handlers
function setupGlobalEventHandlers() {
  if (globalListenersAttached) return;
  
  // Add global mouseover handler
  document.addEventListener('mouseover', (event) => {
    // Find if we're hovering over a professor element or any of its children
    const professorElement = event.target.closest('.rmp-professor-name');
    
    if (professorElement && professorElement !== currentHoveredElement) {
      // We're hovering over a new professor element
      console.log('Global handler detected hover on:', professorElement.textContent.trim());
      
      // Call the existing handler with the correct context
      handleProfessorHover({ currentTarget: professorElement });
    }
  });

  document.addEventListener('mouseout', (event) => {
    // Check if we're leaving a professor element
    const professorElement = event.target.closest('.rmp-professor-name');
    const relatedTarget = event.relatedTarget ? event.relatedTarget.closest('.rmp-professor-name') : null;
    
    // Only trigger leave if we're actually leaving the professor element
    // (not just moving between its children)
    if (currentHoveredElement && professorElement && !relatedTarget && !tooltipHovered) {
      console.log('Global handler detected leave from professor element');
      
      // Call the existing leave handler
      handleProfessorLeave();
    }
  });
  
  globalListenersAttached = true;
  console.log('Global event handlers for professor tooltips set up');
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
    
    // Ensure global event handlers are set up
    setupGlobalEventHandlers();
    
    console.log('Performing extra checks for missed elements...');
      
      // Extra check for result__flex--9 elements with Instructor text
      document.querySelectorAll('span.result__flex--9.text--right').forEach(span => {
        if (span.textContent.includes('Instructor:') && !span.hasAttribute('data-rmp-attached')) {
          console.log('Found missed result__flex--9 element, attaching listeners');
          span.setAttribute('data-rmp-missed', 'true');
          span.setAttribute('data-rmp-attached', 'true');
          span.style.cursor = 'help';
          span.classList.add('rmp-professor-name');
          span.style.pointerEvents = 'auto'; // Ensure hover events reach this element
          span.style.position = 'relative'; // For z-index to work properly
          span.style.zIndex = '100'; // Higher z-index to ensure hover detection
          // Keep direct handlers as fallback
          span.addEventListener('mouseenter', handleProfessorHover);
          span.addEventListener('mouseleave', handleProfessorLeave);
        }
      });
      
      // Extra check for course-section-instructorresult-html elements
      document.querySelectorAll('div.course-section-instructorresult-html:not([data-rmp-attached])').forEach(div => {
        console.log('Found missed course-section-instructorresult-html element, attaching listeners');
        div.setAttribute('data-rmp-missed', 'true');
        div.setAttribute('data-rmp-attached', 'true');
        div.style.cursor = 'help';
        div.classList.add('rmp-professor-name');
        div.style.pointerEvents = 'auto'; // Ensure hover events reach this element
        div.style.position = 'relative'; // For z-index to work properly
        div.style.zIndex = '100'; // Higher z-index to ensure hover detection
        // Keep direct handlers as fallback
        div.addEventListener('mouseenter', handleProfessorHover);
        div.addEventListener('mouseleave', handleProfessorLeave);
      });
      
      // Process all elements with rmp-professor-name class to ensure proper styling and attributes
      document.querySelectorAll('.rmp-professor-name').forEach(el => {
        // Make sure all professor elements have the required styles for better hover detection
        el.style.cursor = 'help';
        el.style.pointerEvents = 'auto';
        el.style.position = 'relative';
        el.style.zIndex = '100';
        
        // Keep the direct event listeners as a fallback
        el.addEventListener('mouseenter', handleProfessorHover);
        el.addEventListener('mouseleave', handleProfessorLeave);
        el.setAttribute('data-rmp-reprocessed', 'true');
      });
      
    }, 100); // 100ms delay to allow DOM to settle
  }
});

// Immediately apply attachment to ensure all current elements are processed
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    attachTooltipListeners();
    setupGlobalEventHandlers(); // Also set up global event handlers
  }, 500);
});

// Process the page immediately in case DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => {
    attachTooltipListeners();
    setupGlobalEventHandlers(); // Also set up global event handlers
  }, 100);
}

// More aggressive observer configuration
tooltipObserver.observe(document.body, { 
  childList: true, 
  subtree: true,
  attributes: true, 
  attributeFilter: ['class', 'data-rmp-attached'] 
});

// Make sure global event handlers are set up right away
if (!globalListenersAttached) {
  setupGlobalEventHandlers();
}

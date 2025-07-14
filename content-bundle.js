// content-bundle.js
// This is a bundled version of our content script with all imports included

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
    if (span.textContent.includes('Instructor:')) {
      const instructorText = span.textContent.trim();
      const name = instructorText.substring(instructorText.indexOf('Instructor:') + 'Instructor:'.length).trim();
      if (name && name !== 'TBD' && name !== 'Staff' && name !== 'TBA') {
        professorNames.add(name);
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
 * Extracts all professor names from all possible HTML structures
 * @returns {Array} Array of professor names
 */
function extractAllProfessorNames() {
  const professorNames = new Set();
  
  // Combine results from all extractors
  const fromResultFlex = extractFromResultFlex();
  const fromInstructorDetail = extractFromInstructorDetail();
  const fromCalendarViewing = extractFromCalendarViewing();
  
  // Add all names to the combined set
  fromResultFlex.forEach(name => professorNames.add(name));
  fromInstructorDetail.forEach(name => professorNames.add(name));
  fromCalendarViewing.forEach(name => professorNames.add(name));
  
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
    if (span.textContent.includes('Instructor:') && !span.hasAttribute('data-rmp-attached')) {
      span.setAttribute('data-rmp-attached', 'true');
      span.style.cursor = 'help';
      span.classList.add('rmp-professor-name');
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
}

// Handle mouse enter on professor name
function handleProfessorHover(event) {
  const element = event.currentTarget;
  currentHoveredElement = element;
  console.log('Hover detected on professor element:', element);
  
  // Extract professor name
  let professorName;
  if (element.classList.contains('result__flex--9')) {
    const text = element.textContent.trim();
    professorName = text.substring(text.indexOf('Instructor:') + 'Instructor:'.length).trim();
  } else {
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
  currentHoveredElement = null;
  tooltip.style.display = 'none';
}

// Helper function to generate star rating display
function getRatingStars(rating) {
  if (!rating) return '☆☆☆☆☆';
  
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  
  return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
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
    attachTooltipListeners();
  }
});

tooltipObserver.observe(document.body, { childList: true, subtree: true });

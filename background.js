import { ND_SCHOOL_ID, RMP_GRAPHQL_URL, AUTH_TOKEN } from './configure.js';

// Utility functions for encoding/decoding school IDs

/**
 * Encode a string to base64 with "School-" prefix
 * @param {string} str - The string to encode
 * @returns {string} Base64 encoded string with prefix
 */
export function encodeToBase64(str) {
    if (!str || typeof str !== 'string') {
        return '';
    }
    
    str = 'School-'.concat(str);
    return btoa(str);
}

/**
 * Decode a base64 string, optionally removing the "School-" or "Teacher-" prefix
 * @param {string} base64Str - Base64 encoded string to decode
 * @param {boolean} removePrefix - Whether to remove prefix
 * @returns {string} Decoded string
 */
export function decodeFromBase64(base64Str, removePrefix = false) {
    if (!base64Str || typeof base64Str !== 'string') {
        return '';
    }
    
    const decoded = atob(base64Str);
    
    if (removePrefix && (decoded.startsWith('School-') || decoded.startsWith('Teacher-'))) {
        return decoded.substring(7); // remove prefix
    }
    
    return decoded;
}

// background.js - Handles professor data processing, RateMyProfessor searches, and data storage

// Store professor data with their ratings
let professorData = [];

/**
 * Converts a professor name into a searchable format for RateMyProfessor
 * Handles different name formats and normalizes them
 * @param {string} name - The professor name to convert
 * @returns {string} Formatted professor name for searching
 */
function convertProfessorName(name) {
    if (!name) return '';
    
    // Remove any extra whitespace
    name = name.trim();
    
    // Handle "Lastname, Firstname" format
    if (name.includes(',')) {
        const parts = name.split(',').map(part => part.trim());
        return `${parts[1]} ${parts[0]}`.trim(); // Return as "Firstname Lastname"
    } 
    // Handle initial format like "J. Smith"
    else if (name.match(/^[A-Z]\.\s+[A-Za-z]+/)) {
        // Since we only have initial, just return the last name for better search
        const lastName = name.split('.').pop().trim();
        return lastName;
    }
    
    // Already in correct format or other format we can't handle specifically
    return name;
}

/**
 * Filter professor search results to find the best match
 * @param {Array} edges - Array of professor results from API
 * @param {string} searchName - The professor name we searched for
 * @param {string} targetDepartment - Optional department to help filter results
 * @returns {Object|null} Best matching professor or null if no good match
 */
function filterProfessorResults(edges, searchName, targetDepartment = null) {
    if (!edges || edges.length === 0) return null;
    
    // If only one result, return it
    if (edges.length === 1) return edges[0].node;
    
    // Try to find exact match first
    for (const edge of edges) {
        const professor = edge.node;
        const fullName = `${professor.firstName} ${professor.lastName}`.toLowerCase();
        
        // Check if the name matches exactly
        if (fullName === searchName.toLowerCase()) {
            return professor;
        }
        
        // If department filter is provided, check if it matches
        if (targetDepartment && professor.department && 
            professor.department.toLowerCase().includes(targetDepartment.toLowerCase())) {
            return professor;
        }
    }
    
    // If no exact match, return the first result as best guess
    return edges[0].node;
}

/**
 * Search RateMyProfessor for a professor's rating
 * @param {object} professor - Object with firstName, lastName properties
 * @returns {Promise} Promise resolving to professor data with rating
 */
const searchProfessor = async (professorName, schoolID, targetDepartment = null) => {
    console.log(`🔍 API Request: Searching for professor "${professorName}" at school ID ${schoolID}`);
    
    const query = `query NewSearchTeachersQuery(
    $query: TeacherSearchQuery!) {
        newSearch {
            teachers(query: $query) {
                didFallback
                edges {
                    cursor
                    node {
                        id
                        legacyId
                        firstName
                        middleName
                        lastName
                        school {
                          id
                          name
                          city
                          state
                          country
                        }
                        department
                        avgRating
                        avgRatingRounded
                        numRatings
                        wouldTakeAgainPercent
                        wouldTakeAgainPercentRounded
                        mandatoryAttendance
                        avgDifficulty
                        avgDifficultyRounded
                        isProfCurrentUser
                        nodeId
                        teacherRatingTags {
                          tagName
                          tagCount
                        }
                    }
                }
                resultCount
            }
        }
    }`;
    
    // Prepare the variables
    const convertedName = convertProfessorName(professorName);
    console.log(`🔄 Converting "${professorName}" to "${convertedName}" for API request`);
    
    const variables = {
        query: {
            text: convertedName,
            schoolID: schoolID
        }
    };
    
    try {
        // Log request details
        console.log(`📡 Sending GraphQL request to ${RMP_GRAPHQL_URL}`);
        console.log(`📝 Request payload:`, JSON.stringify({
            query: query,
            variables: variables
        }));
        
        // Make the API call
        const response = await fetch(RMP_GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTH_TOKEN,
                'Accept': 'application/json',
                'Origin': 'https://www.ratemyprofessors.com'
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        });
        
        // Log response status
        console.log(`📊 API Response Status: ${response.status}`);
        
        // Parse the response
        const data = await response.json();
        console.log('📊 API Response Data:', data);
        
        // Check for valid data structure
        if (!data || !data.data || !data.data.newSearch || !data.data.newSearch.teachers) {
            console.log(`❌ Invalid API response structure for "${professorName}"`);
            return null;
        }
        
        // Process results
        const edges = data.data.newSearch.teachers.edges;
        console.log(`✅ API returned ${edges.length} results for "${professorName}"`);
        
        if (edges.length === 0) {
            console.log(`❌ No results found for professor: ${professorName}`);
            return null;
        }
        
        // Find best match
        const bestMatch = filterProfessorResults(edges, convertedName, targetDepartment);
        console.log(`📋 Best match found:`, bestMatch);
        return bestMatch;
        
    } catch (error) {
        console.error(`❌ Error searching for professor ${professorName}:`, error);
        return null;
    }
};


// This duplicate listener has been merged with the main onMessage listener above

/**
 * Process all professors by searching RateMyProfessor for each
 * @param {Array} professors - Array of professor objects
 * @returns {Promise} Promise resolving to professors with ratings
 */
async function processProfessorsWithRatings(professors) {
  const results = [];
  
  // Process each professor sequentially to avoid rate limiting
  for (const professor of professors) {
    // Get the full name from the professor object
    const professorName = professor.fullName || `${professor.firstName || ''} ${professor.lastName || ''}`.trim();
    
    // Skip empty names
    if (!professorName) continue;
    
    // Search for the professor using our API function
    const result = await searchProfessor(professorName, encodeToBase64(ND_SCHOOL_ID));
    
    if (result) {
      // If found, add the result with the original professor data
      results.push({
        ...professor,
        rmpData: result,
        rating: result.avgRatingRounded || null,
        numRatings: result.numRatings || 0,
        difficulty: result.avgDifficultyRounded || null,
        wouldTakeAgain: result.wouldTakeAgainPercentRounded || null,
        found: true
      });
    } else {
      // If not found, add the original professor with not found status
      results.push({
        ...professor,
        rating: null,
        found: false,
        searchTerm: professorName
      });
    }
    
    // Add a small delay between requests to be nice to the RMP servers
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  return results;
}

// Main message listener that handles all requests from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background script:', request);
  
  // Handle processing multiple professors from page extraction
  if (request.action === 'processProfessors') {
    // Store the raw professor data immediately
    const rawProfessors = request.professors;
    console.log('Received professor data for processing:', rawProfessors);
    
    // Respond immediately to avoid keeping the content script waiting
    sendResponse({ success: true, message: 'Professor data received, processing started' });
    
    // Start the async process of fetching ratings
    processProfessorsWithRatings(rawProfessors)
      .then(professorsWithRatings => {
        // Store the processed data
        professorData = professorsWithRatings;
        console.log('Professors processed with ratings:', professorData);
        
        // Store in Chrome's local storage
        chrome.storage.local.set({ 'ndProfessors': professorData }, () => {
          console.log('Professor data with ratings saved to storage');
        });
        
        // Send a message back to any content script that might be listening
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
          if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'professorsProcessed',
              professors: professorData
            });
          }
        });
      })
      .catch(error => {
        console.error('Error processing professors:', error);
      });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
  
  // Handle single professor search request
  else if (request.action === 'searchProfessor') {
    const { professorName, schoolID = encodeToBase64(ND_SCHOOL_ID), department } = request;
    console.log(`Processing search request for: ${professorName}, department: ${department}`);
    
    if (!professorName) {
      console.error("Missing professor name in request");
      sendResponse({ success: false, error: "Professor name is required" });
      return true;
    }
    
    searchProfessor(professorName, schoolID, department)
      .then(professorData => {
        if (professorData) {
          console.log(`Sending successful response for ${professorName}`);
          sendResponse({ success: true, professor: professorData });
        } else {
          console.log(`Professor not found: ${professorName}`);
          sendResponse({ 
            success: false, 
            error: "Professor not found",
            searchTerm: professorName,
            convertedName: convertProfessorName(professorName),
            schoolID: schoolID
          });
        }
      })
      .catch(error => {
        console.error(`Error in searchProfessor for ${professorName}:`, error);
        sendResponse({ 
          success: false, 
          error: "Error searching for professor: " + error.message 
        });
      });
    
    return true; // indicates we send a response asynchronously
  }
  
  // Handle requests for professor data from storage
  else if (request.action === 'getProfessors') {
    sendResponse({ professors: professorData });
    return true;
  }
  
  // Unknown request type
  return false;
});

// Initialize by retrieving any previously stored professor data
chrome.storage.local.get(['ndProfessors'], (result) => {
  if (result.ndProfessors) {
    professorData = result.ndProfessors;
    console.log('Loaded professor data from storage:', professorData);
  }
});

// Listen for tab updates to detect Notre Dame class pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const ndSites = ['classes.nd.edu', 'path.nd.edu', 'bxeregprod.oit.nd.edu'];
  if (changeInfo.status === 'complete' && ndSites.some(site => tab.url.includes(site))) {
    console.log('Notre Dame class page detected:', tab.url);
  }
});

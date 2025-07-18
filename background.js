import { ND_SCHOOL_ID, RMP_GRAPHQL_URL, AUTH_TOKEN } from './configure.js';

// background.js
// handles API requests

// Utility functions for encoding/decoding school IDs
/**
 * Check if RateMyProfessor GraphQL API is reachable
 * @returns {Promise<boolean>} Whether the API is reachable
 */
const isGraphQLReachable = async () => {
    console.log('🔍 Checking if RateMyProfessor API is reachable...');
    try {
      const response = await fetch(RMP_GRAPHQL_URL, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': AUTH_TOKEN
        },
        body: JSON.stringify({
          query: `query { heartbeat }` // query just to check connectivity
        })
      });
      
      console.log(`API Connectivity Check: Status ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log('RateMyProfessor API is reachable!');
        return true;
      } else {
        console.error(`API returned error status: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('Error connecting to RateMyProfessor API:', error);
      return false;
    }
};

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

// Check API connectivity when extension loads
console.log('Notre Dame RateMyProfessor extension background script initializing...');

// Run the API check when background script loads
isGraphQLReachable().then(isReachable => {
  if (isReachable) {
    console.log('RateMyProfessor API connectivity confirmed');
  } else {
    console.error('WARNING: Unable to reach RateMyProfessor API. Rating lookups may fail.');
  }
});

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
        // return last name and first initial for matching
        return name.replace('.', '').trim();
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
    if (!edges || !edges.length) {
        console.log('No professor results returned from API');
        return null;
    }
    
    // log number of results to help with debugging
    console.log(`Found ${edges.length} potential professor matches for "${searchName}"`);
    
    // convert search name
    const searchNameLower = searchName.toLowerCase();
    
    // extract last name for partial matching
    const searchLastName = searchNameLower.includes(' ') ? 
        searchNameLower.split(' ').pop() : 
        searchNameLower;
    
    // first filter for Notre Dame professors only
    const notreDameProfessors = edges.filter(edge => {
        const school = edge.node?.school;
        return school && (
            school.id === btoa('School-'.concat(ND_SCHOOL_ID)) || // encoded Notre Dame school ID
            (school.name && school.name.toLowerCase().includes('notre dame'))
        );
    });
    
    console.log(`Found ${notreDameProfessors.length} Notre Dame professors out of ${edges.length} results`);
    
    // only use Notre Dame professors - do not fall back to other schools
    const professorPool = notreDameProfessors;
    
    // try to find the professor (most to least precise)
    
    // 1. First try exact match on full name
    for (const edge of professorPool) {
        const prof = edge.node;
        const fullName = `${prof.firstName} ${prof.lastName}`.toLowerCase();
        
        if (fullName === searchNameLower) {
            console.log(`Found exact name match: ${prof.firstName} ${prof.lastName} at ${prof.school.name}`);
            return prof;
        }
    }
    
    // 2. Try matching on last name and first name/initial (very common in Notre Dame class listings)
    for (const edge of professorPool) {
        const prof = edge.node;
        // Get first initial from search name and professor name
        const searchFirstName = searchNameLower.split(' ')[0];
        const searchFirstInitial = searchFirstName.charAt(0);
        const profFirstInitial = prof.firstName.toLowerCase().charAt(0);
        
        // Match if last names match AND either full first names match OR first initials match
        if (prof.lastName.toLowerCase() === searchLastName && 
            (prof.firstName.toLowerCase() === searchFirstName || 
             (searchFirstName.length === 1 && profFirstInitial === searchFirstName) || 
             (searchFirstInitial === profFirstInitial))) {
            console.log(`Found last name + first initial match: ${prof.firstName} ${prof.lastName} at ${prof.school.name}`);
            return prof;
        }
    }
    
    // 3. If no exact match and we have a target department, try matching with department
    // (this is for future iterations of the extension)
    if (targetDepartment) {
        for (const edge of professorPool) {
            const prof = edge.node;
            
            if (prof.department && prof.department.toLowerCase().includes(targetDepartment.toLowerCase())) {
                console.log(`Found department match: ${prof.firstName} ${prof.lastName} (${prof.department}) at ${prof.school.name}`);
                return prof;
            }
        }
    }
    
    // return null if no match professor was found
    console.log('No professor with matching last name and first initial found.');
    return null;

}

/**
 * Search RateMyProfessor for a professor's rating
 * @param {object} professor - Object with firstName, lastName properties
 * @returns {Promise} Promise resolving to professor data with rating
 */
const searchProfessor = async (professorName, schoolID, targetDepartment = null) => {
    console.log(`API Request: Searching for professor "${professorName}" at school ID ${schoolID}`);
    // data pulled from Rate My Professor
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
                        lastName
                        avgRatingRounded
                        numRatings
                        wouldTakeAgainPercentRounded
                        wouldTakeAgainCount
                        teacherRatingTags {
                            id
                            legacyId
                            tagCount
                            tagName
                        }
                        mostUsefulRating {
                            id
                            class
                            isForOnlineClass
                            legacyId
                            comment
                            helpfulRatingRounded
                            ratingTags
                            grade
                            date
                            iWouldTakeAgain
                            qualityRating
                            difficultyRatingRounded
                            teacherNote{
                                id
                                comment
                                createdAt
                                class
                            }
                            thumbsDownTotal
                            thumbsUpTotal
                        }
                        ratings(first: 3) {
                            edges {
                                node {
                                    id
                                    class
                                    isForOnlineClass
                                    legacyId
                                    comment
                                    helpfulRatingRounded
                                    ratingTags
                                    grade
                                    date
                                    iWouldTakeAgain
                                    qualityRating
                                    difficultyRatingRounded
                                    thumbsDownTotal
                                    thumbsUpTotal
                                }
                            }
                        }
                        avgDifficultyRounded
                        school {
                            name
                            id
                        }
                        department
                    }
                }
            }
        }
    }`;
    
    // name format - possibly redundant but more robust
    const convertedName = convertProfessorName(professorName);
    console.log(`Converting "${professorName}" to "${convertedName}" for API request`);
    
    // format for GraphQL API requirements
    const variables = {
        query: {
            text: convertedName,
            schoolID: schoolID,
            fallback: true,
            departmentID: null
        }
    };
    
    try {
        // Log request details
        console.log(`Sending GraphQL request to ${RMP_GRAPHQL_URL}`);
        console.log(`Request payload:`, JSON.stringify({
            query: query,
            variables: variables
        }));
        
        // make API call - POSTing query and variables as JSON
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
        
        console.log(`API Response Status: ${response.status} ${response.statusText}`);
        
        const data = await response.json();
        console.log('API Raw Response:', JSON.stringify(data).substring(0, 500) + '...');
        
        // Check if the response contains the expected structure
        if (!data.data?.newSearch?.teachers?.edges) {
            console.error('Unexpected API response format:', data);
        }
        
        console.log('API Response Data:', data);
        
        // Check for valid data structure
        if (!data.data || !data.data.newSearch || !data.data.newSearch.teachers) {
            console.log(`API Error: Invalid response structure for ${professorName}`);
            
            // Check for specific error patterns
            if (data.errors) {
                console.error('API Authentication Error:', data.errors);
                if (data.errors.some(e => e.message?.includes('authentication') || e.message?.includes('Authorization'))) {
                    console.error('This appears to be an authentication issue with the RateMyProfessors API. The AUTH_TOKEN in configure.js needs to be updated.');
                }
            }
            return null;
        }
        
        // Process results
        const edges = data.data.newSearch.teachers.edges;
        console.log(`API returned ${edges.length} results for "${professorName}"`);
        
        if (edges.length === 0) {
            console.log(`No results found for professor: ${professorName}`);
            return null;
        }
        
        // filter found professors
        const bestMatch = filterProfessorResults(edges, convertedName, targetDepartment);
        
        // if no Notre Dame professor was found, indicate no ratings available
        if (!bestMatch) {
            console.log(`No Notre Dame professor found for: ${professorName}`);
            return {
                notFound: true,
                message: "No ratings on Rate My Professor",
                searchTerm: professorName,
                schoolId: ND_SCHOOL_ID
            };
        }
        
        return bestMatch;
        
    } catch (error) {
        console.error(`Error searching for professor ${professorName}:`, error);
        return null;
    }
};

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
      // Check if this is a "not found at Notre Dame" result
      if (result.notFound) {
        // Notre Dame professor not found, add with specific not found status
        results.push({
          ...professor,
          rating: null,
          found: false,
          notFoundAtNotreDame: true,
          message: result.message || "No ratings on Rate My Professor",
          searchTerm: professorName
        });
      } else {
        // Notre Dame professor found with ratings
        results.push({
          ...professor,
          rmpData: result,
          rating: result.avgRatingRounded || null,
          numRatings: result.numRatings || 0,
          difficulty: result.avgDifficultyRounded || null,
          wouldTakeAgain: result.wouldTakeAgainPercentRounded || null,
          found: true,
          schoolName: result.school?.name || "Notre Dame"
        });
      }
    } else {
      // API error or other issue
      results.push({
        ...professor,
        rating: null,
        found: false,
        message: "Error retrieving professor data",
        searchTerm: professorName
      });
    }
    
    // delay between requests to RMP servers
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
        // Store the processed data in Chrome's local storage
        professorData = professorsWithRatings;
        console.log('Professors processed with ratings:', professorData);
        
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
    console.log(`🔎 Processing search request for: "${professorName}", school ID: ${schoolID}, department: ${department || 'not specified'}`);
    
    if (!professorName) {
      console.error("Missing professor name in request");
      sendResponse({ success: false, error: "Professor name is required" });
      return true;
    }
    
    // Use Notre Dame school ID with proper format required by the API
    // console.log(`Using Notre Dame school ID: ${ND_SCHOOL_ID}`);
    // API requires Base64 encoded version of "School-1576"
    const finalSchoolId = encodeToBase64(ND_SCHOOL_ID);
    
    searchProfessor(professorName, finalSchoolId, department)
      .then(professorData => {
        if (professorData) {
          // Check if this is a "not found" response
          if (professorData.notFound) {
            console.log(`Notre Dame professor not found: ${professorName}`);
            sendResponse({ 
              success: false, 
              error: professorData.message || "No ratings on Rate My Professor",
              notFoundAtNotreDame: true,
              searchTerm: professorName,
              convertedName: convertProfessorName(professorName),
              schoolID: finalSchoolId
            });
          } else {
            console.log(`Sending successful response for ${professorName}`);
            console.log('Professor data found:', professorData);
            sendResponse({ success: true, professor: professorData });
          }
        } else {
          console.log(`Professor not found: ${professorName}`);
          sendResponse({ 
            success: false, 
            error: "Professor not found",
            searchTerm: professorName,
            convertedName: convertProfessorName(professorName),
            schoolID: finalSchoolId
          });
        }
      })
      .catch(error => {
        console.error(`Error searching for professor ${professorName}:`, error);
        sendResponse({
          success: false,
          error: `API error: ${error.message || 'Unknown error'}`,
          searchTerm: professorName
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
// the bxeregprod.oit.nd.edu site is Notre Dame's registrar and is included for possible future iterations
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const ndSites = ['classes.nd.edu', 'path.nd.edu', 'bxeregprod.oit.nd.edu'];
  if (changeInfo.status === 'complete' && ndSites.some(site => tab.url.includes(site))) {
    console.log('Notre Dame class page detected:', tab.url);
  }
});

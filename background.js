import { ND_SCHOOL_ID, RMP_GRAPHQL_URL, AUTH_TOKEN } from './configure.js';

// background.js - Handles API requests

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
 * Decode a base64 string - boolean to remove the prefix
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

// Handle professor data processing, RateMyProfessor searches, and data storage

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
    // Handle initial format
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
 * @param {string} targetDepartment - Department to help filter in future extension iterations
 * @returns {Object|null} Best matching professor or null if no good match
 */
function filterProfessorResults(edges, searchName, targetDepartment = null) {
    if (!edges || !edges.length) {
        return null;
    }
     
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
    
    // only use Notre Dame professors - do not fall back to other schools
    const professorPool = notreDameProfessors;
    
    // try to find the professor (most to least precise)
    
    // 1. Try exact match on full name
    for (const edge of professorPool) {
        const prof = edge.node;
        const fullName = `${prof.firstName} ${prof.lastName}`.toLowerCase();
        
        if (fullName === searchNameLower) {
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
            return prof;
        }
    }
    
    // 3. If no exact match and we have a target department, try matching with department
    // (For future iterations of extension)
    if (targetDepartment) {
        for (const edge of professorPool) {
            const prof = edge.node;
            
            if (prof.department && prof.department.toLowerCase().includes(targetDepartment.toLowerCase())) {
                return prof;
            }
        }
    }
    
    // return null if no match professor was found
    return null;

}

/**
 * Search RateMyProfessor for a professor's rating
 * @param {object} professor - Object with firstName, lastName properties
 * @returns {Promise} Promise resolving to professor data with rating
 */
const searchProfessor = async (professorName, schoolID, targetDepartment = null) => {
    console.log(`API Request: Searching for professor "${professorName}" at school ID ${schoolID}`);
    // request data from Rate My Professor API
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
                
        const data = await response.json();
        
        // Process results
        const edges = data.data.newSearch.teachers.edges;
        
        if (edges.length === 0) {
            // no data returned
            return null;
        }
        
        // filter found professors
        const bestMatch = filterProfessorResults(edges, convertedName, targetDepartment);
        
        // if no Notre Dame professor was found, indicate no ratings available
        if (!bestMatch) {
            return {
                notFound: true,
                message: "No ratings on Rate My Professor",
                searchTerm: professorName,
                schoolId: ND_SCHOOL_ID
            };
        }
        
        return bestMatch;
        
    } catch (error) {
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
  
  // Handle processing multiple professors from page extraction
  if (request.action === 'processProfessors') {
    // Store the raw professor data immediately
    const rawProfessors = request.professors;
    
    // Respond immediately to avoid keeping the content script waiting
    sendResponse({ success: true, message: 'Professor data received, processing started' });
    
    // Start the async process of fetching ratings
    processProfessorsWithRatings(rawProfessors)
      .then(professorsWithRatings => {
        // Store the processed data in Chrome's local storage
        professorData = professorsWithRatings;
        
        chrome.storage.local.set({ 'ndProfessors': professorData }, () => {});
        
        // Send message back to content script using runtime messaging
        // This broadcasts to all content scripts - each will check if the data is relevant
        chrome.runtime.sendMessage({
          action: 'professorsProcessed',
          professors: professorData
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
    
    if (!professorName) {
      sendResponse({ success: false, error: "Professor name is required" });
      return true;
    }
  
    // API requires Base64 encoded version of "School-1576"
    const finalSchoolId = encodeToBase64(ND_SCHOOL_ID);
    
    searchProfessor(professorName, finalSchoolId, department)
      .then(professorData => {
        if (professorData) {
          // Check if this is a "not found" response
          if (professorData.notFound) {
            sendResponse({ 
              success: false, 
              error: professorData.message || "No ratings on Rate My Professor",
              notFoundAtNotreDame: true,
              searchTerm: professorName,
              convertedName: convertProfessorName(professorName),
              schoolID: finalSchoolId
            });
          } else {
            sendResponse({ success: true, professor: professorData });
          }
        } else {
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
  }
});

// formatters.js - Functions to standardize professor name formats

/**
 * Standardizes a professor's name for RateMyProfessor searching
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
  // Handle "F. Lastname" format
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

// Export functions
export {
  standardizeNameFormat,
  processAllNames
};

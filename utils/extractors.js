// extractors.js - Functions to extract professor names from HTML structures

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

// Export functions
export {
  extractFromResultFlex,
  extractFromInstructorDetail,
  extractFromCalendarViewing,
  extractAllProfessorNames
};

/**
 * Returns display skills:
 * - If All-rounder is in skills → show only All-rounder
 * - Otherwise show all selected skills
 */
export function displaySkills(skills = []) {
  if (skills.includes('All-rounder')) return ['All-rounder'];
  return skills;
}

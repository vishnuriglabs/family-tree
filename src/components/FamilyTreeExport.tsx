import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { useAuth } from '../utils/AuthContext';
import { logActivity, ActivityType } from '../utils/activity';

// Add logging to the export functions
const exportAsJson = () => {
  try {
    // Create a JSON string from the family members data
    const jsonData = JSON.stringify(familyMembers, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'family-tree.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Log the export activity
    if (currentUser) {
      logActivity(
        currentUser.uid,
        currentUser.displayName || currentUser.email || 'Unknown User',
        ActivityType.FAMILY_EXPORTED,
        { 
          userEmail: currentUser.email,
          details: 'Exported family tree as JSON'
        }
      ).catch(err => console.error('Error logging activity:', err));
    }
    
    toast({
      title: "Export successful",
      description: "Your family tree has been exported as JSON.",
    });
  } catch (error) {
    console.error('Error exporting JSON:', error);
    toast({
      variant: "destructive",
      title: "Export failed",
      description: "There was an error exporting your family tree.",
    });
  }
};

const exportAsCsv = () => {
  try {
    // Define CSV headers
    const headers = ['ID', 'Name', 'Gender', 'Birth Date', 'Death Date', 'Bio', 'Parent ID', 'Spouse ID'];
    
    // Convert family members to CSV rows
    const rows = Object.entries(familyMembers).map(([id, member]) => [
      id,
      member.name,
      member.gender,
      member.birthDate || '',
      member.deathDate || '',
      member.bio || '',
      member.parentId || '',
      member.spouseId || ''
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'family-tree.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Log the export activity
    if (currentUser) {
      logActivity(
        currentUser.uid,
        currentUser.displayName || currentUser.email || 'Unknown User',
        ActivityType.FAMILY_EXPORTED,
        { 
          userEmail: currentUser.email,
          details: 'Exported family tree as CSV'
        }
      ).catch(err => console.error('Error logging activity:', err));
    }
    
    toast({
      title: "Export successful",
      description: "Your family tree has been exported as CSV.",
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    toast({
      variant: "destructive",
      title: "Export failed",
      description: "There was an error exporting your family tree.",
    });
  }
};
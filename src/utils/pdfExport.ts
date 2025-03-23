import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FamilyMemberData } from './database';
import { findRootMember } from './treeExport';

/**
 * Exports family tree data as a PDF document
 * @param members The family members data
 * @param familyName The family name to use in the PDF title
 * @param timestamp The timestamp to include in the filename
 */
export const exportFamilyTreeAsPDF = (members: Record<string, FamilyMemberData>, familyName: string, timestamp: string): void => {
  try {
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(`${familyName} Family Tree`, 14, 22);
    
    // Add timestamp
    const formattedDate = new Date().toLocaleDateString();
    doc.setFontSize(10);
    doc.text(`Generated on: ${formattedDate}`, 14, 30);
    
    // Add table headers
    const headers = [['Name', 'Gender', 'Birth Date', 'Death Date', 'Relation', 'Contact']];
    
    // Add table data
    const data = Object.values(members).map(member => [
      member.name,
      member.gender,
      member.birthDate || '-',
      member.deathDate || '-',
      member.relation || '-',
      member.phone || member.email || '-'
    ]);
    
    // Create table
    (doc as any).autoTable({
      head: headers,
      body: data,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [66, 66, 66] },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });
    
    // Add family relationships section
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(14);
    doc.text('Family Relationships', 14, finalY + 15);
    
    // Add relationships data
    let relationshipText = '';
    let yPosition = finalY + 25;
    
    Object.values(members).forEach(member => {
      if (member.spouseId && members[member.spouseId]) {
        relationshipText += `${member.name} is married to ${members[member.spouseId].name}\n`;
      }
      
      if (member.parentId && members[member.parentId]) {
        relationshipText += `${member.name} is child of ${members[member.parentId].name}\n`;
      }
      
      if (member.children && member.children.length > 0) {
        const childrenNames = member.children
          .filter(childId => members[childId])
          .map(childId => members[childId].name)
          .join(', ');
        
        if (childrenNames) {
          relationshipText += `${member.name} is parent of ${childrenNames}\n`;
        }
      }
    });
    
    // Add relationships text
    doc.setFontSize(10);
    doc.text(relationshipText || 'No relationships defined', 14, yPosition, {
      maxWidth: 180,
      lineHeightFactor: 1.5
    });
    
    // Save the PDF
    doc.save(`${familyName}_Tree_${timestamp}.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
};
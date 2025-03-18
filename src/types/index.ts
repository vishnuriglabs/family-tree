export interface FamilyMember {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  imageUrl?: string;
  parentIds: string[];
  childrenIds: string[];
  spouseIds: string[];
  bio?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  familyTreeId: string;
}
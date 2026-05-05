export type Side = 'groom' | 'bride' | 'both' | 'unknown';

export type Group = 'family' | 'friends' | 'work' | 'army' | 'other';

export interface Contact {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  side: Side;
  group: Group;
  notes: string;
  isSelected: boolean;
  isDuplicate: boolean;
  isInvalid: boolean;
}

export const SIDE_LABELS: Record<Side, string> = {
  groom: 'חתן',
  bride: 'כלה',
  both: 'משותף',
  unknown: 'לא ידוע',
};

export const GROUP_LABELS: Record<Group, string> = {
  family: 'משפחה',
  friends: 'חברים',
  work: 'עבודה',
  army: 'צבא',
  other: 'אחר',
};

export const SIDE_OPTIONS: Side[] = ['groom', 'bride', 'both', 'unknown'];
export const GROUP_OPTIONS: Group[] = ['family', 'friends', 'work', 'army', 'other'];

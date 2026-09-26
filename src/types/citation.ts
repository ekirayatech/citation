export type SourceType = 'book' | 'article' | 'website' | 'chapter' | 'thesis' | 'ai';

export type CitationStyle = 'apa7' | 'mla9' | 'chicago17' | 'icontec';

export interface AuthorEntry {
  firstName: string;
  lastName: string;
}

export interface CitationFormData {
  sourceType: SourceType;
  style: CitationStyle;
  isInstitutionalAuthor: boolean;
  institutionalName: string;
  authors: AuthorEntry[];
  title: string;
  chapterTitle: string;
  bookTitle: string;
  bookEditor: string;
  year: string;
  edition: string;
  publisher: string;
  place: string;
  pages: string;
  journalName: string;
  volume: string;
  issue: string;
  doi: string;
  accessDate: string;
  url: string;
  // AI specific fields
  aiCompany: string;
  aiModel: string;
  aiVersion: string;
  aiPromptDescription: string;
}

export interface GeneratedCitation {
  referenceHtml: string;
  referencePlain: string;
  parenthetical: string;
  narrative: string;
  sortKey: string;
}

export interface SavedReference {
  id: string;
  sourceType: SourceType;
  style: CitationStyle;
  referenceHtml: string;
  referencePlain: string;
  parenthetical: string;
  narrative: string;
  sortKey: string;
  createdAt: string;
  formData?: CitationFormData;
}

export type SourceType =
  | 'book'
  | 'chapter'
  | 'article'
  | 'newspaper'
  | 'report'
  | 'conference'
  | 'thesis'
  | 'website'
  | 'audiovisual'
  | 'social_media'
  | 'legal'
  | 'ai';

export type CitationStyle = 'apa7' | 'mla9' | 'chicago17' | 'icontec';

export type AuthorMode = 'personal' | 'institutional' | 'anonymous_title' | 'anonymous_literal';

export type LocatorType = 'page' | 'paragraph' | 'timestamp' | 'section';

export type BookSubtype = 'authored' | 'edited' | 'electronic' | 'translated';

export type NewspaperSubtype = 'newspaper_print' | 'newspaper_online' | 'magazine_print' | 'magazine_online';

export type ThesisSubtype = 'online_archive' | 'database';

export type AudiovisualSubtype = 'film' | 'tv_series' | 'video' | 'webinar' | 'podcast';

export type SocialMediaSubtype = 'tweet' | 'facebook' | 'instagram';

export type LegalSubtype = 'sentence' | 'law' | 'treaty';

export interface AuthorEntry {
  firstName: string;
  lastName: string;
}

export interface CitationFormData {
  sourceType: SourceType;
  style: CitationStyle;
  // Author configuration
  isInstitutionalAuthor: boolean;
  authorMode?: AuthorMode;
  institutionalName: string;
  institutionalAbbreviation?: string;
  authors: AuthorEntry[];
  useSpanishAnd?: boolean; // "y" vs "&" in APA 7 Spanish adaptation (p. 36)
  // Core metadata
  title: string;
  chapterTitle: string;
  bookTitle: string;
  bookEditor: string;
  year: string;
  exactDate?: string; // e.g., "2 de enero", "1 de abril", "del 1 al 2 de octubre"
  originalYear?: string; // e.g., "1966" for translated/reissued works (Piaget, 1966/1969)
  translator?: string; // e.g., "H. Weaver"
  edition: string;
  publisher: string;
  place: string;
  // Locators (p. 20)
  locatorType?: LocatorType;
  pages: string;
  // Serials / Web
  journalName: string;
  volume: string;
  issue: string;
  doi: string;
  accessDate: string;
  url: string;
  // Subtypes & specialized fields (pp. 24-35)
  bookSubtype?: BookSubtype;
  newspaperSubtype?: NewspaperSubtype;
  reportNumber?: string;
  conferenceType?: string; // e.g., "conferencia", "ponencia", "póster"
  conferenceName?: string;
  thesisSubtype?: ThesisSubtype;
  thesisLevel?: string; // e.g., "Tesis de pregrado", "Tesis de maestría", "Tesis de doctorado"
  databaseName?: string; // e.g., "Dissertations & Theses A&I"
  audiovisualSubtype?: AudiovisualSubtype;
  mediaRole?: string; // e.g., "Director", "Productora", "Ponente"
  socialSubtype?: SocialMediaSubtype;
  socialHandle?: string; // e.g., "@fundeu", "@centrodescritura"
  legalSubtype?: LegalSubtype;
  legalCourtOrBody?: string; // e.g., "Corte Constitucional", "Congreso de la República"
  legalJudgeOrSection?: string; // e.g., "Cristina Pardo, M.P.", "Diario Oficial No 46.383"
  // Special citation situations (pp. 20-21)
  secondarySourceAuthorYear?: string; // e.g., "Hawking, 2010" -> (como se citó en Hawking, 2010)
  isPersonalCommunication?: boolean; // e.g., M. González (comunicación personal, 17 de mayo, 2020)
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
  subsequentParenthetical?: string;
  subsequentNarrative?: string;
  requiresReferenceList: boolean;
  specialNote?: string;
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

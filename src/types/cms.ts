export type CmsBlockType =
  | 'header'
  | 'paragraph'
  | 'alert'
  | 'cards'
  | 'accordion'
  | 'download_links';

export interface CmsBlockItem {
  id: string;
  title: string;
  description?: string;
  linkUrl?: string;
  linkText?: string;
  badge?: string;
}

export interface CmsBlock {
  id: string;
  type: CmsBlockType;
  title?: string;
  subtitle?: string;
  content?: string;
  alertType?: 'info' | 'warning' | 'success' | 'institucional';
  items?: CmsBlockItem[];
}

export type CmsIconName =
  | 'FileText'
  | 'BookOpen'
  | 'GraduationCap'
  | 'FolderGit2'
  | 'Globe'
  | 'Sparkles'
  | 'Star'
  | 'HelpCircle'
  | 'Award'
  | 'Compass';

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  navLabel: string;
  subtitle?: string;
  iconName?: CmsIconName;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
  blocks: CmsBlock[];
}

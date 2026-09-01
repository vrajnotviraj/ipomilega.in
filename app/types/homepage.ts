import { Blog, Ipo } from '@/app/models/ipo';
import { IpoComprehensiveAnalysis } from '../models/ipo_comprehensive_analysis';

export interface HomePageData {
  data: {
    upcoming: HomePageIpoProps[];
    live: HomePageIpoProps[];
    past: HomePageIpoProps[];
  };
  counts: {
    upcoming: number;
    live: number;
    past: number;
  };
  blogList: Blog[];
}

export interface IpoSectionProps {
  ipos: HomePageIpoProps[];
  count: number;
}

export interface BlogSectionProps {
  blogs: Blog[];
}



export interface HomePageIpoProps {
  _id: string; // MongoDB ObjectId as string
  ipo: Ipo; // Use the Ipo interface directly
  analysis: IpoComprehensiveAnalysis | null; // Allow null explicitly
}
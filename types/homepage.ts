import { Blog, Ipo } from '@/types/ipo';
import { IpoComprehensiveAnalysis } from '@/types/ipo-comprehensive-analysis';

export interface HomePageData {
  data: {
    upcoming: HomePageIpoProps[];
    live: HomePageIpoProps[];
    closed: HomePageIpoProps[];
    past: HomePageIpoProps[];
  };
  counts: {
    upcoming: number;
    live: number;
    closed: number;
    past: number;
  };
  blogList: Blog[];
}

export interface IpoSectionProps {
  ipos: HomePageIpoProps[];
  count: number;
}

export interface HomePageIpoProps {
  _id: string;
  ipo: Ipo;
  analysis: IpoComprehensiveAnalysis | null;
}

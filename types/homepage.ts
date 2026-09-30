import { Ipo } from '@/types/ipo';
import { IpoComprehensiveAnalysis } from '@/types/ipo-comprehensive-analysis';

export interface IpoSectionProps {
  ipos: HomePageIpoProps[];
}

export interface HomePageIpoProps {
  _id: string;
  ipo: Ipo;
  analysis: IpoComprehensiveAnalysis | null;
}

import React from 'react';
import { TrendingUp, Calendar, CheckCircle, ClockAlert } from 'lucide-react';
import { Ipo } from '@/app/models/ipo';
import { IpoComprehensiveAnalysis } from '@/app/models/ipo_comprehensive_analysis';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useProgressRouter } from '../Progressbar/useProgressRouter';

interface IpoCardProps {
  ipo: Ipo | null;
  analysis: IpoComprehensiveAnalysis | null;
}

// Utility function for getting company initials
const getInitials = (name: string) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((word: string) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Utility function to get risk border color
const getRiskBorderColor = (riskScore: number) => {
  if (riskScore <= 3) return 'border-b-[#B4292E]';
  if (riskScore <= 6) return 'border-b-[#D59527]';
  return 'border-b-[#00914D]';
};

// Utility function to get risk text color (no background)
const getRiskTextColor = (riskScore: number) => {
  if (riskScore <= 3) return 'text-[#B4292E]';
  if (riskScore <= 6) return 'text-[#D59527]';
  return 'text-[#00914D]';
};

// Utility function to parse date strings safely in a browser/node environment
const parseCardDate = (dateString: string | undefined): Date | null => {
  if (!dateString) return null;
  const cleanDate = dateString.trim();
  if (cleanDate.toLowerCase() === 'tba' || cleanDate === '-' || cleanDate === '') {
    return null;
  }

  // Try parsing directly first (handles formats with years like "June 18, 2026")
  const directDate = new Date(cleanDate);
  if (!isNaN(directDate.getTime())) {
    return directDate;
  }

  // Try parsing with current year (handles formats like "18 June" or "June 18")
  const currentYear = new Date().getFullYear();
  const dateWithYear = `${cleanDate} ${currentYear}`;
  const parsedDate = new Date(dateWithYear);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  return null;
};

// Live IPO Card Component
export function LiveIpoCard({ ipo, analysis }: IpoCardProps) {
  const router = useProgressRouter();

  const handleViewAnalysis = (ipo: Ipo) => {
    router.push(`/analysis/${ipo?.slug}`);
  };
  const getDaysUntilClosing = () => {
    const dateStr = ipo?.ipo_dates?.ipo_close_date || ipo?.closing_date;
    const closingDate = parseCardDate(dateStr);
    if (!closingDate) return -1;

    closingDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = closingDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getRiskTextColorForElements = (riskScore: number) => {
    if (riskScore <= 3) return 'text-[#B4292E]';
    if (riskScore <= 6) return 'text-[#D59527]';
    return 'text-[#00914D]';
  };

  const daysUntilClosing = getDaysUntilClosing();
  const riskScore = analysis?.risk_meter?.score || 0;
  const riskBorderColor = getRiskBorderColor(riskScore);
  const riskTextColorForElements = getRiskTextColorForElements(riskScore);

  return (
    <Card className={`w-full max-w-sm mx-auto h-full border-b-6 ${riskBorderColor} shadow-md font-ibm-plex`} style={{ borderRadius: '8px', borderTop: 'none', borderLeft: 'none', borderRight: 'none', boxShadow: 'none' }} >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row gap-2">
            <Badge variant="outline" className="bg-gray-50 border-gray-300 text-gray-800 text-xs font-medium w-fit">
              {ipo?.ipo_type || 'N/A'}
            </Badge>
            <Badge variant="secondary"
              suppressHydrationWarning
              className="bg-white/95 backdrop-blur-sm text-red-600 text-xs font-medium animate-pulse border border-red-200 w-fit">
              🔴 LIVE - {daysUntilClosing < 0 ? "TBA" : daysUntilClosing == 0 ? "Closing Today" : daysUntilClosing + "d" + " left"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-left justify-left">
          <div className="flex flex-row items-center justify-left gap-3">
            <Avatar className="w-15 h-15 sm:w-16 sm:h-16 flex-shrink-0">
              {ipo?.image_url ? (
                <AvatarImage
                  src={ipo.image_url}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <AvatarFallback className="text-white bg-black border-black border-2 text-xs font-medium">
                  {getInitials(ipo?.upcoming_ipo_2025 || '')}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col items-left justify-left min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold truncate">{ipo?.upcoming_ipo_2025 || 'Company Name'}</h2>
              <p className="text-sm text-gray-600 truncate">{ipo?.ipo_size || 'N/A'} | ₹{ipo?.price_band || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-left justify-center mt-3">
          <div className="flex flex-row items-left justify-center gap-3">
            <div className="w-full py-3">
              <h3 className="text-sm sm:text-md text-gray-800 flex items-left space-x-1 font-semibold mb-1">
                <Calendar className="w-4 h-4 mt-1 text-gray-600 flex-shrink-0" />
                <span className="text-sm sm:text-md font-medium font-ibm-plex" style={{ fontWeight: '600' }}>Timeline</span>
              </h3>
              <div className="text-left flex flex-row items-left justify-between gap-2">
                <span className="font-normal block font-ibm-plex text-sm" style={{ fontWeight: '400' }}>Opening Date</span>
                <span className="font-medium block font-ibm-plex text-sm" style={{ fontWeight: '400' }}>{ipo?.ipo_dates?.ipo_open_date || 'TBA'}</span>
              </div>
              <div className="text-left flex flex-row items-left justify-between gap-2">
                <span className="font-medium block font-ibm-plex text-sm" style={{ fontWeight: '400' }}>Closing Date</span>
                <span className="font-medium block font-ibm-plex text-sm" style={{ fontWeight: '400' }}>{ipo?.ipo_dates?.ipo_close_date || 'TBA'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
          <div className="text-center p-2 sm:p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-xs font-medium mb-1">Expected GMP</h4>
            <div className="flex items-center justify-center space-x-1">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-green-500 font-semibold ">₹{ipo?.gmp_price_gain || 'TBA'}</span>
            </div>
          </div>
          <div className="text-center p-2 sm:p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-xs font-medium mb-1">Risk Score</h4>
            <span className={`text-xs sm:text-sm ${riskTextColorForElements} font-semibold`}>{riskScore}/10</span>
          </div>
        </div>
        <hr className="my-4 border-gray-200" />
        <div className="mt-6">
          {riskScore > 0 ? (
            <Button
              variant="outline"
              className="w-full bg-[#0073E6] text-white hover:bg-white hover:text-[#0073E6] hover:border-[#0073E6] text-sm py-2 font-medium transition-colors"
              onClick={() => handleViewAnalysis(ipo!)}
            >
              View Analysis
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled
              className="w-full bg-gray-300 text-gray-600 cursor-not-allowed text-sm py-2 font-medium"
            >
              <ClockAlert className="w-4 h-4 mr-2" />
              Analysis Unavailable
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Upcoming IPO Card Component
export function UpcomingIpoCard({ ipo, analysis }: IpoCardProps) {
  const router = useProgressRouter();

  const handleViewAnalysis = (ipo: Ipo) => {
    router.push(`/analysis/${ipo?.slug}`);
  };
  const getDaysUntilOpening = () => {
    const dateStr = ipo?.ipo_dates?.ipo_open_date || ipo?.open_date;
    const openingDate = parseCardDate(dateStr);
    if (!openingDate) return -1;

    openingDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = openingDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilOpening = getDaysUntilOpening();
  const riskScore = analysis?.risk_meter?.score || 0;
  const riskBorderColor = getRiskBorderColor(riskScore);
  const riskTextColor = getRiskTextColor(riskScore);

  return (
    <Card className={`w-full max-w-sm mx-auto h-full border-b-6 ${riskBorderColor} shadow-md font-ibm-plex`} style={{ borderRadius: '8px', borderTop: 'none', borderLeft: 'none', borderRight: 'none', boxShadow: 'none' }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row gap-2">
            <Badge variant="outline" className="bg-gray-50 border-gray-300 text-gray-800 text-xs font-medium w-fit">
              {ipo?.ipo_type || 'N/A'}
            </Badge>
            <Badge variant="secondary"
              suppressHydrationWarning
              className="bg-white/95 backdrop-blur-sm text-blue-600 text-xs font-medium border border-blue-200 w-fit">
              📅 {daysUntilOpening < 0 ? "TBA" : daysUntilOpening + "d to go"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-left justify-left">
          <div className="flex flex-row items-center justify-left gap-3">
            <Avatar className="w-15 h-15 sm:w-16 sm:h-16 flex-shrink-0">
              {ipo?.image_url ? (
                <AvatarImage
                  src={ipo.image_url}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <AvatarFallback className="text-white bg-black border-black border-2 text-xs font-medium">
                  {getInitials(ipo?.upcoming_ipo_2025 || '')}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col items-left justify-left min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold truncate">{ipo?.upcoming_ipo_2025 || 'Company Name'}</h2>
              <p className="text-sm text-gray-600 truncate">{ipo?.ipo_details?.issue_size || 'N/A'} | ₹{ipo?.price_band || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-left justify-center mt-3">
          <div className="flex flex-row items-left justify-center gap-3">
            <div className="w-full py-3">
              <h3 className="text-sm sm:text-md text-gray-800 flex items-left space-x-1 font-semibold mb-1">
                <Calendar className="w-4 h-4 mt-1 text-gray-600 flex-shrink-0" />
                <span className="text-sm sm:text-md font-medium font-ibm-plex" style={{ fontWeight: '600' }}>Timeline</span>
              </h3>
              <div className="text-left flex flex-row items-left justify-between gap-2">
                <span className="font-medium block font-ibm-plex text-sm" style={{ fontWeight: '400' }}>Expected Opening Date</span>
                <span className="font-medium block font-ibm-plex text-sm" style={{ fontWeight: '400' }}>{ipo?.ipo_dates?.ipo_open_date || 'TBA'}</span>
              </div>
              <div className="text-left flex flex-row items-left justify-between gap-2">
                <span className="font-medium block font-ibm-plex text-sm" style={{ fontWeight: '400' }}>Expected Closing Date</span>
                <span className="font-medium block font-ibm-plex text-sm" style={{ fontWeight: '400' }}>{ipo?.ipo_dates?.ipo_close_date || 'TBA'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
          <div className={`text-center p-2 sm:p-3 rounded-lg border shadow-sm`}>
            <h4 className={`text-xs font-medium mb-1`}>Expected GMP</h4>
            <div className="flex items-center justify-center space-x-1">
              <span className={`text-xs sm:text-sm text-green-500 font-semibold`}>₹{ipo?.gmp_price_gain || 'TBA'}</span>
            </div>
          </div>
          <div className={`text-center p-2 sm:p-3 bg-white rounded-lg border shadow-sm`}>
            <h4 className={`text-xs font-medium mb-1`}>Risk Score</h4>
            <span className={`text-xs sm:text-sm ${riskTextColor} font-semibold`}>{riskScore}/10</span>
          </div>
        </div>
        <hr className="my-4 border-gray-200" />
        <div className="mt-6">
          {
            riskScore > 0 ? (
              <Button variant="outline" className="w-full bg-[#0073E6] text-white hover:bg-white hover:text-[#0073E6] hover:border-[#0073E6] text-sm py-2 font-medium transition-colors" onClick={() => handleViewAnalysis(ipo!)}>
                Pre-Analysis
              </Button>
            ) : (
              <Button variant="outline" disabled className="w-full bg-gray-300 text-gray-600 cursor-not-allowed text-sm py-2 font-medium">
                <ClockAlert className="w-4 h-4 mr-2" />
                Analysis Unavailable
              </Button>
            )
          }
        </div>
      </CardContent>
    </Card>
  );
}

// Past IPO Card Component
export function PastIpoCard({ ipo, analysis }: IpoCardProps) {
  const router = useProgressRouter();

  const handleViewAnalysis = (ipo: Ipo) => {
    router.push(`/analysis/${ipo?.slug}`);
  };
  const riskScore = analysis?.risk_meter?.score || 0;
  const riskBorderColor = getRiskBorderColor(riskScore);

  return (
    <Card className={`w-full max-w-sm mx-auto h-full border-b-6 ${riskBorderColor} shadow-md font-ibm-plex`} style={{ borderRadius: '8px', borderTop: 'none', borderLeft: 'none', borderRight: 'none', boxShadow: 'none' }} >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row gap-2">
            <Badge variant="outline" className="bg-gray-50 border-gray-300 text-gray-800 text-xs font-medium w-fit">
              {ipo?.ipo_type || 'N/A'}
            </Badge>
            <Badge variant="secondary"
              className="bg-white/95 backdrop-blur-sm text-green-600 text-xs font-medium border border-green-200 w-fit">
              ✅ Listed
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-left justify-left">
          <div className="flex flex-row items-center justify-left gap-3">
            <Avatar className="w-15 h-15 sm:w-16 sm:h-16 flex-shrink-0">
              {ipo?.image_url ? (
                <AvatarImage
                  src={ipo.image_url}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <AvatarFallback className="text-white bg-black border-black border-2 text-xs font-medium">
                  {getInitials(ipo?.upcoming_ipo_2025 || '')}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col items-left justify-left min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold truncate">{ipo?.upcoming_ipo_2025 || 'Company Name'}</h2>
              <p className="text-sm text-gray-600 truncate">{ipo?.ipo_size || 'N/A'} | ₹{ipo?.price_band || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-left justify-center mt-3">
          <div className="flex flex-row items-left justify-center gap-3">
            <div className="w-full py-3">
              <h3 className="text-sm sm:text-md text-gray-800 flex items-left space-x-1 font-semibold mb-1">
                <CheckCircle className="w-4 h-4 mt-1 text-gray-600 flex-shrink-0" />
                <span className="text-sm sm:text-md font-medium font-ibm-plex">Performance</span>
              </h3>
              <div className="text-left flex flex-row items-left justify-between gap-2">
                <span className="font-medium block font-ibm-plex text-sm" style={{ fontWeight: '500' }}>Listed</span>
                <span className="font-medium block font-ibm-plex text-sm" style={{ fontWeight: '400' }}>{ipo?.ipo_dates?.ipo_listing_date || 'N/A'}</span>
              </div>
              <div className="text-left flex flex-row items-left justify-between gap-2">
                <span className="font-medium block font-ibm-plex text-sm" style={{ fontWeight: '500' }}>Listing Price</span>
                <span className="font-medium block font-ibm-plex text-sm" style={{ fontWeight: '400' }}>₹{ipo?.listing_price || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
          <div className={`text-center p-2 sm:p-3 rounded-lg border shadow-sm`}>
            <h4 className={`text-xs font-medium mb-1`}>Current Price</h4>
            <span className={`text-xs sm:text-sm font-semibold`}>₹{ipo?.listing_price || 'N/A'}</span>
          </div>
          <div className={`text-center p-2 sm:p-3 bg-white rounded-lg border shadow-sm`}>
            <h4 className={`text-xs font-medium mb-1`}>Total Return</h4>
            <span className={`text-xs sm:text-sm text-green-500 font-semibold`}>{ipo?.listing_gain || 'N/A'}</span>
          </div>
        </div>
        <hr className="my-4 border-gray-200" />
        <div className="mt-6">
          {
            riskScore > 0 ? (
              <Button variant="outline" className="w-full bg-[#0073E6] text-white hover:bg-white hover:text-[#0073E6] hover:border-[#0073E6] text-sm py-2 font-medium transition-colors" onClick={() => handleViewAnalysis(ipo!)}>
                View Analysis
              </Button>
            ) : (
              <Button variant="outline" disabled className="w-full bg-gray-300 text-gray-600 cursor-not-allowed text-sm py-2 font-medium">
                <ClockAlert className="w-4 h-4 mr-2" />
                Analysis Unavailable
              </Button>
            )
          }
        </div>
      </CardContent>
    </Card>
  );
}
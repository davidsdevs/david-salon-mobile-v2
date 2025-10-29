import { FirebaseTimestamp } from './firebase';

export interface Portfolio {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  thumbnailUrl: string;
  publicId: string;
  width: number;
  height: number;
  stylistId: string;
  status: 'pending' | 'active' | 'rejected';
  createdAt: FirebaseTimestamp;
  approvedAt?: FirebaseTimestamp;
  approvedBy?: string;
}

export const isPortfolioApproved = (portfolio: Portfolio): boolean => {
  return portfolio.status === 'active' && !!portfolio.approvedAt && !!portfolio.approvedBy;
};

export const getPortfolioStatus = (portfolio: Portfolio): {
  label: string;
  color: string;
} => {
  if (portfolio.status === 'active' && portfolio.approvedAt && portfolio.approvedBy) {
    return { label: 'Approved', color: '#4CAF50' }; // Green
  } else if (portfolio.status === 'rejected') {
    return { label: 'Rejected', color: '#F44336' }; // Red
  } else {
    return { label: 'Pending', color: '#FFC107' }; // Yellow
  }
};
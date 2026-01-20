// File: app/(admin)/components/StatusBadge/StatusBadge.tsx
import React from 'react';
import './StatusBadge.scss';

// Updated StatusType to include 'Paid' and 'Due'
type StatusType = 'New' | 'In Progress' | 'Closed' | 'Cancelled' | 'Paid' | 'Due' | string;

interface StatusBadgeProps {
  status: StatusType;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusClass = (s: StatusType) => {
    // Normalize the status string: convert to lowercase and remove spaces
    const normalizedStatus = typeof s === 'string' ? s.toLowerCase().replace(/\s+/g, '') : '';

    switch (normalizedStatus) {
      case 'new':
        return 'status-new';
      case 'inprogress': // Handles "In Progress" or "In progress"
        return 'status-inprogress';
      case 'closed':
        return 'status-closed';
      case 'cancelled':
        return 'status-cancelled';
      case 'paid': // New case for Rent Management
        return 'status-paid';
      case 'due': // New case for Rent Management
        return 'status-due';
      default:
        return 'status-default';
    }
  };

  return (
    <span className={`status-badge ${getStatusClass(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
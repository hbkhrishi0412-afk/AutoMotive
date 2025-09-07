import React from 'react';

interface ReadReceiptIconProps {
  isRead: boolean;
}

const ReadReceiptIcon: React.FC<ReadReceiptIconProps> = ({ isRead }) => {
    if (isRead) {
        // Double check for "Read"
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block ml-1 text-blue-400" viewBox="0 0 24 24" fill="none">
                <path d="M1.5 12.5L5.5 16.5L11.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.5 12.5L12.5 16.5L22.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        );
    }
    // Single check for "Sent/Delivered"
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block ml-1 text-brand-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
    );
};

export default ReadReceiptIcon;

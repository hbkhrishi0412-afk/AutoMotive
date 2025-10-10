import React, { useState, useEffect } from 'react';
import { DatabaseServiceClient } from '../services/databaseServiceClient';

interface DatabaseStatusProps {
  className?: string;
}

export const DatabaseStatus: React.FC<DatabaseStatusProps> = ({ className = '' }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkDatabaseConnection = async () => {
      try {
        // Try to fetch a simple query to test connection
        await DatabaseServiceClient.getUsers();
        setIsConnected(true);
        setError(null);
      } catch (err) {
        setIsConnected(false);
        setError(err instanceof Error ? err.message : 'Unknown database error');
      }
    };

    checkDatabaseConnection();
  }, []);

  if (isConnected === null) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-600">Checking database...</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm text-green-600">Database connected</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
      <span className="text-sm text-red-600">Database error: {error}</span>
    </div>
  );
};

export default DatabaseStatus;

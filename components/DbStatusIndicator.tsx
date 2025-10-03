import React, { useState, useEffect } from 'react';

type DbStatus = 'checking' | 'connected' | 'error';

const DbStatusIndicator: React.FC = () => {
    const [status, setStatus] = useState<DbStatus>('checking');

    useEffect(() => {
        const checkDbStatus = async () => {
            try {
                const response = await fetch('/api/db-health');
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'ok') {
                        setStatus('connected');
                    } else {
                        setStatus('error');
                    }
                } else {
                    setStatus('error');
                }
            } catch (err) {
                console.error("DB health check failed:", err);
                setStatus('error');
            }
        };

        checkDbStatus();
        // Check status periodically every minute
        const interval = setInterval(checkDbStatus, 60000); 

        return () => clearInterval(interval);
    }, []);

    const statusConfig = {
        checking: {
            color: 'bg-yellow-400 animate-pulse',
            text: 'Checking DB...',
            title: 'Checking database connection status.',
        },
        connected: {
            color: 'bg-green-500',
            text: 'DB Connected',
            title: 'Database connection is healthy.',
        },
        error: {
            color: 'bg-red-500',
            text: 'DB Error',
            title: 'Could not connect to the database.',
        },
    };

    const currentStatus = statusConfig[status];

    return (
        <div className="flex items-center gap-2" title={currentStatus.title}>
            <span className={`w-2.5 h-2.5 rounded-full ${currentStatus.color}`}></span>
            <span className="text-xs">{currentStatus.text}</span>
        </div>
    );
};

export default DbStatusIndicator;

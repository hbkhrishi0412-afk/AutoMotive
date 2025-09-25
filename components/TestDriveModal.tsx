import React, { useState } from 'react';

interface TestDriveModalProps {
  onClose: () => void;
  onSubmit: (details: { date: string; time: string }) => void;
}

const TestDriveModal: React.FC<TestDriveModalProps> = ({ onClose, onSubmit }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      setError('Please select both a date and a time.');
      return;
    }
    setError('');
    onSubmit({ date, time });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-brand-gray-900 dark:text-brand-gray-100">Book a Test Drive</h2>
              <button type="button" onClick={onClose} className="text-brand-gray-400 hover:text-brand-gray-800 dark:hover:text-white text-3xl">&times;</button>
            </div>
            <p className="text-brand-gray-600 dark:text-brand-gray-400 mb-6">
              Select your preferred date and time. The seller will confirm your request via chat.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="test-drive-date" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">Preferred Date</label>
                <input
                  type="date"
                  id="test-drive-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={getTodayString()}
                  required
                  className="mt-1 w-full p-3 border border-brand-gray-300 dark:border-brand-gray-600 rounded-lg bg-white dark:bg-brand-gray-700 focus:ring-brand-blue"
                />
              </div>
              <div>
                <label htmlFor="test-drive-time" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">Preferred Time</label>
                <input
                  type="time"
                  id="test-drive-time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="mt-1 w-full p-3 border border-brand-gray-300 dark:border-brand-gray-600 rounded-lg bg-white dark:bg-brand-gray-700 focus:ring-brand-blue"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
          <div className="bg-brand-gray-50 dark:bg-brand-gray-900/50 px-6 py-4 flex justify-end rounded-b-xl">
            <button
              type="submit"
              className="px-6 py-2 bg-brand-blue text-white font-bold rounded-lg hover:bg-brand-blue-dark transition-colors"
            >
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestDriveModal;
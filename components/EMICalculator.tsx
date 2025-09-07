import React, { useState, useEffect, useMemo } from 'react';

interface EMICalculatorProps {
  price: number;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const EMICalculator: React.FC<EMICalculatorProps> = ({ price }) => {
    const minDownPayment = Math.round(price * 0.1);
    const maxLoanAmount = price - minDownPayment;

    const [loanAmount, setLoanAmount] = useState(Math.round(price * 0.8));
    const [interestRate, setInterestRate] = useState(10.75);
    const [tenure, setTenure] = useState(60); // in months

    const downPayment = useMemo(() => price - loanAmount, [price, loanAmount]);
    const maxTenure = 84; // 7 years

    const emi = useMemo(() => {
        if (loanAmount <= 0) return 0;
        const monthlyRate = interestRate / 12 / 100;
        const n = tenure;
        if (monthlyRate === 0) return loanAmount / n;
        const calculatedEmi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
        return Math.round(calculatedEmi);
    }, [loanAmount, interestRate, tenure]);

    useEffect(() => {
        const newMinDownPayment = Math.round(price * 0.1);
        const newMaxLoanAmount = price - newMinDownPayment;
        setLoanAmount(Math.min(Math.round(price * 0.8), newMaxLoanAmount));
    }, [price]);
    
    const handleLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        if(value <= maxLoanAmount) {
            setLoanAmount(value);
        }
    };
    
    const handleDownPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        const newLoanAmount = price - value;
        if (newLoanAmount >= 0 && newLoanAmount <= maxLoanAmount) {
           setLoanAmount(newLoanAmount);
        }
    };
    
    return (
        <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft-lg p-6">
            <h3 className="text-lg font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-4">EMI Calculator</h3>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                        <label htmlFor="loanAmount" className="font-medium text-brand-gray-600 dark:text-brand-gray-300">Loan Amount</label>
                        <span className="font-bold text-brand-gray-900 dark:text-brand-gray-100">{formatCurrency(loanAmount)}</span>
                    </div>
                    <input id="loanAmount" type="range" min="0" max={maxLoanAmount} step="1000" value={loanAmount} onChange={handleLoanAmountChange} className="w-full h-2 bg-brand-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-brand-gray-700" />
                </div>
                 <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                        <label htmlFor="downPayment" className="font-medium text-brand-gray-600 dark:text-brand-gray-300">Down Payment</label>
                        <span className="font-bold text-brand-gray-900 dark:text-brand-gray-100">{formatCurrency(downPayment)}</span>
                    </div>
                    <input id="downPayment" type="range" min={minDownPayment} max={price} step="1000" value={downPayment} onChange={handleDownPaymentChange} className="w-full h-2 bg-brand-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-brand-gray-700" />
                </div>
                <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                        <label htmlFor="tenure" className="font-medium text-brand-gray-600 dark:text-brand-gray-300">Loan Tenure</label>
                        <span className="font-bold text-brand-gray-900 dark:text-brand-gray-100">{tenure} months ({Math.round(tenure/12 * 10)/10} years)</span>
                    </div>
                    <input id="tenure" type="range" min="12" max={maxTenure} step="1" value={tenure} onChange={e => setTenure(Number(e.target.value))} className="w-full h-2 bg-brand-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-brand-gray-700" />
                </div>
                <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                        <label htmlFor="interestRate" className="font-medium text-brand-gray-600 dark:text-brand-gray-300">Interest Rate</label>
                        <span className="font-bold text-brand-gray-900 dark:text-brand-gray-100">{interestRate.toFixed(2)} %</span>
                    </div>
                    <input id="interestRate" type="range" min="7" max="20" step="0.05" value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} className="w-full h-2 bg-brand-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-brand-gray-700" />
                </div>
            </div>
            <div className="mt-6 pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700 text-center">
                 <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">Your EMI starts at</p>
                 <p className="text-3xl font-extrabold text-brand-blue dark:text-brand-blue-light">{formatCurrency(emi)}/month</p>
                 <p className="text-xs text-brand-gray-400 mt-2">This is an estimate. Final EMI may vary.</p>
            </div>
        </div>
    );
};

export default EMICalculator;

import React from 'react';
import type { User, PlanDetails } from '../types';
import { PLAN_DETAILS } from '../constants';

interface PricingPageProps {
    currentUser: User | null;
    onSelectPlan: (planId: 'free' | 'pro' | 'premium') => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ currentUser, onSelectPlan }) => {
    const plans: PlanDetails[] = Object.values(PLAN_DETAILS);
    const currentPlanId = currentUser?.subscriptionPlan;

    return (
        <div className="bg-brand-gray-50 dark:bg-brand-gray-dark py-12 sm:py-20 animate-fade-in">
            <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-brand-gray-900 dark:text-white">
                        Find the Perfect Plan for Your Dealership
                    </h1>
                    <p className="mt-4 text-lg text-brand-gray-600 dark:text-brand-gray-400">
                        Unlock powerful tools to sell your vehicles faster. Choose a plan that fits your needs.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`bg-white dark:bg-brand-gray-800 rounded-2xl shadow-soft-lg p-8 flex flex-col transition-transform duration-300 ${plan.isMostPopular ? 'transform lg:scale-105 border-2 border-brand-blue shadow-glow' : ''}`}
                        >
                            {plan.isMostPopular && (
                                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                                    <span className="bg-brand-blue text-white text-xs font-bold px-4 py-1 rounded-full uppercase">
                                        Most Popular
                                    </span>
                                </div>
                            )}
                            <h3 className="text-2xl font-bold text-brand-gray-900 dark:text-white">{plan.name}</h3>
                            <p className="mt-4 text-4xl font-extrabold text-brand-gray-900 dark:text-white">
                                ₹{plan.price.toLocaleString('en-IN')}
                                <span className="text-base font-medium text-brand-gray-500 dark:text-brand-gray-400">/month</span>
                            </p>
                            <p className="mt-2 text-sm text-brand-gray-500 dark:text-brand-gray-400">
                                {plan.id === 'free' ? 'Get started for free' : 'Billed monthly'}
                            </p>

                            <ul className="mt-8 space-y-4 text-brand-gray-600 dark:text-brand-gray-300 flex-grow">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start">
                                        <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                        </svg>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => onSelectPlan(plan.id)}
                                disabled={currentPlanId === plan.id}
                                className={`mt-10 w-full font-bold py-3 px-6 rounded-lg text-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed
                                    ${currentPlanId === plan.id
                                        ? 'bg-brand-gray-200 dark:bg-brand-gray-700 text-brand-gray-500'
                                        : plan.isMostPopular
                                            ? 'bg-brand-blue text-white hover:bg-brand-blue-dark'
                                            : 'bg-brand-blue-lightest text-brand-blue-dark dark:bg-brand-blue-darker dark:text-white hover:bg-brand-blue-light'
                                    }`}
                            >
                                {currentPlanId === plan.id ? 'Current Plan' : 'Choose Plan'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PricingPage;

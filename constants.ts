import type { Vehicle, User, PlanDetails, FAQItem, SupportTicket } from './types';
import { VehicleCategory, type SubscriptionPlan } from './types';
// import { VEHICLE_DATA, getPlaceholderImage } from './components/vehicleData';

// Helper to generate past dates
const daysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
};

export const INSPECTION_SERVICE_FEE = 2500; // Price for a certified inspection report

export const PLAN_DETAILS: Record<SubscriptionPlan, PlanDetails> = {
    free: {
        id: 'free',
        name: 'Free',
        price: 0,
        listingLimit: 1,
        featuredCredits: 0,
        features: [
            '1 Active Listing',
            'Basic Seller Profile',
            'Standard Support',
        ],
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        price: 1999,
        listingLimit: 10,
        featuredCredits: 2,
        isMostPopular: true,
        features: [
            '10 Active Listings',
            '2 Featured Credits/month',
            'Enhanced Seller Profile',
            'Performance Analytics',
            'Priority Support',
        ],
    },
    premium: {
        id: 'premium',
        name: 'Premium',
        price: 4999,
        listingLimit: 'unlimited',
        featuredCredits: 5,
        features: [
            'Unlimited Active Listings',
            '5 Featured Credits/month',
            'AI Listing Assistant',
            'Advanced Analytics',
            'Dedicated Support',
        ],
    },
};

export const INDIAN_STATES = [
    { name: 'Andaman & Nicobar Islands', code: 'AN' }, { name: 'Andhra Pradesh', code: 'AP' },
    { name: 'Arunachal Pradesh', code: 'AR' }, { name: 'Assam', code: 'AS' }, { name: 'Bihar', code: 'BR' },
    { name: 'Chandigarh', code: 'CH' }, { name: 'Chhattisgarh', code: 'CG' },
    { name: 'Dadra & Nagar Haveli and Daman & Diu', code: 'DD' }, { name: 'Delhi', code: 'DL' },
    { name: 'Goa', code: 'GA' }, { name: 'Gujarat', code: 'GJ' }, { name: 'Haryana', code: 'HR' },
    { name: 'Himachal Pradesh', code: 'HP' }, { name: 'Jammu & Kashmir', code: 'JK' },
    { name: 'Jharkhand', code: 'JH' }, { name: 'Karnataka', code: 'KA' }, { name: 'Kerala', code: 'KL' },
    { name: 'Ladakh', code: 'LA' }, { name: 'Lakshadweep', code: 'LD' }, { name: 'Madhya Pradesh', code: 'MP' },
    { name: 'Maharashtra', code: 'MH' }, { name: 'Manipur', code: 'MN' }, { name: 'Meghalaya', code: 'ML' },
    { name: 'Mizoram', code: 'MZ' }, { name: 'Nagaland', code: 'NL' }, { name: 'Odisha', code: 'OR' },
    { name: 'Puducherry', code: 'PY' }, { name: 'Punjab', code: 'PB' }, { name: 'Rajasthan', code: 'RJ' },
    { name: 'Sikkim', code: 'SK' }, { name: 'Tamil Nadu', code: 'TN' }, { name: 'Telangana', code: 'TS' },
    { name: 'Tripura', code: 'TR' }, { name: 'Uttar Pradesh', code: 'UP' }, { name: 'Uttarakhand', code: 'UK' },
    { name: 'West Bengal', code: 'WB' },
];

export const CITIES_BY_STATE: Record<string, string[]> = {
    'AP': ['Visakhapatnam', 'Vijayawada', 'Guntur'], 'AR': ['Itanagar'], 'AS': ['Guwahati', 'Dibrugarh'],
    'BR': ['Patna', 'Gaya'], 'CG': ['Raipur', 'Bhilai'], 'GA': ['Panaji', 'Margao'],
    'GJ': ['Ahmedabad', 'Surat', 'Vadodara'], 'HR': ['Gurugram', 'Faridabad', 'Chandigarh'],
    'HP': ['Shimla', 'Manali'], 'JH': ['Ranchi', 'Jamshedpur'], 'KA': ['Bengaluru', 'Mysuru', 'Mangaluru'],
    'KL': ['Kochi', 'Thiruvananthapuram', 'Kozhikode'], 'MP': ['Indore', 'Bhopal', 'Jabalpur'],
    'MH': ['Mumbai', 'Pune', 'Nagpur'], 'MN': ['Imphal'], 'ML': ['Shillong'], 'MZ': ['Aizawl'],
    'NL': ['Kohima'], 'OR': ['Bhubaneswar', 'Cuttack'], 'PB': ['Ludhiana', 'Amritsar'],
    'RJ': ['Jaipur', 'Jodhpur', 'Udaipur'], 'SK': ['Gangtok'], 'TN': ['Chennai', 'Coimbatore', 'Madurai'],
    'TS': ['Hyderabad', 'Warangal'], 'TR': ['Agartala'], 'UP': ['Lucknow', 'Kanpur', 'Noida'],
    'UK': ['Dehradun', 'Haridwar'], 'WB': ['Kolkata', 'Howrah'], 'DL': ['New Delhi'],
    'JK': ['Srinagar', 'Jammu'], 'LA': ['Leh'], 'AN': ['Port Blair'], 'CH': ['Chandigarh'],
    'DD': ['Daman'], 'LD': ['Kavaratti'], 'PY': ['Puducherry'],
};

export const MOCK_USERS: User[] = [
    { name: 'Prestige Motors', email: 'seller@test.com', password: 'password', mobile: '555-123-4567', role: 'seller', status: 'active', createdAt: daysAgo(30), dealershipName: 'Prestige Motors', bio: 'Specializing in luxury and performance electric vehicles since 2020.', logoUrl: 'https://i.pravatar.cc/100?u=seller', isVerified: true, subscriptionPlan: 'premium', featuredCredits: 5 },
    { name: 'Mock Customer', email: 'customer@test.com', password: 'password', mobile: '555-987-6543', role: 'customer', status: 'active', createdAt: daysAgo(15) },
    { name: 'Mock Admin', email: 'admin@test.com', password: 'password', mobile: '111-222-3333', role: 'admin', status: 'active', createdAt: daysAgo(100) },
    { name: 'Jane Doe', email: 'jane.doe@customer.com', password: 'password', mobile: '555-111-2222', role: 'customer', status: 'active', createdAt: daysAgo(5) },
    { name: 'Reliable Rides', email: 'john.smith@seller.com', password: 'password', mobile: '555-333-4444', role: 'seller', status: 'active', createdAt: daysAgo(60), dealershipName: 'Reliable Rides', bio: 'Your trusted source for pre-owned family cars and SUVs.', logoUrl: 'https://i.pravatar.cc/100?u=johnsmith', isVerified: false, subscriptionPlan: 'pro', featuredCredits: 2 },
    { name: 'Speedy Auto', email: 'speedy@auto.com', password: 'password', mobile: '555-555-1111', role: 'seller', status: 'active', createdAt: daysAgo(90), dealershipName: 'Speedy Auto', bio: 'Performance and sports cars for the enthusiast.', logoUrl: 'https://i.pravatar.cc/100?u=speedy', isVerified: true, subscriptionPlan: 'pro', featuredCredits: 1 },
    { name: 'Eco Drive', email: 'eco@drive.com', password: 'password', mobile: '555-222-5555', role: 'seller', status: 'active', createdAt: daysAgo(45), dealershipName: 'Eco Drive', bio: 'The best deals on electric and hybrid vehicles.', logoUrl: 'https://i.pravatar.cc/100?u=eco', isVerified: false, subscriptionPlan: 'free', featuredCredits: 0 },

];

export const MOCK_FAQS: FAQItem[] = [
    { id: 1, question: "How do I list my car for sale?", answer: "Navigate to the 'Sell' section, log in or register as a seller, and follow the on-screen instructions to create a new vehicle listing. You'll need details like make, model, year, and photos.", category: "Selling" },
    { id: 2, question: "What is AI Price Suggestion?", answer: "Our AI Price Suggestion tool analyzes your vehicle's details and compares them with current market listings to recommend a fair and competitive price, helping you sell faster.", category: "Selling" },
    { id: 3, question: "How can I contact a seller?", answer: "On any vehicle detail page, you can use the 'Chat with Seller' button to start a direct conversation with the seller to ask questions or schedule a test drive.", category: "Buying" },
    { id: 4, question: "Is my personal information secure?", answer: "Yes, we take data security very seriously. All personal information is encrypted and stored securely. We do not share your details with third parties without your consent.", category: "General" },
];

export const MOCK_SUPPORT_TICKETS: SupportTicket[] = [
    { id: 1, userEmail: 'customer@test.com', userName: 'Mock Customer', subject: 'Issue with chat', message: 'I am unable to see messages from a seller.', status: 'Open', createdAt: daysAgo(2), updatedAt: daysAgo(2), replies: [] },
    { id: 2, userEmail: 'jane.doe@customer.com', userName: 'Jane Doe', subject: 'Payment failed for inspection', message: 'I tried to purchase a certified inspection report but my payment failed. My card is working fine elsewhere.', status: 'In Progress', createdAt: daysAgo(1), updatedAt: daysAgo(0), replies: [{ author: 'admin@test.com', message: 'We are looking into this issue and will get back to you shortly.', timestamp: daysAgo(0) }] },
    { id: 3, userEmail: 'seller@test.com', userName: 'Prestige Motors', subject: 'How to feature a listing?', message: 'I have upgraded my plan but cannot find the option to feature my new listing.', status: 'Closed', createdAt: daysAgo(5), updatedAt: daysAgo(4), replies: [{ author: 'admin@test.com', message: 'You can feature a listing from your Seller Dashboard under the "My Listings" tab. There is a "Feature" button in the actions column.', timestamp: daysAgo(4) }] },
];


const COLORS = ['White', 'Black', 'Silver', 'Grey', 'Red', 'Blue', 'Brown', 'Beige'];
const FEATURES = ['Sunroof', 'Touchscreen Infotainment', 'Automatic Climate Control', 'Alloy Wheels', 'Ventilated Seats', '360 Camera', 'ADAS', 'Wireless Charging', 'Cruise Control', 'LED Headlamps'];
const TRANSMISSIONS = ['Automatic', 'Manual', 'CVT', 'DCT'];
export const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'];

const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateMockVehicles = (count: number): Vehicle[] => {
    const vehicles: Vehicle[] = [];
    const sellers = MOCK_USERS.filter(u => u.role === 'seller');

    for (let i = 1; i <= count; i++) {
        const category = VehicleCategory.FOUR_WHEELER;
        // Fallback vehicle data
        const fallbackMakes = [
            { name: "Maruti Suzuki", models: [{ name: "Swift", variants: ["LXi", "VXi", "ZXi"] }] },
            { name: "Hyundai", models: [{ name: "Creta", variants: ["E", "EX", "S", "SX"] }] },
            { name: "Tata", models: [{ name: "Nexon", variants: ["XE", "XM", "XZ", "XZ+"] }] },
            { name: "Honda", models: [{ name: "City", variants: ["V", "VX", "ZX"] }] },
            { name: "Toyota", models: [{ name: "Innova", variants: ["G", "GX", "ZX"] }] }
        ];
        
        const makeData = randomItem(fallbackMakes);
        const make = makeData.name;
        if (!makeData.models || makeData.models.length === 0) continue;

        const modelData = randomItem(makeData.models);
        const model = modelData.name;
        const variants = modelData.variants;
        const variant = variants.length > 0 ? randomItem(variants) : undefined;
        
        const year = randomNumber(2015, new Date().getFullYear());
        const mileage = randomNumber(5000, 120000);
        const price = Math.round(randomNumber(400000, 4000000) / 5000) * 5000;
        const seller = randomItem(sellers);
        const state = randomItem(Object.keys(CITIES_BY_STATE));
        const city = randomItem(CITIES_BY_STATE[state]);

        const vehicle: Vehicle = {
            id: i,
            category,
            make,
            model,
            variant,
            year,
            price,
            mileage,
            images: [`https://picsum.photos/seed/${make}${model}/800/600`, `https://picsum.photos/seed/${make}${model}${i}/800/600`],
            videoUrl: Math.random() > 0.7 ? 'https://cdn.coverr.co/videos/coverr-a-porsche-911-on-a-bridge-638/1080p.mp4' : undefined,
            features: [...new Set(Array.from({ length: randomNumber(3, 7) }, () => randomItem(FEATURES)))],
            description: `A well-maintained ${year} ${make} ${model} ${variant || ''}. Comes with features like ${randomItem(FEATURES)} and ${randomItem(FEATURES)}. Available in ${city}.`,
            sellerEmail: seller.email,
            engine: `${randomNumber(1, 2)}.${randomNumber(0, 9)}L ${randomItem(FUEL_TYPES)}`,
            transmission: randomItem(TRANSMISSIONS),
            fuelType: randomItem(FUEL_TYPES),
            fuelEfficiency: `${randomNumber(12, 25)} KMPL`,
            color: randomItem(COLORS),
            status: Math.random() > 0.1 ? 'published' : 'sold',
            isFeatured: Math.random() > 0.85,
            views: randomNumber(100, 5000),
            inquiriesCount: randomNumber(1, 50),
            isFlagged: Math.random() > 0.98,
            registrationYear: year,
            insuranceValidity: `Aug ${year + 3}`,
            insuranceType: 'Comprehensive',
            rto: `${state}${randomNumber(1, 20).toString().padStart(2, '0')}`,
            city,
            state,
            noOfOwners: randomNumber(1, 3),
            displacement: `${randomNumber(900, 2500)} cc`,
            groundClearance: `${randomNumber(160, 220)} mm`,
            bootSpace: `${randomNumber(250, 550)} litres`,
            certifiedInspection: Math.random() > 0.8 ? {
                reportId: `AV-${Date.now()}-${i}`,
                summary: 'This vehicle has passed our comprehensive 200-point inspection with flying colors. Key areas like engine, transmission, and brakes are in excellent condition. Minor cosmetic wear noted on the rear bumper, consistent with age. Overall, a reliable and well-maintained vehicle.',
                date: daysAgo(randomNumber(5, 30)),
                inspector: 'Ravi Kumar',
                scores: { 'Engine': 92, 'Transmission': 95, 'Suspension': 88, 'Brakes': 91, 'Exterior': 85, 'Interior': 90 },
                details: { 'Engine': 'No leaks or abnormal noises. OBD scan clear.', 'Exterior': 'Minor scuff on rear bumper. No signs of major bodywork.', 'Interior': 'Clean interior with all electronics functional.' }
            } : null,
            serviceRecords: [
                { date: daysAgo(90), service: "General Service & Oil Change", mileage: mileage - 5000, location: `${city} Service Center` },
                { date: daysAgo(400), service: "Brake Pad Replacement", mileage: mileage - 25000, location: `${city} Service Center` }
            ],
            accidentHistory: Math.random() > 0.9 ? [
                { date: daysAgo(600), description: "Minor dent on front right fender, repaired and repainted.", severity: "Minor" }
            ] : []
        };
        vehicles.push(vehicle);
    }
    return vehicles;
};

export const MOCK_VEHICLES: Vehicle[] = generateMockVehicles(250);
import { INDIAN_STATES } from '../constants';

export interface NewCarVariant {
    variant_name: string;
    engine_specs: string; 
    fuel_type: 'Petrol' | 'Diesel' | 'CNG' | 'Electric/EV' | 'Hybrid';
    transmission: 'Manual' | 'Automatic' | 'AMT' | 'CVT' | 'DCT' | 'e-CVT';
    power_bhp: string; 
    torque_nm: string; 
    on_road_prices: { [state: string]: number };
    features: {
        safety: string[];
        comfort_convenience: string[];
        interior: string[];
        exterior: string[];
    };
}

export interface NewCarModel {
    id: number;
    brand_name: string;
    model_name: string;
    model_year: number;
    body_type: 'SUV' | 'Sedan' | 'Hatchback' | 'MUV';
    key_specs: {
        engine: string;
        mileage: string;
        power: string;
        seating_capacity: number;
        safety_rating_stars?: number; // 0-5
        boot_space_litres?: number;
    };
    fuel_options: ('Petrol' | 'Diesel' | 'CNG' | 'Electric/EV' | 'Hybrid')[];
    variants: NewCarVariant[];
    image_url: string; 
}

const getImageUrl = (brand: string, model: string) => `https://via.placeholder.com/320x240.png/E5E7EB/4B5563?text=${encodeURIComponent(`${brand} ${model}`)}`;

const generateStatePrices = (basePrice: number): { [state: string]: number } => {
    const prices: { [state: string]: number } = {};
    const allIndianStates = ["Andaman & Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra & Nagar Haveli and Daman & Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];
    allIndianStates.forEach((state, index) => {
        const variation = 1 + ((index % 11) - 5) * 0.009; 
        prices[state] = Math.round((basePrice * variation) / 1000) * 1000;
    });
    return prices;
};

export const NEW_CARS_DATA: NewCarModel[] = [
    {
        id: 1,
        brand_name: "Maruti Suzuki",
        model_name: "Swift",
        model_year: 2024,
        body_type: "Hatchback",
        key_specs: { engine: "1197 cc", mileage: "25.75 kmpl", power: "80.46 bhp", seating_capacity: 5, safety_rating_stars: 4 },
        fuel_options: ["Petrol"],
        image_url: getImageUrl("Maruti", "Swift"),
        variants: [
            { variant_name: "LXi", engine_specs: "1.2L Z-Series", fuel_type: "Petrol", transmission: "Manual", power_bhp: "80.46 bhp", torque_nm: "111.7 Nm", on_road_prices: generateStatePrices(745000), features: { safety: ["6 Airbags", "ABS with EBD", "ESP"], comfort_convenience: ["Manual AC"], interior: ["Fabric Upholstery"], exterior: ["Halogen Projector Headlamps"] } },
            { variant_name: "ZXi+", engine_specs: "1.2L Z-Series", fuel_type: "Petrol", transmission: "Manual", power_bhp: "80.46 bhp", torque_nm: "111.7 Nm", on_road_prices: generateStatePrices(1020000), features: { safety: ["6 Airbags", "ABS with EBD", "ESP", "Rear Camera"], comfort_convenience: ["Automatic Climate Control", "Push Start/Stop", "Cruise Control"], interior: ["9-inch Touchscreen", "Arkamys Sound System"], exterior: ["LED Projector Headlamps", "Alloy Wheels"] } }
        ]
    },
    {
        id: 2,
        brand_name: "Hyundai",
        model_name: "Creta",
        model_year: 2024,
        body_type: "SUV",
        key_specs: { engine: "1497 cc", mileage: "17.4 kmpl", power: "113.18 bhp", seating_capacity: 5, safety_rating_stars: 5, boot_space_litres: 433 },
        fuel_options: ["Petrol", "Diesel"],
        image_url: getImageUrl("Hyundai", "Creta"),
        variants: [
            { variant_name: "E 1.5 Petrol", engine_specs: "1.5L MPi", fuel_type: "Petrol", transmission: "Manual", power_bhp: "113.18 bhp", torque_nm: "143.8 Nm", on_road_prices: generateStatePrices(1290000), features: { safety: ["6 Airbags", "ABS with EBD", "Rear Parking Sensors"], comfort_convenience: ["Manual AC", "All Power Windows"], interior: ["Digital Cluster"], exterior: ["Projector Headlamps"] } },
            { variant_name: "SX(O) 1.5 Diesel AT", engine_specs: "1.5L U2 CRDi", fuel_type: "Diesel", transmission: "Automatic", power_bhp: "114 bhp", torque_nm: "250 Nm", on_road_prices: generateStatePrices(2210000), features: { safety: ["6 Airbags", "ADAS Level 2", "360 Camera", "Electronic Parking Brake"], comfort_convenience: ["Ventilated Front Seats", "Powered Driver Seat", "Panoramic Sunroof"], interior: ["10.25-inch Touchscreen", "Bose Premium Sound System"], exterior: ["LED Headlamps", "18-inch Alloy Wheels"] } }
        ]
    },
    {
        id: 3,
        brand_name: "Tata",
        model_name: "Nexon EV",
        model_year: 2023,
        body_type: "SUV",
        key_specs: { engine: "40.5 kWh", mileage: "465 km range", power: "142 bhp", seating_capacity: 5, safety_rating_stars: 5, boot_space_litres: 350 },
        fuel_options: ["Electric/EV"],
        image_url: getImageUrl("Tata", "Nexon EV"),
        variants: [
            { variant_name: "Creative+ MR", engine_specs: "30 kWh Battery", fuel_type: "Electric/EV", transmission: "Automatic", power_bhp: "127 bhp", torque_nm: "215 Nm", on_road_prices: generateStatePrices(1610000), features: { safety: ["6 Airbags", "ESP", "All Disc Brakes"], comfort_convenience: ["Automatic Climate Control", "Push Start/Stop"], interior: ["7-inch Touchscreen"], exterior: ["LED DRLs"] } },
            { variant_name: "Empowered LR", engine_specs: "40.5 kWh Battery", fuel_type: "Electric/EV", transmission: "Automatic", power_bhp: "142 bhp", torque_nm: "215 Nm", on_road_prices: generateStatePrices(2080000), features: { safety: ["6 Airbags", "ESP", "Front Parking Sensors"], comfort_convenience: ["Ventilated Seats", "Wireless Charger", "Air Purifier"], interior: ["12.3-inch Touchscreen", "JBL Sound System"], exterior: ["Sequential LED Indicators", "Welcome/Goodbye Function"] } }
        ]
    },
    {
        id: 4,
        brand_name: "Mahindra",
        model_name: "XUV700",
        model_year: 2024,
        body_type: "SUV",
        key_specs: { engine: "2198 cc", mileage: "16 kmpl", power: "197 bhp", seating_capacity: 7, safety_rating_stars: 5, boot_space_litres: 240 },
        fuel_options: ["Petrol", "Diesel"],
        image_url: getImageUrl("Mahindra", "XUV700"),
        variants: [
            { variant_name: "MX Petrol 5-Str", engine_specs: "2.0L Turbo-Petrol", fuel_type: "Petrol", transmission: "Manual", power_bhp: "197 bhp", torque_nm: "380 Nm", on_road_prices: generateStatePrices(1620000), features: { safety: ["2 Airbags", "ABS with EBD"], comfort_convenience: ["Smart Door Handles"], interior: ["8-inch Touchscreen", "7-inch Digital Cluster"], exterior: ["Arrow-head LED Tail lamps"] } },
            { variant_name: "AX7L Diesel AT AWD", engine_specs: "2.2L Diesel AWD", fuel_type: "Diesel", transmission: "Automatic", power_bhp: "182 bhp", torque_nm: "450 Nm", on_road_prices: generateStatePrices(3050000), features: { safety: ["7 Airbags", "ADAS", "360 Surround View", "Electronic Parking Brake"], comfort_convenience: ["Dual-zone Climate Control", "Powered Driver Seat with Memory", "Wireless Charging"], interior: ["Dual 10.25-inch HD Screens", "Sony 3D Sound System"], exterior: ["LED Headlamps with High Beam Assist", "Panoramic Sunroof"] } }
        ]
    },
    {
        id: 5,
        brand_name: "Kia",
        model_name: "Seltos",
        model_year: 2023,
        body_type: "SUV",
        key_specs: { engine: "1497 cc", mileage: "17 kmpl", power: "113 bhp", seating_capacity: 5, safety_rating_stars: 3, boot_space_litres: 433 },
        fuel_options: ["Petrol", "Diesel"],
        image_url: getImageUrl("Kia", "Seltos"),
        variants: [
            { variant_name: "HTE 1.5 Petrol", engine_specs: "1.5L Petrol", fuel_type: "Petrol", transmission: "Manual", power_bhp: "113 bhp", torque_nm: "144 Nm", on_road_prices: generateStatePrices(1250000), features: { safety: ["6 Airbags", "ABS, ESC, VSM, HAC"], comfort_convenience: ["Rear AC Vents"], interior: ["4.2-inch Color Cluster"], exterior: ["Halogen Projector Headlamps"] } },
            { variant_name: "X-Line (S) 1.5 Turbo DCT", engine_specs: "1.5L Turbo-Petrol", fuel_type: "Petrol", transmission: "DCT", power_bhp: "158 bhp", torque_nm: "253 Nm", on_road_prices: generateStatePrices(2310000), features: { safety: ["6 Airbags", "ADAS Level 2", "360 Camera"], comfort_convenience: ["Dual Zone Climate Control", "Ventilated Seats", "Bose Audio System"], interior: ["Dual 10.25-inch Screens", "Heads-Up Display"], exterior: ["Panoramic Sunroof", "Matte Graphite Finish"] } }
        ]
    },
    {
        id: 6,
        brand_name: "Toyota",
        model_name: "Innova Hycross",
        model_year: 2023,
        body_type: "MUV",
        key_specs: { engine: "1987 cc", mileage: "23.24 kmpl", power: "184 bhp", seating_capacity: 8 },
        fuel_options: ["Petrol", "Hybrid"],
        image_url: getImageUrl("Toyota", "Innova Hycross"),
        variants: [
            { variant_name: "GX 7-Str", engine_specs: "2.0L Petrol", fuel_type: "Petrol", transmission: "CVT", power_bhp: "172 bhp", torque_nm: "209 Nm", on_road_prices: generateStatePrices(2230000), features: { safety: ["ABS with EBD", "VSC, HAC"], comfort_convenience: ["Automatic Climate Control"], interior: ["8-inch Touchscreen"], exterior: ["LED Reflector Headlamps"] } },
            { variant_name: "ZX (O) Hybrid 7-Str", engine_specs: "2.0L Petrol Hybrid", fuel_type: "Hybrid", transmission: "e-CVT", power_bhp: "184 bhp", torque_nm: "206 Nm", on_road_prices: generateStatePrices(3570000), features: { safety: ["Toyota Safety Sense (ADAS)", "6 Airbags", "Panoramic View Monitor"], comfort_convenience: ["Ventilated Front Seats", "Powered Ottoman 2nd Row Seats"], interior: ["10.1-inch Touchscreen", "JBL Speakers"], exterior: ["Panoramic Sunroof", "Powered Tailgate"] } }
        ]
    },
    {
        id: 7,
        brand_name: "Volkswagen",
        model_name: "Virtus",
        model_year: 2024,
        body_type: "Sedan",
        key_specs: { engine: "1498 cc", mileage: "19.4 kmpl", power: "148 bhp", seating_capacity: 5, safety_rating_stars: 5, boot_space_litres: 521 },
        fuel_options: ["Petrol"],
        image_url: getImageUrl("VW", "Virtus"),
        variants: [
            { variant_name: "Comfortline 1.0 TSI MT", engine_specs: "1.0L TSI", fuel_type: "Petrol", transmission: "Manual", power_bhp: "114 bhp", torque_nm: "178 Nm", on_road_prices: generateStatePrices(1350000), features: { safety: ["ESC, ABS, EBD", "2 Airbags"], comfort_convenience: ["Auto AC", "Cruise Control"], interior: ["7-inch Touchscreen"], exterior: ["LED Headlamps"] } },
            { variant_name: "GT Plus 1.5 TSI DSG", engine_specs: "1.5L TSI EVO", fuel_type: "Petrol", transmission: "DCT", power_bhp: "148 bhp", torque_nm: "250 Nm", on_road_prices: generateStatePrices(1900000), features: { safety: ["6 Airbags", "ESC, ABS, EBD", "Hill Hold Control"], comfort_convenience: ["Ventilated Leather Seats", "Wireless Charging"], interior: ["10-inch Touchscreen", "Digital Cockpit"], exterior: ["Electric Sunroof", "GT Badging"] } }
        ]
    },
    {
        id: 8,
        brand_name: "Skoda",
        model_name: "Kushaq",
        model_year: 2024,
        body_type: "SUV",
        key_specs: { engine: "1498 cc", mileage: "19.76 kmpl", power: "148 bhp", seating_capacity: 5, safety_rating_stars: 5, boot_space_litres: 385 },
        fuel_options: ["Petrol"],
        image_url: getImageUrl("Skoda", "Kushaq"),
        variants: [
            { variant_name: "Active 1.0 TSI MT", engine_specs: "1.0L TSI", fuel_type: "Petrol", transmission: "Manual", power_bhp: "114 bhp", torque_nm: "178 Nm", on_road_prices: generateStatePrices(1330000), features: { safety: ["ESC, ABS, EBD", "2 Airbags"], comfort_convenience: ["Manual AC"], interior: ["7-inch Touchscreen"], exterior: ["Halogen Headlamps"] } },
            { variant_name: "Monte Carlo 1.5 TSI DSG", engine_specs: "1.5L TSI", fuel_type: "Petrol", transmission: "DCT", power_bhp: "148 bhp", torque_nm: "250 Nm", on_road_prices: generateStatePrices(2280000), features: { safety: ["6 Airbags", "ESC, EBD, ABS"], comfort_convenience: ["Ventilated Seats", "Auto Climate Control"], interior: ["10-inch Touchscreen", "Digital Cockpit"], exterior: ["Electric Sunroof", "Monte Carlo Black elements"] } }
        ]
    },
    {
        id: 9,
        brand_name: "Honda",
        model_name: "Elevate",
        model_year: 2024,
        body_type: "SUV",
        key_specs: { engine: "1498 cc", mileage: "16.92 kmpl", power: "119 bhp", seating_capacity: 5, boot_space_litres: 458 },
        fuel_options: ["Petrol"],
        image_url: getImageUrl("Honda", "Elevate"),
        variants: [
            { variant_name: "SV MT", engine_specs: "1.5L i-VTEC", fuel_type: "Petrol", transmission: "Manual", power_bhp: "119 bhp", torque_nm: "145 Nm", on_road_prices: generateStatePrices(1350000), features: { safety: ["2 Airbags", "VSA, ABS, EBD"], comfort_convenience: ["Push Button Start/Stop"], interior: ["Fabric Seats"], exterior: ["LED Projector Headlamps"] } },
            { variant_name: "ZX CVT", engine_specs: "1.5L i-VTEC", fuel_type: "Petrol", transmission: "CVT", power_bhp: "119 bhp", torque_nm: "145 Nm", on_road_prices: generateStatePrices(1860000), features: { safety: ["6 Airbags", "Honda SENSING (ADAS)"], comfort_convenience: ["Electric Sunroof", "Wireless Charging"], interior: ["10.25-inch Touchscreen", "Leatherette Upholstery"], exterior: ["Full LED Headlamps", "17-inch Alloy Wheels"] } }
        ]
    },
    {
        id: 10,
        brand_name: "MG",
        model_name: "Hector",
        model_year: 2024,
        body_type: "SUV",
        key_specs: { engine: "1956 cc", mileage: "13.79 kmpl", power: "168 bhp", seating_capacity: 5, boot_space_litres: 587 },
        fuel_options: ["Petrol", "Diesel"],
        image_url: getImageUrl("MG", "Hector"),
        variants: [
            { variant_name: "Style 1.5 Turbo MT", engine_specs: "1.5L Turbo-Petrol", fuel_type: "Petrol", transmission: "Manual", power_bhp: "141 bhp", torque_nm: "250 Nm", on_road_prices: generateStatePrices(1650000), features: { safety: ["2 Airbags", "ESP, TCS, ABS"], comfort_convenience: ["Auto AC"], interior: ["10.4-inch Touchscreen"], exterior: ["LED Headlamps"] } },
            { variant_name: "Sharp Pro 2.0 Diesel MT", engine_specs: "2.0L Turbo-Diesel", fuel_type: "Diesel", transmission: "Manual", power_bhp: "168 bhp", torque_nm: "350 Nm", on_road_prices: generateStatePrices(2450000), features: { safety: ["6 Airbags", "360 Camera"], comfort_convenience: ["Ventilated Seats", "Powered Tailgate"], interior: ["14-inch Touchscreen", "Digital Cluster"], exterior: ["Panoramic Sunroof"] } }
        ]
    },
    {
        id: 11,
        brand_name: "Renault",
        model_name: "Kiger",
        model_year: 2024,
        body_type: "SUV",
        key_specs: { engine: "999 cc", mileage: "20.5 kmpl", power: "99 bhp", seating_capacity: 5, safety_rating_stars: 4, boot_space_litres: 405 },
        fuel_options: ["Petrol"],
        image_url: getImageUrl("Renault", "Kiger"),
        variants: [
            { variant_name: "RTE", engine_specs: "1.0L Energy", fuel_type: "Petrol", transmission: "Manual", power_bhp: "71 bhp", torque_nm: "96 Nm", on_road_prices: generateStatePrices(710000), features: { safety: ["2 Airbags", "ABS, EBD"], comfort_convenience: ["Manual AC"], interior: ["Digital Instrument Cluster"], exterior: ["LED DRLs"] } },
            { variant_name: "RXZ Turbo CVT", engine_specs: "1.0L Turbo", fuel_type: "Petrol", transmission: "CVT", power_bhp: "99 bhp", torque_nm: "152 Nm", on_road_prices: generateStatePrices(1250000), features: { safety: ["4 Airbags", "ABS, EBD, ESP"], comfort_convenience: ["Auto AC", "Wireless Charger"], interior: ["8-inch Touchscreen", "Arkamys Sound System"], exterior: ["LED Headlamps", "16-inch Diamond Cut Alloys"] } }
        ]
    },
    {
        id: 12,
        brand_name: "Nissan",
        model_name: "Magnite",
        model_year: 2024,
        body_type: "SUV",
        key_specs: { engine: "999 cc", mileage: "18.75 kmpl", power: "99 bhp", seating_capacity: 5, safety_rating_stars: 4, boot_space_litres: 336 },
        fuel_options: ["Petrol"],
        image_url: getImageUrl("Nissan", "Magnite"),
        variants: [
            { variant_name: "XE", engine_specs: "1.0L B4D", fuel_type: "Petrol", transmission: "Manual", power_bhp: "71 bhp", torque_nm: "96 Nm", on_road_prices: generateStatePrices(705000), features: { safety: ["2 Airbags", "ABS, EBD"], comfort_convenience: ["Rear Wiper"], interior: ["Basic Audio System"], exterior: ["Halogen Headlamps"] } },
            { variant_name: "XV Premium Turbo CVT", engine_specs: "1.0L HRA0 Turbo", fuel_type: "Petrol", transmission: "CVT", power_bhp: "99 bhp", torque_nm: "152 Nm", on_road_prices: generateStatePrices(1240000), features: { safety: ["2 Airbags", "TCS, HSA, HBA", "360 Camera"], comfort_convenience: ["Wireless Charger", "Air Purifier"], interior: ["8-inch Touchscreen", "JBL Speakers"], exterior: ["LED Bi-Projector Headlamps", "16-inch Diamond Cut Alloys"] } }
        ]
    },
    {
        id: 13,
        brand_name: "Tata",
        model_name: "Harrier",
        model_year: 2024,
        body_type: "SUV",
        key_specs: { engine: "1956 cc", mileage: "16.8 kmpl", power: "168 bhp", seating_capacity: 5, safety_rating_stars: 5, boot_space_litres: 445 },
        fuel_options: ["Diesel"],
        image_url: getImageUrl("Tata", "Harrier"),
        variants: [
            { variant_name: "Smart (O)", engine_specs: "2.0L Kryotec", fuel_type: "Diesel", transmission: "Manual", power_bhp: "168 bhp", torque_nm: "350 Nm", on_road_prices: generateStatePrices(1850000), features: { safety: ["6 Airbags", "ESP"], comfort_convenience: ["Auto AC"], interior: ["Basic Digital Cluster"], exterior: ["LED Projector Headlamps"] } },
            { variant_name: "Fearless+ Dark AT", engine_specs: "2.0L Kryotec", fuel_type: "Diesel", transmission: "Automatic", power_bhp: "168 bhp", torque_nm: "350 Nm", on_road_prices: generateStatePrices(2980000), features: { safety: ["7 Airbags", "ADAS", "360 Camera"], comfort_convenience: ["Ventilated Seats", "Powered Tailgate", "Dual Zone AC"], interior: ["12.3-inch Touchscreen", "10-speaker JBL System"], exterior: ["Panoramic Sunroof", "19-inch Alloy Wheels"] } }
        ]
    },
    {
        id: 14,
        brand_name: "Jeep",
        model_name: "Compass",
        model_year: 2024,
        body_type: "SUV",
        key_specs: { engine: "1956 cc", mileage: "17.1 kmpl", power: "168 bhp", seating_capacity: 5, boot_space_litres: 438 },
        fuel_options: ["Diesel"],
        image_url: getImageUrl("Jeep", "Compass"),
        variants: [
            { variant_name: "Sport 2.0 Diesel", engine_specs: "2.0L Multijet", fuel_type: "Diesel", transmission: "Manual", power_bhp: "168 bhp", torque_nm: "350 Nm", on_road_prices: generateStatePrices(2400000), features: { safety: ["2 Airbags", "ESC, TCS"], comfort_convenience: ["Dual Zone AC"], interior: ["8.4-inch Touchscreen"], exterior: ["LED Reflector Headlamps"] } },
            { variant_name: "Model S (O) 4x4 Diesel AT", engine_specs: "2.0L Multijet", fuel_type: "Diesel", transmission: "Automatic", power_bhp: "168 bhp", torque_nm: "350 Nm", on_road_prices: generateStatePrices(3850000), features: { safety: ["6 Airbags", "360 Camera"], comfort_convenience: ["Ventilated Front Seats", "Powered Tailgate"], interior: ["10.1-inch Touchscreen", "Alpine Sound System"], exterior: ["Panoramic Sunroof", "18-inch Alloy Wheels"] } }
        ]
    },
    {
        id: 15,
        brand_name: "Citroen",
        model_name: "C3 Aircross",
        model_year: 2024,
        body_type: "SUV",
        key_specs: { engine: "1199 cc", mileage: "18.5 kmpl", power: "109 bhp", seating_capacity: 7 },
        fuel_options: ["Petrol"],
        image_url: getImageUrl("Citroen", "C3 Aircross"),
        variants: [
            { variant_name: "You 5-Seater", engine_specs: "1.2L Turbo", fuel_type: "Petrol", transmission: "Manual", power_bhp: "109 bhp", torque_nm: "190 Nm", on_road_prices: generateStatePrices(1150000), features: { safety: ["2 Airbags", "ABS, EBD, ESP"], comfort_convenience: ["Manual AC"], interior: ["10.2-inch Touchscreen"], exterior: ["Halogen Headlamps"] } },
            { variant_name: "Max 7-Seater AT", engine_specs: "1.2L Turbo", fuel_type: "Petrol", transmission: "Automatic", power_bhp: "109 bhp", torque_nm: "205 Nm", on_road_prices: generateStatePrices(1610000), features: { safety: ["2 Airbags", "ABS, EBD, ESP, Hill Hold"], comfort_convenience: ["Auto AC", "Rear Wiper & Defogger"], interior: ["10.2-inch Touchscreen", "7-inch Digital Cluster"], exterior: ["Alloy Wheels", "Roof Rails"] } }
        ]
    }
];
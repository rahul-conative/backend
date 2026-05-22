#!/usr/bin/env node
'use strict';

const { connectMongo } = require('../../src/infrastructure/mongo/mongo-client');
const mongoose = require('mongoose');
const {
  AdminCountryModel,
  AdminStateModel,
  AdminCityModel,
  AdminZipCodeModel,
} = require('../../src/modules/admin/models/common-management.model');

const INDIA = { name: 'India', code: 'IN', dialCode: '+91', active: true };

const STATES = [
  { name: 'Andhra Pradesh',      key: 'AP' },
  { name: 'Arunachal Pradesh',   key: 'AR' },
  { name: 'Assam',               key: 'AS' },
  { name: 'Bihar',               key: 'BR' },
  { name: 'Chhattisgarh',        key: 'CG' },
  { name: 'Goa',                 key: 'GA' },
  { name: 'Gujarat',             key: 'GJ' },
  { name: 'Haryana',             key: 'HR' },
  { name: 'Himachal Pradesh',    key: 'HP' },
  { name: 'Jharkhand',           key: 'JH' },
  { name: 'Karnataka',           key: 'KA' },
  { name: 'Kerala',              key: 'KL' },
  { name: 'Madhya Pradesh',      key: 'MP' },
  { name: 'Maharashtra',         key: 'MH' },
  { name: 'Manipur',             key: 'MN' },
  { name: 'Meghalaya',           key: 'ML' },
  { name: 'Mizoram',             key: 'MZ' },
  { name: 'Nagaland',            key: 'NL' },
  { name: 'Odisha',              key: 'OD' },
  { name: 'Punjab',              key: 'PB' },
  { name: 'Rajasthan',           key: 'RJ' },
  { name: 'Sikkim',              key: 'SK' },
  { name: 'Tamil Nadu',          key: 'TN' },
  { name: 'Telangana',           key: 'TS' },
  { name: 'Tripura',             key: 'TR' },
  { name: 'Uttar Pradesh',       key: 'UP' },
  { name: 'Uttarakhand',         key: 'UK' },
  { name: 'West Bengal',         key: 'WB' },
  { name: 'Delhi',               key: 'DL' },
  { name: 'Jammu & Kashmir',     key: 'JK' },
];

// stateKey → [{ city, zips: [{ zip, area, lat, lng, serviceable, cod, express, charge, minOrder, days }] }]
const CITY_DATA = {
  MH: [
    { city: 'Mumbai', zips: [
      { zip: '400001', area: 'Fort', lat: 18.9322, lng: 72.8264, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '400002', area: 'Mandvi', lat: 18.9471, lng: 72.8369, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '400003', area: 'Masjid Bunder', lat: 18.9534, lng: 72.8376, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 1 },
      { zip: '400051', area: 'Bandra West', lat: 19.0596, lng: 72.8295, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '400069', area: 'Andheri West', lat: 19.1197, lng: 72.8464, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '400072', area: 'Andheri East', lat: 19.1136, lng: 72.8697, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '400076', area: 'Powai', lat: 19.1176, lng: 72.9060, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '400077', area: 'Kurla', lat: 19.0726, lng: 72.8801, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '400063', area: 'Malad West', lat: 19.1872, lng: 72.8483, serviceable: true, cod: false, express: false, charge: 40, minOrder: 299, days: 3 },
      { zip: '400097', area: 'Borivali West', lat: 19.2307, lng: 72.8567, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
    ]},
    { city: 'Pune', zips: [
      { zip: '411001', area: 'Pune Camp', lat: 18.5204, lng: 73.8567, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '411002', area: 'Shivajinagar', lat: 18.5308, lng: 73.8475, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '411004', area: 'Kothrud', lat: 18.5074, lng: 73.8077, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '411006', area: 'Aundh', lat: 18.5590, lng: 73.8076, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '411014', area: 'Hadapsar', lat: 18.5089, lng: 73.9259, serviceable: true, cod: false, express: false, charge: 50, minOrder: 499, days: 3 },
      { zip: '411021', area: 'Wakad', lat: 18.5974, lng: 73.7898, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '411028', area: 'Hinjewadi', lat: 18.5912, lng: 73.7389, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '411041', area: 'Baner', lat: 18.5591, lng: 73.7868, serviceable: false, cod: false, express: false, charge: 80, minOrder: 999, days: 5 },
      { zip: '411045', area: 'Kondhwa', lat: 18.4649, lng: 73.8927, serviceable: true, cod: true, express: false, charge: 40, minOrder: 299, days: 3 },
      { zip: '411057', area: 'Viman Nagar', lat: 18.5679, lng: 73.9143, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
    ]},
    { city: 'Nagpur', zips: [
      { zip: '440001', area: 'Nagpur City Centre', lat: 21.1458, lng: 79.0882, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '440010', area: 'Dharampeth', lat: 21.1356, lng: 79.0625, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '440016', area: 'Ramdaspeth', lat: 21.1307, lng: 79.0781, serviceable: true, cod: false, express: false, charge: 60, minOrder: 499, days: 3 },
      { zip: '440022', area: 'Trimurti Nagar', lat: 21.1519, lng: 79.0968, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
    ]},
  ],
  KA: [
    { city: 'Bengaluru', zips: [
      { zip: '560001', area: 'MG Road', lat: 12.9716, lng: 77.5946, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '560002', area: 'Shivajinagar', lat: 12.9900, lng: 77.6033, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '560008', area: 'Rajajinagar', lat: 13.0000, lng: 77.5558, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '560011', area: 'Malleshwaram', lat: 13.0030, lng: 77.5687, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '560017', area: 'Indiranagar', lat: 12.9784, lng: 77.6408, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '560034', area: 'Koramangala', lat: 12.9352, lng: 77.6245, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '560037', area: 'HSR Layout', lat: 12.9116, lng: 77.6389, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '560066', area: 'Whitefield', lat: 12.9698, lng: 77.7499, serviceable: true, cod: false, express: false, charge: 60, minOrder: 499, days: 3 },
      { zip: '560076', area: 'Electronic City', lat: 12.8458, lng: 77.6692, serviceable: true, cod: true, express: false, charge: 40, minOrder: 299, days: 2 },
      { zip: '560078', area: 'Jayanagar', lat: 12.9250, lng: 77.5938, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
    ]},
    { city: 'Mysuru', zips: [
      { zip: '570001', area: 'Mysuru City', lat: 12.2958, lng: 76.6394, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '570002', area: 'Saraswathipuram', lat: 12.2958, lng: 76.6394, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 3 },
      { zip: '570011', area: 'Vijayanagar', lat: 12.3052, lng: 76.6553, serviceable: false, cod: false, express: false, charge: 80, minOrder: 999, days: 5 },
    ]},
  ],
  DL: [
    { city: 'New Delhi', zips: [
      { zip: '110001', area: 'Connaught Place', lat: 28.6315, lng: 77.2167, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '110002', area: 'Darya Ganj', lat: 28.6458, lng: 77.2406, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '110005', area: 'Karol Bagh', lat: 28.6517, lng: 77.1913, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '110008', area: 'Rajender Nagar', lat: 28.6406, lng: 77.1818, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '110017', area: 'Safdarjung', lat: 28.5665, lng: 77.2036, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '110025', area: 'Lajpat Nagar', lat: 28.5640, lng: 77.2430, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '110044', area: 'Saket', lat: 28.5244, lng: 77.2066, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '110048', area: 'Hauz Khas', lat: 28.5494, lng: 77.1930, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '110065', area: 'Rohini', lat: 28.7357, lng: 77.1168, serviceable: true, cod: false, express: false, charge: 50, minOrder: 499, days: 3 },
      { zip: '110092', area: 'Patparganj', lat: 28.6162, lng: 77.2919, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
    ]},
  ],
  TN: [
    { city: 'Chennai', zips: [
      { zip: '600001', area: 'Chennai Fort', lat: 13.0827, lng: 80.2707, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '600002', area: 'Egmore', lat: 13.0785, lng: 80.2601, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '600006', area: 'Nungambakkam', lat: 13.0569, lng: 80.2425, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '600017', area: 'T Nagar', lat: 13.0418, lng: 80.2341, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '600028', area: 'Adyar', lat: 13.0063, lng: 80.2574, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '600040', area: 'Velachery', lat: 12.9790, lng: 80.2209, serviceable: true, cod: false, express: false, charge: 60, minOrder: 499, days: 3 },
      { zip: '600044', area: 'Tambaram', lat: 12.9249, lng: 80.1000, serviceable: false, cod: false, express: false, charge: 100, minOrder: 999, days: 5 },
      { zip: '600096', area: 'Anna Nagar', lat: 13.0850, lng: 80.2101, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
    ]},
    { city: 'Coimbatore', zips: [
      { zip: '641001', area: 'Coimbatore Town', lat: 11.0168, lng: 76.9558, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '641004', area: 'RS Puram', lat: 11.0040, lng: 76.9598, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 3 },
      { zip: '641018', area: 'Gandhipuram', lat: 11.0201, lng: 76.9694, serviceable: false, cod: false, express: false, charge: 80, minOrder: 499, days: 5 },
    ]},
  ],
  TS: [
    { city: 'Hyderabad', zips: [
      { zip: '500001', area: 'Charminar', lat: 17.3616, lng: 78.4747, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '500003', area: 'Secunderabad', lat: 17.4399, lng: 78.4983, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '500016', area: 'Banjara Hills', lat: 17.4126, lng: 78.4478, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '500034', area: 'Jubilee Hills', lat: 17.4247, lng: 78.4074, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '500081', area: 'HITEC City', lat: 17.4435, lng: 78.3772, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '500084', area: 'Gachibowli', lat: 17.4401, lng: 78.3489, serviceable: true, cod: false, express: false, charge: 60, minOrder: 499, days: 3 },
      { zip: '500072', area: 'Ameerpet', lat: 17.4374, lng: 78.4487, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '500008', area: 'Begumpet', lat: 17.4449, lng: 78.4674, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
    ]},
  ],
  GJ: [
    { city: 'Ahmedabad', zips: [
      { zip: '380001', area: 'Ahmedabad City', lat: 23.0225, lng: 72.5714, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '380006', area: 'Navrangpura', lat: 23.0375, lng: 72.5613, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '380009', area: 'Satellite', lat: 23.0263, lng: 72.5156, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '380054', area: 'Bodakdev', lat: 23.0440, lng: 72.5069, serviceable: false, cod: false, express: false, charge: 80, minOrder: 999, days: 5 },
      { zip: '380059', area: 'Gota', lat: 23.1022, lng: 72.5368, serviceable: true, cod: true, express: false, charge: 40, minOrder: 299, days: 3 },
    ]},
    { city: 'Surat', zips: [
      { zip: '395001', area: 'Surat City', lat: 21.1702, lng: 72.8311, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '395006', area: 'Adajan', lat: 21.1929, lng: 72.7886, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 3 },
      { zip: '395010', area: 'Vesu', lat: 21.1462, lng: 72.7773, serviceable: false, cod: false, express: false, charge: 80, minOrder: 499, days: 5 },
    ]},
  ],
  RJ: [
    { city: 'Jaipur', zips: [
      { zip: '302001', area: 'Jaipur City Centre', lat: 26.9124, lng: 75.7873, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '302002', area: 'Bani Park', lat: 26.9220, lng: 75.7963, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '302015', area: 'Mansarovar', lat: 26.8595, lng: 75.7715, serviceable: true, cod: false, express: false, charge: 60, minOrder: 499, days: 3 },
      { zip: '302020', area: 'Vaishali Nagar', lat: 26.9239, lng: 75.7310, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
    ]},
  ],
  UP: [
    { city: 'Lucknow', zips: [
      { zip: '226001', area: 'Lucknow City', lat: 26.8467, lng: 80.9462, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '226010', area: 'Gomti Nagar', lat: 26.8626, lng: 81.0018, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '226020', area: 'Indira Nagar', lat: 26.8948, lng: 81.0063, serviceable: true, cod: false, express: false, charge: 50, minOrder: 299, days: 3 },
    ]},
    { city: 'Varanasi', zips: [
      { zip: '221001', area: 'Varanasi City', lat: 25.3176, lng: 82.9739, serviceable: true, cod: true, express: false, charge: 40, minOrder: 0, days: 3 },
      { zip: '221005', area: 'Sigra', lat: 25.3203, lng: 82.9789, serviceable: false, cod: false, express: false, charge: 80, minOrder: 499, days: 5 },
    ]},
  ],
  WB: [
    { city: 'Kolkata', zips: [
      { zip: '700001', area: 'BBD Bagh', lat: 22.5726, lng: 88.3639, serviceable: true, cod: true, express: true, charge: 0, minOrder: 0, days: 1 },
      { zip: '700013', area: 'Bow Bazar', lat: 22.5749, lng: 88.3610, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '700019', area: 'Ballygunge', lat: 22.5266, lng: 88.3659, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '700026', area: 'Alipore', lat: 22.5337, lng: 88.3368, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '700091', area: 'Salt Lake City', lat: 22.5740, lng: 88.4139, serviceable: true, cod: false, express: false, charge: 60, minOrder: 499, days: 3 },
    ]},
  ],
  MP: [
    { city: 'Bhopal', zips: [
      { zip: '462001', area: 'Bhopal City', lat: 23.2599, lng: 77.4126, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '462003', area: 'Arera Colony', lat: 23.2174, lng: 77.4383, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '462011', area: 'Bairagarh', lat: 23.2929, lng: 77.3541, serviceable: false, cod: false, express: false, charge: 80, minOrder: 499, days: 5 },
    ]},
    { city: 'Indore', zips: [
      { zip: '452001', area: 'Indore City', lat: 22.7196, lng: 75.8577, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '452010', area: 'Vijay Nagar', lat: 22.7546, lng: 75.8938, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '452013', area: 'Scheme 54', lat: 22.7413, lng: 75.8669, serviceable: true, cod: false, express: false, charge: 50, minOrder: 299, days: 3 },
    ]},
  ],
  PB: [
    { city: 'Chandigarh', zips: [
      { zip: '160001', area: 'Sector 1', lat: 30.7333, lng: 76.7794, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '160017', area: 'Sector 17', lat: 30.7409, lng: 76.7800, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '160047', area: 'Sector 47', lat: 30.7106, lng: 76.7919, serviceable: true, cod: false, express: false, charge: 60, minOrder: 499, days: 3 },
    ]},
    { city: 'Ludhiana', zips: [
      { zip: '141001', area: 'Ludhiana City', lat: 30.9010, lng: 75.8573, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 3 },
      { zip: '141008', area: 'Model Town', lat: 30.9193, lng: 75.8600, serviceable: false, cod: false, express: false, charge: 80, minOrder: 499, days: 5 },
    ]},
  ],
  KL: [
    { city: 'Kochi', zips: [
      { zip: '682001', area: 'Fort Kochi', lat: 9.9312, lng: 76.2673, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '682016', area: 'Edapally', lat: 10.0262, lng: 76.3087, serviceable: true, cod: true, express: false, charge: 0, minOrder: 0, days: 2 },
      { zip: '682030', area: 'Kakkanad', lat: 10.0107, lng: 76.3491, serviceable: false, cod: false, express: false, charge: 80, minOrder: 499, days: 5 },
    ]},
  ],
  BR: [
    { city: 'Patna', zips: [
      { zip: '800001', area: 'Patna City', lat: 25.5941, lng: 85.1376, serviceable: true, cod: true, express: false, charge: 40, minOrder: 0, days: 3 },
      { zip: '800013', area: 'Boring Road', lat: 25.6150, lng: 85.1234, serviceable: true, cod: false, express: false, charge: 60, minOrder: 499, days: 4 },
    ]},
  ],
};

async function upsertCountry(data) {
  return AdminCountryModel.findOneAndUpdate(
    { code: data.code },
    { $set: data },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function upsertState(name, countryId) {
  return AdminStateModel.findOneAndUpdate(
    { countryId, name },
    { $set: { name, countryId, active: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function upsertCity(name, stateId, countryId) {
  const stateDoc = await AdminStateModel.findById(stateId);
  return AdminCityModel.findOneAndUpdate(
    { stateId, name },
    { $set: { name, stateId, active: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function upsertZipCode(zipData, countryId, stateId, cityId) {
  return AdminZipCodeModel.findOneAndUpdate(
    { cityId, zipCode: zipData.zip },
    {
      $set: {
        zipCode: zipData.zip,
        areaName: zipData.area,
        countryId,
        stateId,
        cityId,
        latitude: zipData.lat || null,
        longitude: zipData.lng || null,
        serviceable: zipData.serviceable,
        codAvailable: zipData.cod,
        expressDelivery: zipData.express,
        deliveryCharge: zipData.charge,
        minOrderAmount: zipData.minOrder,
        estimatedDeliveryDays: zipData.days,
        active: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function seedLocations() {
  await connectMongo();
  console.log('✓ MongoDB connected\n');

  // 1. Upsert India
  console.log('Seeding country: India...');
  const india = await upsertCountry(INDIA);
  console.log(`  ✓ India (_id: ${india._id})`);

  // 2. Upsert all states
  console.log('\nSeeding states...');
  const stateMap = {}; // key → stateDoc
  for (const s of STATES) {
    const doc = await upsertState(s.name, india._id);
    stateMap[s.key] = doc;
    process.stdout.write(`  ✓ ${s.name}\n`);
  }

  // 3. Upsert cities and zip codes
  console.log('\nSeeding cities and zip codes...');
  let cityCount = 0;
  let zipCount = 0;

  for (const [stateKey, cityList] of Object.entries(CITY_DATA)) {
    const stateDoc = stateMap[stateKey];
    if (!stateDoc) {
      console.warn(`  ⚠ State key ${stateKey} not found, skipping`);
      continue;
    }
    for (const cityEntry of cityList) {
      const cityDoc = await upsertCity(cityEntry.city, stateDoc._id, india._id);
      cityCount++;
      for (const zipEntry of cityEntry.zips) {
        await upsertZipCode(zipEntry, india._id, stateDoc._id, cityDoc._id);
        zipCount++;
      }
      console.log(`  ✓ ${cityEntry.city} (${stateKey}) — ${cityEntry.zips.length} zip codes`);
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   States  : ${STATES.length}`);
  console.log(`   Cities  : ${cityCount}`);
  console.log(`   Zip Codes: ${zipCount}`);

  await mongoose.disconnect();
  process.exit(0);
}

seedLocations().catch(err => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});

import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Country } from 'country-state-city';

// Custom CSS to hide Leaflet attribution and improve styling
const mapStyles = `
  .leaflet-control-attribution {
    display: none !important;
  }
  .leaflet-control-attribution.leaflet-control {
    display: none !important;
  }
  .leaflet-control-attribution.leaflet-compact-attribution {
    display: none !important;
  }
  .leaflet-container {
    border-radius: 8px;
    overflow: hidden;
    background: #ffffff !important;
    position: relative !important;
    z-index: 1 !important;
  }
  .leaflet-control-zoom {
    border: none !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    border-radius: 8px !important;
    width: 25px !important;
    height: auto !important;
    z-index: 2 !important;
  }
  .leaflet-control-zoom a {
    background: white !important;
    color: #374151 !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 6px !important;
    margin: 2px !important;
    transition: all 0.2s ease !important;
    width: 25px !important;
    height: 25px !important;
    line-height: 25px !important;
    font-size: 14px !important;
  }
  .leaflet-control-zoom a:hover {
    background: #f8fafc !important;
    color: #111827 !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  }
  .leaflet-popup-content-wrapper {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px) !important;
    border-radius: 12px !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    z-index: 1000 !important;
  }
  .leaflet-popup-tip {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px) !important;
  }
  .leaflet-popup-close-button {
    display: none !important;
  }
  .leaflet-popup {
    z-index: 1000 !important;
  }
  .leaflet-marker-icon {
    z-index: 10 !important;
  }
  .custom-pin {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    cursor: pointer;
    transition: transform 0.2s ease;
    z-index: 10 !important;
  }
  .custom-pin:hover {
    transform: scale(1.05);
    z-index: 11 !important;
  }
`;

interface CountryMapProps {
  mapColor?: string;
  mapStyle?: 'light';
  agencyData?: {
    userType: string;
    totalAgencies: number;
    countriesWithAgencies: number;
    countryStats: Array<{
      country: string;
      count: number;
      agencies: Array<{
        id: string;
        name: string;
        state: string | null;
        city: string | null;
      }>;
    }>;
    userAgency: any;
  };
  userRole?: string;
  userLocation?: {
    country: string;
    city?: string;
    region?: string;
  } | null;
  userCountry?: string;
}

// Country coordinates mapping
const countryCoordinates: { [key: string]: [number, number] } = {
  US: [39.8283, -98.5795], // United States
  IN: [20.5937, 78.9629], // India
  CN: [35.8617, 104.1954], // China
  JP: [36.2048, 138.2529], // Japan
  DE: [51.1657, 10.4515], // Germany
  GB: [55.3781, -3.436], // United Kingdom
  FR: [46.2276, 2.2137], // France
  CA: [56.1304, -106.3468], // Canada
  AU: [-25.2744, 133.7751], // Australia
  BR: [-14.235, -51.9253], // Brazil
  RU: [61.524, 105.3188], // Russia
  IT: [41.8719, 12.5674], // Italy
  ES: [40.4637, -3.7492], // Spain
  NL: [52.1326, 5.2913], // Netherlands
  SE: [60.1282, 18.6435], // Sweden
  NO: [60.472, 8.4689], // Norway
  DK: [56.2639, 9.5018], // Denmark
  FI: [61.9241, 25.7482], // Finland
  CH: [46.8182, 8.2275], // Switzerland
  AT: [47.5162, 14.5501], // Austria
  BE: [50.8503, 4.3517], // Belgium
  IE: [53.1424, -7.6921], // Ireland
  PT: [39.3999, -8.2245], // Portugal
  GR: [39.0742, 21.8243], // Greece
  PL: [51.9194, 19.1451], // Poland
  CZ: [49.8175, 15.473], // Czech Republic
  HU: [47.1625, 19.5033], // Hungary
  RO: [45.9432, 24.9668], // Romania
  BG: [42.7339, 25.4858], // Bulgaria
  HR: [45.1, 15.2], // Croatia
  SI: [46.0569, 14.5058], // Slovenia
  SK: [48.669, 19.699], // Slovakia
  LT: [55.1694, 23.8813], // Lithuania
  LV: [56.8796, 24.6032], // Latvia
  EE: [58.5953, 25.0136], // Estonia
  MT: [35.9375, 14.3754], // Malta
  CY: [35.1264, 33.4299], // Cyprus
  LU: [49.8153, 6.1296], // Luxembourg
  IS: [64.9631, -19.0208], // Iceland
  LI: [47.166, 9.5554], // Liechtenstein
  MC: [43.7384, 7.4246], // Monaco
  SM: [43.9424, 12.4578], // San Marino
  VA: [41.9029, 12.4534], // Vatican City
  AD: [42.5462, 1.6016], // Andorra
  AF: [33.9391, 67.71], // Afghanistan
  AL: [41.1533, 20.1683], // Albania
  DZ: [28.0339, 1.6596], // Algeria
  AO: [-11.2027, 17.8739], // Angola
  AR: [-38.4161, -63.6167], // Argentina
  AM: [40.0691, 45.0382], // Armenia
  AZ: [40.1431, 47.5769], // Azerbaijan
  BH: [26.0667, 50.5577], // Bahrain
  BD: [23.685, 90.3563], // Bangladesh
  BY: [53.7098, 27.9534], // Belarus
  BZ: [17.1899, -88.4976], // Belize
  BJ: [9.3077, 2.3158], // Benin
  BT: [27.5142, 90.4336], // Bhutan
  BO: [-16.2902, -63.5887], // Bolivia
  BA: [43.9159, 17.6791], // Bosnia and Herzegovina
  BW: [-22.3285, 24.6849], // Botswana
  BF: [12.2383, -1.5616], // Burkina Faso
  BI: [-3.3731, 29.9189], // Burundi
  KH: [12.5657, 104.991], // Cambodia
  CM: [7.3697, 12.3547], // Cameroon
  CV: [16.5388, -23.0418], // Cape Verde
  CF: [6.6111, 20.9394], // Central African Republic
  TD: [15.4542, 18.7322], // Chad
  CL: [-35.6751, -71.543], // Chile
  CO: [4.5709, -74.2973], // Colombia
  KM: [-11.6455, 43.3333], // Comoros
  CG: [-0.228, 15.8277], // Republic of the Congo
  CD: [-4.0383, 21.7587], // Democratic Republic of the Congo
  CR: [9.9281, -84.0907], // Costa Rica
  CI: [7.54, -5.5471], // Ivory Coast
  DJ: [11.8251, 42.5903], // Djibouti
  DO: [18.7357, -70.1627], // Dominican Republic
  EC: [-1.8312, -78.1834], // Ecuador
  EG: [26.8206, 30.8025], // Egypt
  SV: [13.7942, -88.8965], // El Salvador
  GQ: [1.6508, 10.2679], // Equatorial Guinea
  ER: [15.1794, 39.7823], // Eritrea
  ET: [9.145, 40.4897], // Ethiopia
  FJ: [-17.7134, 178.065], // Fiji
  GA: [-0.8037, 11.6094], // Gabon
  GM: [13.4432, -15.3101], // Gambia
  GE: [42.3154, 43.3569], // Georgia
  GH: [7.9465, -1.0232], // Ghana
  GT: [15.7835, -90.2308], // Guatemala
  GN: [9.9456, -9.6966], // Guinea
  GW: [11.8037, -15.1804], // Guinea-Bissau
  GY: [4.8604, -58.9302], // Guyana
  HT: [18.9712, -72.2852], // Haiti
  HN: [15.1999, -86.2419], // Honduras
  HK: [22.3193, 114.1694], // Hong Kong
  ID: [-0.7893, 113.9213], // Indonesia
  IR: [32.4279, 53.688], // Iran
  IQ: [33.2232, 43.6793], // Iraq
  IL: [31.0461, 34.8516], // Israel
  JM: [18.1096, -77.2975], // Jamaica
  JO: [30.5852, 36.2384], // Jordan
  KZ: [48.0196, 66.9237], // Kazakhstan
  KE: [-0.0236, 37.9062], // Kenya
  KW: [29.3117, 47.4818], // Kuwait
  KG: [41.2044, 74.7661], // Kyrgyzstan
  LA: [19.8563, 102.4955], // Laos
  LB: [33.8547, 35.8623], // Lebanon
  LS: [-29.6099, 28.2336], // Lesotho
  LR: [6.4281, -9.4295], // Liberia
  LY: [26.3351, 17.2283], // Libya
  MG: [-18.7669, 46.8691], // Madagascar
  MW: [-13.2543, 34.3015], // Malawi
  MY: [4.2105, 108.9758], // Malaysia
  ML: [17.5707, -3.9962], // Mali
  MR: [21.0079, -10.9408], // Mauritania
  MU: [-20.3484, 57.5522], // Mauritius
  MX: [23.6345, -102.5528], // Mexico
  MN: [46.8625, 103.8467], // Mongolia
  ME: [42.7087, 19.3744], // Montenegro
  MA: [31.7917, -7.0926], // Morocco
  MZ: [-18.6657, 35.5296], // Mozambique
  MM: [21.9162, 95.956], // Myanmar
  NA: [-22.9576, 18.4904], // Namibia
  NP: [28.3949, 84.124], // Nepal
  NZ: [-40.9006, 174.886], // New Zealand
  NI: [12.8654, -85.2072], // Nicaragua
  NE: [17.6078, 8.0817], // Niger
  NG: [9.082, 8.6753], // Nigeria
  OM: [21.4735, 55.9754], // Oman
  PK: [30.3753, 69.3451], // Pakistan
  PA: [8.538, -80.7821], // Panama
  PG: [-6.315, 143.9555], // Papua New Guinea
  PY: [-23.4425, -58.4438], // Paraguay
  PE: [-9.19, -75.0152], // Peru
  PH: [12.8797, 121.774], // Philippines
  QA: [25.3548, 51.1839], // Qatar
  SA: [23.8859, 45.0792], // Saudi Arabia
  SN: [14.4974, -14.4524], // Senegal
  RS: [44.0165, 21.0059], // Serbia
  SL: [8.4606, -11.7799], // Sierra Leone
  SG: [1.3521, 103.8198], // Singapore
  SO: [5.1521, 46.1996], // Somalia
  ZA: [-30.5595, 22.9375], // South Africa
  LK: [7.8731, 80.7718], // Sri Lanka
  SD: [12.8628, 30.2176], // Sudan
  SR: [3.9193, -56.0278], // Suriname
  SY: [34.8021, 38.9968], // Syria
  TW: [23.6978, 121.135], // Taiwan
  TJ: [38.5358, 71.3641], // Tajikistan
  TZ: [-6.369, 34.8888], // Tanzania
  TH: [15.87, 100.9925], // Thailand
  TL: [-8.8742, 125.7275], // Timor-Leste
  TG: [8.6195, 0.8248], // Togo
  TN: [33.8869, 9.5375], // Tunisia
  TR: [38.9637, 35.2433], // Turkey
  TM: [38.9697, 59.5563], // Turkmenistan
  UG: [1.3733, 32.2903], // Uganda
  AE: [23.4241, 53.8478], // United Arab Emirates
  UY: [-32.5228, -55.7658], // Uruguay
  UZ: [41.3775, 64.5853], // Uzbekistan
  VE: [6.4238, -66.5897], // Venezuela
  VN: [14.0583, 108.2772], // Vietnam
  YE: [15.5527, 48.5164], // Yemen
  ZM: [-13.1339, 27.8493], // Zambia
  ZW: [-19.0154, 29.1549], // Zimbabwe
};

const CountryMap: React.FC<CountryMapProps> = ({
  mapStyle = 'dark',
  agencyData,
  userRole: _userRole,
  userLocation: _userLocation,
  userCountry,
}) => {
  // Get all countries from the library for proper mapping
  const allCountries = Country.getAllCountries();

  // Create a comprehensive country name to code mapping
  const countryNameToCode: { [key: string]: string } = useMemo(() => {
    const mapping: { [key: string]: string } = {};

    // Add all countries from the library
    allCountries.forEach((country) => {
      mapping[country.name] = country.isoCode;
      mapping[country.isoCode] = country.isoCode; // Also map code to itself
    });

    // Add common variations and manual mappings
    mapping['United States'] = 'US';
    mapping['USA'] = 'US';
    mapping['US'] = 'US';
    mapping['India'] = 'IN';
    mapping['IN'] = 'IN';
    mapping['Afghanistan'] = 'AF';
    mapping['AF'] = 'AF';
    mapping['AFG'] = 'AF'; // ISO 3-letter code
    mapping['Islamic Republic of Afghanistan'] = 'AF';
    mapping['AX'] = 'FI'; // Åland Islands -> Finland
    mapping['Åland Islands'] = 'FI';

    return mapping;
  }, [allCountries]);

  // Create country data mapping for styling and tooltips
  const countryData = useMemo(() => {
    const data: { [key: string]: number } = {};
    const agencyInfo: { [key: string]: { count: number; agencies: any[] } } =
      {};

    if (agencyData?.countryStats) {
      agencyData.countryStats.forEach((stat) => {
        const countryCode = countryNameToCode[stat.country] || stat.country;

        if (data[countryCode]) {
          data[countryCode] += stat.count;
          agencyInfo[countryCode].count += stat.count;
          agencyInfo[countryCode].agencies = [
            ...agencyInfo[countryCode].agencies,
            ...stat.agencies,
          ];
        } else {
          data[countryCode] = stat.count;
          agencyInfo[countryCode] = {
            count: stat.count,
            agencies: [...stat.agencies],
          };
        }
      });
    }

    const userCountryData: { [key: string]: number } = {};
    if (userCountry) {
      const userCountryCode = countryNameToCode[userCountry] || userCountry;
      userCountryData[userCountryCode] = 1;
    }

    return { data, agencyInfo, userCountryData };
  }, [agencyData, countryNameToCode, userCountry]);

  // Get map tile URL based on style
  const getMapTileUrl = () => {
    switch (mapStyle) {
      case 'dark':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      case 'light':
        return 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      default:
        return 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';
    }
  };

  // Create custom pin icons
  const createPinIcon = (color: string) => {
    return L.divIcon({
      html: `
        <div style="
          width: 12px;
          height: 12px;
          background: ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          position: relative;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        ">
          <div style="
            width: 6px;
            height: 6px;
            background: white;
            border-radius: 50%;
            position: absolute;
            top: 3px;
            left: 3px;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      className: 'custom-pin',
      iconSize: [12, 12],
      iconAnchor: [6, 12],
    });
  };

  // Inject styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = mapStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Create markers for countries with data
  const markers = useMemo(() => {
    const markerElements: JSX.Element[] = [];

    // Add markers for countries with agencies
    Object.entries(countryData.data).forEach(([countryCode, count]) => {
      const coordinates = countryCoordinates[countryCode];
      if (coordinates) {
        const isUserCountry = countryData.userCountryData[countryCode] === 1;

        markerElements.push(
          <Marker
            key={`agency-${countryCode}`}
            position={coordinates}
            icon={createPinIcon(isUserCountry ? '#7152F3' : '#3b82f6')}
            eventHandlers={{
              mouseover: (e: any) => {
                e.target.openPopup();
              },
              mouseout: (e: any) => {
                e.target.closePopup();
              },
            }}
          >
            <Popup>
              <div
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  lineHeight: '1.3',
                }}
              >
                <div
                  style={{
                    fontWeight: '600',
                    marginBottom: '4px',
                    color: '#111827',
                  }}
                >
                  {allCountries.find((c) => c.isoCode === countryCode)?.name ||
                    countryCode}
                </div>
                <div style={{ color: '#059669', fontWeight: '500' }}>
                  {count} {count === 1 ? 'Agency' : 'Agencies'}
                </div>
                {isUserCountry && (
                  <div
                    style={{
                      color: '#7c3aed',
                      fontWeight: '600',
                      marginTop: '4px',
                    }}
                  >
                    You are here!
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      }
    });

    // Add markers for user country if not already added
    Object.entries(countryData.userCountryData).forEach(([countryCode, _]) => {
      if (!countryData.data[countryCode]) {
        const coordinates = countryCoordinates[countryCode];
        if (coordinates) {
          markerElements.push(
            <Marker
              key={`user-${countryCode}`}
              position={coordinates}
              icon={createPinIcon('#7152F3')}
              eventHandlers={{
                mouseover: (e: any) => {
                  e.target.openPopup();
                },
                mouseout: (e: any) => {
                  e.target.closePopup();
                },
              }}
            >
              <Popup>
                <div
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    lineHeight: '1.3',
                  }}
                >
                  <div
                    style={{
                      fontWeight: '600',
                      marginBottom: '4px',
                      color: '#111827',
                    }}
                  >
                    {allCountries.find((c) => c.isoCode === countryCode)
                      ?.name || countryCode}
                  </div>
                  <div
                    style={{
                      color: '#7c3aed',
                      fontWeight: '600',
                      marginTop: '4px',
                    }}
                  >
                    You are here!
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        }
      }
    });

    return markerElements;
  }, [countryData, allCountries]);

  return (
    <div
      style={{
        width: '100%',
        height: '251px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
        isolation: 'isolate', // Creates a new stacking context
      }}
      className="rounded-lg overflow-hidden shadow-sm"
    >
      <MapContainer
        center={[30, 0]}
        zoom={1}
        style={{
          height: '100%',
          width: '100%',
          position: 'relative',
          zIndex: 1
        }}
        zoomControl={true}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        dragging={true}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        minZoom={1}
        maxZoom={4}
      >
        <TileLayer url={getMapTileUrl()} attribution="" />
        {markers}
      </MapContainer>
    </div>
  );
};

export default CountryMap;

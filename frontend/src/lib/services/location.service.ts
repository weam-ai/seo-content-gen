import axios from 'axios';

interface Location {
  value: string;
  label: string;
  country?: string;
  state?: string;
  city?: string;
}

let locations: Location[] = [];

// Fetch and cache the location data
const loadLocations = async () => {
  if (locations.length === 0) {
    try {
      const response = await axios.get<Location[]>(`${import.meta.env.VITE_FRONTEND_URL}locationOptions.json`);
      console.log(
        'Successfully loaded locationOptions.json:',
        response.data.length,
        'items'
      );
      locations = response.data;
    } catch (error) {
      console.error('Failed to load locationOptions.json', error);
      locations = []; // Ensure locations is an empty array on error
    }
  }
  return locations;
};

class LocationService {
  async getLocations(page: number, search: string) {
    await loadLocations();
    console.log(`Searching for "${search}" in ${locations.length} locations`);

    const filteredLocations = locations
      .filter((location) =>
        location.label.toLowerCase().includes(search.toLowerCase())
      )
      .map((location) => {
        const parts = [location.city, location.state, location.country].filter(
          Boolean
        );
        const displayLabel = parts.join(', ');
        return {
          value: location.value,
          label: displayLabel || location.label, // Fallback to original label
        };
      });

    console.log(`Found ${filteredLocations.length} matching locations`);

    const pageSize = 50;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const paginatedLocations = filteredLocations.slice(startIndex, endIndex);

    console.log(
      `Returning page ${page} with ${paginatedLocations.length} locations`
    );

    return {
      options: paginatedLocations,
      hasMore: endIndex < filteredLocations.length,
    };
  }
}

const locationService = new LocationService();
export default locationService;

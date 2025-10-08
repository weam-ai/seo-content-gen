import axios from 'axios';

interface Location {
  value: string;
  label: string;
}

let locations: Location[] = [];

// Fetch and cache the location data
const loadLocations = async () => {
  if (locations.length === 0) {
    try {
      const response = await axios.get<Location[]>(
        `${import.meta.env.VITE_FRONTEND_URL}locationOptions.json`
      );
      // Map country.json to simplified { value, label }
      locations = (Array.isArray(response.data) ? response.data : [])
        .map((item: any) => ({
          value: String(item?.shortCode || item?.code || item?.nm || '')
            .toLowerCase(),
          label: String(item?.nm || item?.code || '').trim(),
        }))
        .filter((item: Location) => item.value && item.label);
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

    const filteredLocations = locations.filter((location) =>
      location.label.toLowerCase().includes(search.toLowerCase())
    );

    const pageSize = 50;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const paginatedLocations = filteredLocations.slice(startIndex, endIndex);

    return {
      options: paginatedLocations,
      hasMore: endIndex < filteredLocations.length,
    };
  }
}

const locationService = new LocationService();
export default locationService;

interface GeoLocation {
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  isp: string;
  timezone: string;
}

/**
 * Get geolocation data for an IP address
 */
export async function getGeoLocation(ip: string): Promise<GeoLocation | null> {
  try {
    // In production, use a proper IP geolocation service
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();

    if (data.error) {
      console.error('Geolocation error:', data.error);
      return null;
    }

    return {
      country: data.country_name,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      isp: data.org,
      timezone: data.timezone
    };
  } catch (error) {
    console.error('Failed to get geolocation:', error);
    return null;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * Check if location is suspicious based on user history
 */
export function isSuspiciousLocation(
  currentLocation: GeoLocation,
  previousLocations: GeoLocation[],
  timeThreshold: number = 24 * 60 * 60 * 1000 // 24 hours in ms
): boolean {
  if (previousLocations.length === 0) return false;

  const recentLocations = previousLocations.filter(loc => 
    Date.now() - new Date(loc.timestamp).getTime() < timeThreshold
  );

  for (const prevLoc of recentLocations) {
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      prevLoc.latitude,
      prevLoc.longitude
    );

    // Flag if distance > 500km in less than timeThreshold
    if (distance > 500) {
      return true;
    }
  }

  return false;
}
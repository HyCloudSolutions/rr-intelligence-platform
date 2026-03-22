import os
import requests
from typing import List, Dict, Tuple, Any

MAPBOX_BASE_URL = "https://api.mapbox.com/optimized-trips/v1/mapbox"

def get_optimized_route(
    start_lng: float, 
    start_lat: float, 
    waypoints: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:

    """
    Given a starting coordinate and list of waypoints with {'id', 'latitude', 'longitude'},
    calls Mapbox Optimization API to reorder waypoints in the most travel-efficient sequence.
    
    Max 12 coordinates supported (1 start + 11 stops) due to Mapbox limits.
    """
    access_token = os.getenv("MAPBOX_ACCESS_TOKEN")
    if not access_token:
        # Fallback to returning original order if token is missing
        print("WARNING: MAPBOX_ACCESS_TOKEN not set. Skipping routing optimization.")
        return waypoints

    if not waypoints:
        return []

    # Mapbox accepts semi-colon separated longitude,latitude strings
    coord_strings = [f"{start_lng},{start_lat}"]
    for point in waypoints[:11]: # Limit to 11 stops to stay under Mapbox's 12 cap
        coord_strings.append(f"{point['longitude']},{point['latitude']}")

    coord_query = ";".join(coord_strings)
    
    url = f"{MAPBOX_BASE_URL}/driving/{coord_query}"
    params = {
        "access_token": access_token,
        "source": "first",     # Start at the provided coordinates
        "destination": "any",  # Any endpoint
        "roundtrip": "false"   # We don't require returning back to start
    }

    try:
        response = requests.get(url, params=params)
        if response.status_code != 200:
            print(f"Mapbox Optimization API Error: {response.text}")
            return waypoints # Fallback

        data = response.json()
        if "waypoints" not in data:
            return waypoints

        # Mapbox returns waypoints with a 'waypoint_index' mapping back to core list
        # index 0 is always the start point.
        sorted_waypoints = []
        
        # Sort waypoints by their trip sequence/index which Mapbox provides
        ordered_trips = data.get("waypoints", [])
        # Ordered_trips comes back with elements that have core fields:
        # 'waypoint_index' = original list index, 'trips_index' = sequence index
        sorted_nodes = sorted(ordered_trips, key=lambda x: x.get("waypoint_index", 0))

        # Re-map back to user payload. Note index 0 of coord_strings was start.
        # So waypoint 1 relates to index 0 of the input `waypoints` array!
        sorted_indices = []
        for trip_node in sorted(ordered_trips, key=lambda x: x.get("trips_index", 0)):
             original_idx = trip_node.get("waypoint_index", 0)
             if original_idx > 0: # Skip the start coordinate node
                 sorted_indices.append(original_idx - 1)

        # Build re-ordered stops payload
        for idx in sorted_indices:
            if idx < len(waypoints):
                sorted_waypoints.append(waypoints[idx])

        # Append any remaining that were sliced out or didn't map just in case
        seen_ids = {p['id'] for p in sorted_waypoints}
        for point in waypoints:
            if point['id'] not in seen_ids:
                sorted_waypoints.append(point)

        return sorted_waypoints

    except Exception as e:
        print(f"Failed to query Mapbox route: {str(e)}")
        return waypoints

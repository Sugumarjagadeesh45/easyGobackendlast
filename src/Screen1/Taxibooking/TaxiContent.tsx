import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated,
  ScrollView,
  Switch,
  Modal,
  Platform,
} from 'react-native';
import MapView, { Marker, Region, Polyline } from 'react-native-maps';
import LocationInput from './LocationInput';
import RideTypeSelector from './RideTypeSelector';
import BookRideButton from './BookRideButton';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
// Professional SVG icons with improved design
const TaxiIcon = ({ color = '#000000', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    {/* Taxi body */}
    <Path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" fill={color} />
    {/* Taxi windows */}
    <Path d="M5 11l1.5-4.5h11L19 11H5z" fill="#FFFFFF" opacity="0.8" />
    {/* Taxi sign on top */}
    <Rect x="10" y="3" width="4" height="2" rx="0.5" fill={color} />
    <Rect x="9" y="5" width="6" height="1" rx="0.5" fill={color} />
    {/* Wheels */}
    <Circle cx="6.5" cy="16" r="1.5" fill={color} />
    <Circle cx="17.5" cy="16" r="1.5" fill={color} />
  </Svg>
);
const PortIcon = ({ color = '#000000', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill={color} />
    <Path d="M3 6h14v2H3z" fill={color} opacity="0.7" />
    <Path d="M5 10h12v1H5z" fill={color} opacity="0.5" />
  </Svg>
);
const BikeIcon = ({ color = '#000000', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    {/* Bike frame */}
    <Path d="M6.5 16l3.5-6l3 5l2-3l3 4" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {/* Seat */}
    <Path d="M10 10c0-1.1 0.9-2 2-2s2 0.9 2 2-0.9 2-2 2-2-0.9-2-2z" fill={color} />
    {/* Handlebars */}
    <Path d="M14 11c0-1.1 0.9-2 2-2s2 0.9 2 2-0.9 2-2 2-2-0.9-2-2z" fill={color} />
    {/* Front wheel */}
    <Circle cx="18" cy="16" r="3" stroke={color} strokeWidth="2" fill="none" />
    <Circle cx="18" cy="16" r="1" fill={color} />
    {/* Rear wheel */}
    <Circle cx="6" cy="16" r="3" stroke={color} strokeWidth="2" fill="none" />
    <Circle cx="6" cy="16" r="1" fill={color} />
    {/* Pedals */}
    <Circle cx="10" cy="16" r="1.5" stroke={color} strokeWidth="1.5" fill="none" />
    <Path d="M10 14.5v3M8.5 16h3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    {/* Chain */}
    <Path d="M10 16c-1.5 0-2.5-1-2.5-2.5" stroke={color} strokeWidth="1" fill="none" strokeDasharray="1,1" />
    {/* Green rider */}
    <Circle cx="12" cy="8" r="2" fill="#4CAF50" />
  </Svg>
);
interface Location {
  latitude: number;
  longitude: number;
}
interface Vehicle {
  id: string;
  type: 'bike' | 'taxi' | 'port';
  position: Location;
  startIndex: number;
}
interface TaxiContentProps {
  loadingLocation: boolean;
  currentLocation: Location | null;
  lastSavedLocation: Location | null;
  pickup: string;
  dropoff: string;
  suggestions: { id: string; name: string }[];
  showDropoffSuggestions: boolean;
  handlePickupChange: (text: string) => void;
  handleDropoffChange: (text: string) => void;
  selectSuggestion: (suggestion: { id: string; name: string }) => void;
  selectingPickup: boolean;
  setSelectingPickup: (value: boolean) => void;
  selectingDropoff: boolean;
  setSelectingDropoff: (value: boolean) => void;
  setPickup: (value: string) => void;
  setDropoff: (value: string) => void;
}
const GOOGLE_API_KEY = 'AIzaSyA9Ef953b2mO_rr940k-3OclHSZp3ldM2o';
const TaxiContent: React.FC<TaxiContentProps> = ({
  loadingLocation,
  currentLocation,
  lastSavedLocation,
  pickup,
  dropoff,
  suggestions,
  showDropoffSuggestions,
  handlePickupChange,
  handleDropoffChange,
  selectSuggestion,
  selectingPickup,
  setSelectingPickup,
  selectingDropoff,
  setSelectingDropoff,
  setPickup,
  setDropoff,
}) => {
  const [selectedRideType, setSelectedRideType] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<Location | null>(null);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
  const [routeCoords, setRouteCoords] = useState<Location[]>([]);
  const [showRoute, setShowRoute] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [showPricePanel, setShowPricePanel] = useState(false);
  const [wantReturn, setWantReturn] = useState(false);
  const [distance, setDistance] = useState<string>('');
  const [travelTime, setTravelTime] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingOTP, setBookingOTP] = useState<string>('');
  
  // Multiple vehicles state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const vehiclesAnimationTimer = useRef<NodeJS.Timeout | null>(null);
  
  const mapRef = useRef<MapView>(null);
  const panelAnimation = useRef(new Animated.Value(0)).current;
  
  // Animate price panel
  useEffect(() => {
    if (showPricePanel) {
      Animated.timing(panelAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(panelAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showPricePanel]);
  
  // Vehicle animation for multiple vehicles
  useEffect(() => {
    if (showRoute && routeCoords.length > 0 && selectedRideType) {
      // Generate vehicles for the selected type with specific counts
      const newVehicles: Vehicle[] = [];
      let vehicleCount = 0;
      
      switch (selectedRideType) {
        case 'bike':
          vehicleCount = 4;
          break;
        case 'taxi':
          vehicleCount = 3;
          break;
        case 'port':
          vehicleCount = 3;
          break;
        default:
          vehicleCount = 0;
      }
      
      if (vehicleCount > 0) {
        const step = Math.floor(routeCoords.length / vehicleCount);
        
        for (let i = 0; i < vehicleCount; i++) {
          const startIndex = i * step;
          newVehicles.push({
            id: `${selectedRideType}-${i}`,
            type: selectedRideType as 'bike' | 'taxi' | 'port',
            position: routeCoords[startIndex],
            startIndex: startIndex,
          });
        }
      }
      
      setVehicles(newVehicles);
      startVehiclesAnimation();
    } else {
      stopVehiclesAnimation();
      setVehicles([]);
    }
    
    return () => {
      stopVehiclesAnimation();
    };
  }, [showRoute, routeCoords, selectedRideType]);
  
  const startVehiclesAnimation = () => {
    stopVehiclesAnimation();
    
    if (routeCoords.length === 0) return;
    
    vehiclesAnimationTimer.current = setInterval(() => {
      setVehicles(prevVehicles => {
        return prevVehicles.map(vehicle => {
          // Move each vehicle to the next point in the route
          const nextIndex = (vehicle.startIndex + 1) % routeCoords.length;
          return {
            ...vehicle,
            position: routeCoords[nextIndex],
            startIndex: nextIndex,
          };
        });
      });
    }, 6000); // ADJUSTED: Changed from 5000 to 10000 (10 seconds) for slower movement
  };
  
  const stopVehiclesAnimation = () => {
    if (vehiclesAnimationTimer.current) {
      clearInterval(vehiclesAnimationTimer.current);
      vehiclesAnimationTimer.current = null;
    }
  };
  
  // Calculate estimated price
  const calculatePrice = () => {
    if (!pickupLocation || !dropoffLocation || !routeCoords.length) return null;
    
    // Simple distance calculation (Haversine formula)
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(dropoffLocation.latitude - pickupLocation.latitude);
    const dLon = toRad(dropoffLocation.longitude - pickupLocation.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(pickupLocation.latitude)) *
      Math.cos(toRad(dropoffLocation.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    
    // Price calculation based on ride type
    let baseFare = 0;
    let perKm = 0;
    switch (selectedRideType) {
      case 'bike':
        baseFare = 20;
        perKm = 8;
        break;
      case 'taxi':
        baseFare = 50;
        perKm = 15;
        break;
      case 'port':
        baseFare = 80;
        perKm = 25;
        break;
      default:
        baseFare = 50;
        perKm = 15;
    }
    
    // Double the price if return trip is selected
    const multiplier = wantReturn ? 2 : 1;
    return Math.round((baseFare + (distance * perKm)) * multiplier);
  };
  
  useEffect(() => {
    if (pickupLocation && dropoffLocation && routeCoords.length > 0) {
      const price = calculatePrice();
      setEstimatedPrice(price);
    }
  }, [pickupLocation, dropoffLocation, routeCoords, selectedRideType, wantReturn]);
  
  // Fetch address by coordinates
  const fetchAddress = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
      );
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      }
      return 'Unknown Location';
    } catch (error) {
      console.error('Geocoding error:', error);
      return 'Error fetching address';
    }
  };
  
  // Fetch route between pickup & dropoff
  const fetchRoute = async (pickup: Location, dropoff: Location) => {
    setLoadingRoute(true);
    setApiError(null);
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${pickup.latitude},${pickup.longitude}&destination=${dropoff.latitude},${dropoff.longitude}&key=${GOOGLE_API_KEY}`
      );
      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const points = decodePolyline(response.data.routes[0].overview_polyline.points);
        setRouteCoords(points);
        
        // Extract distance and duration from the response
        const leg = response.data.routes[0].legs[0];
        setDistance(leg.distance.text);
        setTravelTime(leg.duration.text);
        
        // Adjust map to show the entire route
        const northeast = response.data.routes[0].bounds.northeast;
        const southwest = response.data.routes[0].bounds.southwest;
        const region = {
          latitude: (northeast.lat + southwest.lat) / 2,
          longitude: (northeast.lng + southwest.lng) / 2,
          latitudeDelta: Math.abs(northeast.lat - southwest.lat) * 1.5,
          longitudeDelta: Math.abs(northeast.lng - southwest.lng) * 1.5,
        };
        setMapRegion(region);
        mapRef.current?.animateToRegion(region, 1000);
      } else if (response.data.status === 'REQUEST_DENIED') {
        setApiError('API Key Error: Directions API is not enabled for this project. Please enable it in Google Cloud Console.');
        Alert.alert(
          'API Key Error',
          'The Directions API is not enabled for this project. Please enable it in the Google Cloud Console and wait 5-10 minutes for changes to take effect.'
        );
      } else {
        setApiError(`Route Error: ${response.data.status}`);
        Alert.alert('Route Error', `Could not find route: ${response.data.status}`);
      }
    } catch (error: any) {
      console.error("Error fetching route:", error.response?.data || error.message);
      setApiError('Network Error: Failed to fetch route');
      Alert.alert('Route Error', 'Failed to fetch route. Please check your internet connection.');
    } finally {
      setLoadingRoute(false);
    }
  };
  
  // Polyline decoder
  const decodePolyline = (t: string) => {
    let points: Location[] = [];
    let index = 0, lat = 0, lng = 0;
    while (index < t.length) {
      let b, shift = 0, result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };
  
  // Handle See My Route button press
  const handleSeeRoute = () => {
    if (!pickupLocation || !dropoffLocation) {
      Alert.alert('Location Missing', 'Please select both pickup and dropoff locations');
      return;
    }
    setShowRoute(true);
    fetchRoute(pickupLocation, dropoffLocation);
  };
  
  // Handle ride type selection
  const handleRideTypeSelect = (type: string) => {
    // If the same type is selected again, deselect it
    if (selectedRideType === type) {
      setSelectedRideType(null);
      setShowPricePanel(false);
    } else {
      setSelectedRideType(type);
      setShowPricePanel(true);
      
      // Calculate price if route is already shown
      if (pickupLocation && dropoffLocation && routeCoords.length > 0) {
        const price = calculatePrice();
        setEstimatedPrice(price);
      }
    }
  };
  
  // Handle book ride
  const handleBookRide = () => {
    if (!estimatedPrice) {
      Alert.alert('Error', 'Price calculation failed. Please try again.');
      return;
    }
    
    // Generate a random 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setBookingOTP(otp);
    setShowConfirmModal(true);
  };
  
  // Handle navigation to booking screen
  const handleNavigateToBooking = () => {
    handleBookRide();
  };
  
  // Confirm booking
  const handleConfirmBooking = () => {
    // Print locations to console
    console.log('Pickup Location:', pickupLocation);
    console.log('Dropoff Location:', dropoffLocation);
    
    // Simulate sending to backend
    console.log('Sending booking data to backend...');
    // In a real app, you would make an API call here
    
    // Close the modal
    setShowConfirmModal(false);
    
    // REMOVED: The second alert that was showing here
    // The modal already shows the confirmation, so we don't need this additional alert
  };
  
  // Select pickup on map
  const handleSelectPickupOnMap = async () => {
    setSelectingPickup(true);
    setSelectingDropoff(false);
    try {
      if (currentLocation) {
        setMapCenter(currentLocation);
        mapRef.current?.animateToRegion({
          ...currentLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    } catch (error) {
      if (currentLocation) setMapCenter(currentLocation);
    }
  };
  
  // Select dropoff on map
  const handleSelectDropoffOnMap = async () => {
    setSelectingDropoff(true);
    setSelectingPickup(false);
    try {
      if (currentLocation) {
        setMapCenter(currentLocation);
        mapRef.current?.animateToRegion({
          ...currentLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    } catch (error) {
      if (currentLocation) setMapCenter(currentLocation);
    }
  };
  
  // Track map movement
  const handleRegionChange = (region: Region) => {
    if (selectingPickup || selectingDropoff) {
      setIsMapMoving(true);
      setMapCenter({
        latitude: region.latitude,
        longitude: region.longitude,
      });
    }
  };
  
  const handleRegionChangeComplete = async (region: Region) => {
    if ((selectingPickup || selectingDropoff) && isMapMoving) {
      setIsMapMoving(false);
      const center = {
        latitude: region.latitude,
        longitude: region.longitude,
      };
      const address = await fetchAddress(center.latitude, center.longitude);
      if (selectingPickup) {
        setPickupLocation(center);
        setPickup(address);
      } else if (selectingDropoff) {
        setDropoffLocation(center);
        setDropoff(address);
      }
    }
  };
  
  // Custom map style - clean and minimal
        const customMapStyle = [
            {
                "elementType": "geometry",
                "stylers": [{ "color": "#f5f5f5" }]
            },
            {
                "elementType": "labels.icon",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#616161" }]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [{ "color": "#f5f5f5" }]
            },
            {
                "featureType": "administrative.land_parcel",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "administrative.neighborhood",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "poi",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{ "color": "#ffffff" }]
            },
            {
                "featureType": "road",
                "elementType": "labels.icon",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "transit",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{ "color": "#c9c9c9" }]
            }
        ];
  
  // Render vehicle icon based on type using improved SVGs
  const renderVehicleIcon = (type: 'bike' | 'taxi' | 'port', size: number = 24, color: string = '#000000') => {
    try {
      switch (type) {
        case 'bike':
          return <BikeIcon color={color} size={size} />;
        case 'taxi':
          return <TaxiIcon color={color} size={size} />;
        case 'port':
          return <PortIcon color={color} size={size} />;
        default:
          return <TaxiIcon color={color} size={size} />;
      }
    } catch (error) {
      console.error('Error rendering vehicle icon:', error);
      return <TaxiIcon color={color} size={size} />;
    }
  };
  
  // Check if all details are filled to enable the book ride button
  const isBookRideButtonEnabled = pickupLocation && dropoffLocation && selectedRideType && estimatedPrice !== null;
  
  return (
    <View style={styles.contentContainer}>
      <View style={styles.mapContainer}>
        {loadingLocation ? (
          <Text style={styles.mapLoadingText}>Loading map...</Text>
        ) : currentLocation ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            region={mapRegion || undefined}
            onRegionChange={handleRegionChange}
            onRegionChangeComplete={handleRegionChangeComplete}
            customMapStyle={customMapStyle}
            legalLabelInsets={{ bottom: -100, right: -100 }} // Hide Google logo
          >
            {/* Route polyline */}
            {showRoute && routeCoords.length > 0 && (
              <Polyline
                coordinates={routeCoords}
                strokeColor="#4CAF50"
                strokeWidth={4}
                lineDashPattern={[0]}
              />
            )}
            
            {/* Current location marker - only show when not selecting locations and no route is shown and both pickup/dropoff not selected */}
            {!selectingPickup && !selectingDropoff && !showRoute && currentLocation && (!pickupLocation || !dropoffLocation) && (
              <Marker coordinate={currentLocation} title="My Current Location">
                <View style={styles.currentLocationMarker}>
                  <MaterialIcons name="my-location" size={24} color="#4CAF50" />
                </View>
              </Marker>
            )}
            
            {/* Pickup marker */}
            {pickupLocation && !selectingPickup && (
              <Marker coordinate={pickupLocation} title="Pickup Location">
                <View style={styles.pickupLocationMarker}>
                  <MaterialIcons name="location-on" size={24} color="#4CAF50" />
                </View>
              </Marker>
            )}
            
            {/* Dropoff marker */}
            {dropoffLocation && !selectingDropoff && (
              <Marker coordinate={dropoffLocation} title="Dropoff Location">
                <View style={styles.dropoffLocationMarker}>
                  <MaterialIcons name="location-on" size={24} color="#F44336" />
                </View>
              </Marker>
            )}
            
            {/* Multiple vehicle markers - shows when route is visible and ride type is selected */}
            {showRoute && selectedRideType && vehicles.map(vehicle => (
              <Marker
                key={vehicle.id}
                coordinate={vehicle.position}
                // Removed title to avoid showing "bike0", "bike1", etc.
              >
                <View style={styles.vehicleMarkerContainer}>
                  {renderVehicleIcon(vehicle.type, 30, '#000000')}
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          <Text style={styles.mapLoadingText}>Could not get location. Check permissions.</Text>
        )}
        
        {/* Center marker when selecting */}
        {(selectingPickup || selectingDropoff) && mapCenter && (
          <View style={styles.centerMarkerContainer}>
            <MaterialIcons
              name={selectingPickup ? "my-location" : "location-on"}
              size={30}
              color={selectingPickup ? "#4CAF50" : "#F44336"}
            />
          </View>
        )}
      </View>
      
      <LocationInput
        pickup={pickup}
        dropoff={dropoff}
        handlePickupChange={handlePickupChange}
        handleDropoffChange={handleDropoffChange}
        showDropoffSuggestions={showDropoffSuggestions}
        setSelectingPickup={setSelectingPickup}
        setSelectingDropoff={setSelectingDropoff}
        onSelectPickupOnMap={handleSelectPickupOnMap}
        onSelectDropoffOnMap={handleSelectDropoffOnMap}
        selectingPickup={selectingPickup}
        selectingDropoff={selectingDropoff}
      />
      
      {showDropoffSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.suggestionItem}
              onPress={() => selectSuggestion(item)}
            >
              <MaterialIcons name="location-on" size={20} color="#A9A9A9" style={styles.suggestionIcon} />
              <Text style={styles.suggestionText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Distance and Travel Time Display */}
      {(distance || travelTime) && (
        <View style={styles.distanceTimeContainer}>
          <View style={styles.distanceTimeItem}>
            <Text style={styles.distanceTimeLabel}>DISTANCE:</Text>
            <Text style={styles.distanceTimeValue}>{distance || '---'}</Text>
          </View>
          <View style={styles.distanceTimeItem}>
            <Text style={styles.distanceTimeLabel}>TRAVEL TIME:</Text>
            <Text style={styles.distanceTimeValue}>{travelTime || '---'}</Text>
          </View>
        </View>
      )}
      
      {apiError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{apiError}</Text>
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.seeRouteButton, (!pickupLocation || !dropoffLocation) && styles.disabledButton]}
        onPress={handleSeeRoute}
        disabled={!pickupLocation || !dropoffLocation || loadingRoute}
      >
        {loadingRoute ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.seeRouteButtonText}>See My Route</Text>
        )}
      </TouchableOpacity>
      
      <RideTypeSelector
        selectedRideType={selectedRideType}
        setSelectedRideType={handleRideTypeSelect}
      />
      
      {/* BOOK RIDE Button */}
      <TouchableOpacity
        style={[
          styles.bookRideButton,
          isBookRideButtonEnabled ? styles.enabledBookRideButton : styles.disabledBookRideButton
        ]}
        onPress={handleNavigateToBooking}
        disabled={!isBookRideButtonEnabled}
      >
        <Text style={styles.bookRideButtonText}>BOOK RIDE</Text>
      </TouchableOpacity>
      
      {/* Price Panel */}
      {showPricePanel && selectedRideType && (
        <Animated.View
          style={[
            styles.pricePanel,
            {
              transform: [{
                translateY: panelAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0]
                })
              }]
            }
          ]}
        >
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Ride Details</Text>
            <TouchableOpacity onPress={() => setShowPricePanel(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.priceDetailsContainer}>
            <View style={styles.vehicleIconContainer}>
              {renderVehicleIcon(selectedRideType as 'bike' | 'taxi' | 'port', 40, '#000000')}
            </View>
            
            <View style={styles.priceInfoContainer}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Pickup:</Text>
                <Text style={styles.priceValue} numberOfLines={1}>{pickup || 'Not selected'}</Text>
              </View>
              
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Drop-off:</Text>
                <Text style={styles.priceValue} numberOfLines={1}>{dropoff || 'Not selected'}</Text>
              </View>
              
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Distance:</Text>
                <Text style={styles.priceValue}>{distance || '---'}</Text>
              </View>
              
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Price:</Text>
                <Text style={styles.priceValue}>₹{estimatedPrice || '---'}</Text>
              </View>
              
              <View style={styles.returnTripRow}>
                <Text style={styles.priceLabel}>Return trip:</Text>
                <Switch
                  value={wantReturn}
                  onValueChange={setWantReturn}
                  trackColor={{ false: '#767577', true: '#4CAF50' }}
                  thumbColor={wantReturn ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.bookButtonContainer}>
            <TouchableOpacity
              style={styles.bookMyRideButton}
              onPress={handleBookRide}
            >
              <Text style={styles.bookMyRideButtonText}>BOOK MY RIDE</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
      
      {/* Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showConfirmModal}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Booking</Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
              </View>
              
              <Text style={styles.modalMessage}>
                Thank you for choosing EAZY GO!
              </Text>
              
              <Text style={styles.modalSubMessage}>
                Your ride has been successfully booked.
              </Text>
              
              <View style={styles.otpContainer}>
                <Text style={styles.otpLabel}>Your pickup OTP is:</Text>
                <Text style={styles.otpValue}>{bookingOTP}</Text>
              </View>
              
              <Text style={styles.otpWarning}>
                Please don't share it with anyone. Only share with our driver.
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleConfirmBooking}
              >
                <Text style={styles.modalConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  mapContainer: {
    width: '100%',
    height: Dimensions.get('window').height * 0.3,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: { ...StyleSheet.absoluteFillObject },
  mapLoadingText: {
    color: '#757575',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  centerMarkerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -15,
    marginTop: -30,
    zIndex: 10,
    elevation: 5,
  },
  suggestionsContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  distanceTimeContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  distanceTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceTimeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    marginRight: 8,
  },
  distanceTimeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  seeRouteButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  seeRouteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bookRideButton: {
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  enabledBookRideButton: {
    backgroundColor: '#FF5722',
  },
  disabledBookRideButton: {
    backgroundColor: '#BDBDBD',
  },
  bookRideButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    width: '100%',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  pricePanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: Dimensions.get('window').height * 0.5,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  priceDetailsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  vehicleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  priceInfoContainer: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    flex: 1,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    flex: 2,
    textAlign: 'right',
  },
  returnTripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  bookButtonContainer: {
    marginTop: 10,
  },
  bookMyRideButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bookMyRideButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  modalContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconContainer: {
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalSubMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  otpContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  otpLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  otpValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  otpWarning: {
    fontSize: 12,
    color: '#F44336',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Marker styles
  currentLocationMarker: {
    
    borderRadius: 20,
    padding: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  pickupLocationMarker: {
    
    borderRadius: 20,
    padding: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  dropoffLocationMarker: {
    
    borderRadius: 20,
    padding: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  vehicleMarkerContainer: {
    
    borderRadius: 20,
    padding: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});
export default TaxiContent;
// import React, { useState, useRef, useEffect } from 'react';
// import {
// View,
// StyleSheet,
// Text,
// TouchableOpacity,
// Dimensions,
// Alert,
// ActivityIndicator,
// Animated,
// ScrollView,
// Image,
// } from 'react-native';
// import MapView, { Marker, Region, Polyline } from 'react-native-maps';
// import LocationInput from './LocationInput';
// import RideTypeSelector from './RideTypeSelector';
// import BookRideButton from './BookRideButton';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import FontAwesome from 'react-native-vector-iconsFontAwesome';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import axios from 'axios';
// import Svg, { Path } from 'react-native-svg';
// // Import SVG assets
// const TaxiIcon = () => (
// <Svg width={24} height={24} viewBox="0 0 24 24">
// <Path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" fill="#000000"/>
// </Svg>
// );
// const PortIcon = () => (
// <Svg width={24} height={24} viewBox="0 0 24 24">
// <Path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="#000000"/>
// </Svg>
// );
// const BikeIcon = () => (
// <Svg width={24} height={24} viewBox="0 0 24 24">
// <Path d="M19.44 9.03L15.41 5H11v2h3.59l2 2H5c-2.8 0-5 2.2-5 5s2.2 5 5 5c2.46 0 4.45-1.69 4.9-4h1.65l2.77-2.77c-.21.54-.32 1.14-.32 1.77 0 2.8 2.2 5 5 5s5-2.2 5-5c0-2.65-1.97-4.77-4.56-4.97zM7.82 15C7.4 16.15 6.28 17 5 17c-1.63 0-3-1.37-3-3s1.37-3 3-3c1.28 0 2.4.85 2.82 2H5v2h2.82zm6.28-2h-1.4l-.94.94L10.38 15H8.1c-.05-.33-.12-.66-.23-.97l1.86-1.86L11.41 13H14.1l-.94.94.94.94.94-.94zm2.95.02l.94-.94.94.94-.94.94-.94-.94zM19 17c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill="#000000"/>
// </Svg>
// );
// interface Location {
// latitude: number;
// longitude: number;
// }
// interface Driver {
// id: string;
// location: Location;
// type: 'bike' | 'taxi' | 'port';
// name: string;
// rating: number;
// distance: number;
// eta: string;
// price: number;
// vehicleNumber: string;
// }
// interface TaxiContentProps {
// loadingLocation: boolean;
// currentLocation: Location | null;
// lastSavedLocation: Location | null;
// pickup: string;
// dropoff: string;
// suggestions: { id: string; name: string }[];
// showDropoffSuggestions: boolean;
// handlePickupChange: (text: string) => void;
// handleDropoffChange: (text: string) => void;
// selectSuggestion: (suggestion: { id: string; name: string }) => void;
// selectingPickup: boolean;
// setSelectingPickup: (value: boolean) => void;
// selectingDropoff: boolean;
// setSelectingDropoff: (value: boolean) => void;
// setPickup: (value: string) => void;
// setDropoff: (value: string) => void;
// }
// const GOOGLE_API_KEY = 'AIzaSyA9Ef953b2mO_rr940k-3OclHSZp3ldM2o';
// const TaxiContent: React.FC<TaxiContentProps> = ({
// loadingLocation,
// currentLocation,
// lastSavedLocation,
// pickup,
// dropoff,
// suggestions,
// showDropoffSuggestions,
// handlePickupChange,
// handleDropoffChange,
// selectSuggestion,
// selectingPickup,
// setSelectingPickup,
// selectingDropoff,
// setSelectingDropoff,
// setPickup,
// setDropoff,
// }) => {
// const [selectedRideType, setSelectedRideType] = useState<string>('bike');
// const [mapCenter, setMapCenter] = useState<Location | null>(null);
// const [isMapMoving, setIsMapMoving] = useState(false);
// const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
// const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
// const [routeCoords, setRouteCoords] = useState<Location[]>([]);
// const [showRoute, setShowRoute] = useState(false);
// const [loadingRoute, setLoadingRoute] = useState(false);
// const [mapRegion, setMapRegion] = useState<Region | null>(null);
// const [apiError, setApiError] = useState<string | null>(null);
// const [drivers, setDrivers] = useState<Driver[]>([]);
// const [showDrivers, setShowDrivers] = useState(false);
// const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
// const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
// const [showDriverPanel, setShowDriverPanel] = useState(false);
// // New state for distance and travel time
// const [distance, setDistance] = useState<string>('');
// const [travelTime, setTravelTime] = useState<string>('');
// // Animation state - simplified approach
// const [driverPositions, setDriverPositions] = useState<Record<string, Location>>({});

// const mapRef = useRef<MapView>(null);
// const panelAnimation = useRef(new Animated.Value(0)).current;
// const animationTimer = useRef<NodeJS.Timeout | null>(null);

// const dropoffSuggestions = [
// { id: '1', name: 'Central Mall' },
// { id: '2', name: 'Railway Station' },
// { id: '3', name: 'Airport' },
// ];
// // Animate driver panel
// useEffect(() => {
// if (showDriverPanel) {
// Animated.timing(panelAnimation, {
// toValue: 1,
// duration: 300,
// useNativeDriver: true,
// }).start();
// } else {
// Animated.timing(panelAnimation, {
// toValue: 0,
// duration: 300,
// useNativeDriver: true,
// }).start();
// }
// }, [showDriverPanel]);
// // Generate random drivers near current location
// const generateDrivers = (type: 'bike' | 'taxi' | 'port') => {
// if (!currentLocation) return [];

// const newDrivers: Driver[] = [];
// // Updated driver counts based on requirements
// const driverCount = type === 'bike' ? 7 : type === 'taxi' ? 5 : 5;

// for (let i = 0; i < driverCount; i++) {
// // Generate random location within 3km radius
// const radius = 3; // 3km
// const angle = Math.random() * Math.PI * 2;
// const distance = Math.random() * radius;

// const latOffset = (distance / 111.32) * Math.cos(angle);
// const lngOffset = (distance / 111.32) * Math.sin(angle);

// const driverLocation = {
// latitude: currentLocation.latitude + latOffset,
// longitude: currentLocation.longitude + lngOffset,
// };

// // Calculate ETA based on distance (approx 1 min per 0.5km)
// const etaMinutes = Math.max(1, Math.round(distance * 2));

// // Calculate price based on ride type and distance
// let baseFare = 0;
// let perKm = 0;

// switch (type) {
// case 'bike':
// baseFare = 20;
// perKm = 8;
// break;
// case 'taxi':
// baseFare = 50;
// perKm = 15;
// break;
// case 'port':
// baseFare = 80;
// perKm = 25;
// break;
// }

// const price = Math.round(baseFare + (distance * perKm));

// newDrivers.push({
// id: `${type}-${i}`,
// location: driverLocation,
// type,
// name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
// rating: 4 + Math.random(), // 4.0 to 5.0
// distance: Math.round(distance * 10) / 10, // 1 decimal place
// eta: `${etaMinutes} min${etaMinutes > 1 ? 's' : ''}`,
// price,
// vehicleNumber: `${type.toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`,
// });
// }

// // Sort by distance
// return newDrivers.sort((a, b) => a.distance - b.distance);
// };
// useEffect(() => {
// if (pickupLocation && dropoffLocation && routeCoords.length > 0) {
// const price = calculatePrice();
// setEstimatedPrice(price);
// }
// }, [pickupLocation, dropoffLocation, routeCoords, selectedRideType]);
// // Initialize driver positions
// useEffect(() => {
// if (showDrivers && drivers.length > 0) {
// const positions: Record<string, Location> = {};

// drivers.forEach(driver => {
// positions[driver.id] = { ...driver.location };
// });

// setDriverPositions(positions);
// startDriverAnimation();
// } else {
// stopDriverAnimation();
// }

// return () => {
// stopDriverAnimation();
// };
// }, [showDrivers, drivers, routeCoords]);
// // Start driver animation
// const startDriverAnimation = () => {
// stopDriverAnimation(); // Clear any existing timer

// if (routeCoords.length === 0) return;

// animationTimer.current = setInterval(() => {
// setDriverPositions(prevPositions => {
// const newPositions: Record<string, Location> = {};

// Object.keys(prevPositions).forEach(driverId => {
// const currentPos = prevPositions[driverId];

// // Find the closest point on the route to the current position
// let closestIndex = 0;
// let minDistance = Infinity;

// routeCoords.forEach((coord, index) => {
// const distance = Math.sqrt(
// Math.pow(coord.longitude - currentPos.longitude, 2) +
// Math.pow(coord.latitude - currentPos.latitude, 2)
// );

// if (distance < minDistance) {
// minDistance = distance;
// closestIndex = index;
// }
// });

// // Move to the next point in the route
// const nextIndex = (closestIndex + 1) % routeCoords.length;
// const nextCoord = routeCoords[nextIndex];

// // Interpolate between current position and next position
// const progress = 0.006; // Reduced from 0.05 to 0.02 for slower movement
// newPositions[driverId] = {
// latitude: currentPos.latitude + (nextCoord.latitude - currentPos.latitude) * progress,
// longitude: currentPos.longitude + (nextCoord.longitude - currentPos.longitude) * progress,
// };
// });

// return newPositions;
// });
// }, 3000); // Increased from 100ms to 200ms for slower animation
// };
// // Stop driver animation
// const stopDriverAnimation = () => {
// if (animationTimer.current) {
// clearInterval(animationTimer.current);
// animationTimer.current = null;
// }
// };
// // Fetch address by coordinates
// const fetchAddress = async (latitude: number, longitude: number): Promise<string> => {
// try {
// const response = await axios.get(
// `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
// );
// if (response.data.status === 'OK' && response.data.results.length > 0) {
// return response.data.results[0].formatted_address;
// }
// return 'Unknown Location';
// } catch (error) {
// console.error('Geocoding error:', error);
// return 'Error fetching address';
// }
// };
// // Fetch route between pickup & dropoff
// const fetchRoute = async (pickup: Location, dropoff: Location) => {
// setLoadingRoute(true);
// setApiError(null);

// try {
// const response = await axios.get(
// `https://maps.googleapis.com/maps/api/directions/json?origin=${pickup.latitude},${pickup.longitude}&destination=${dropoff.latitude},${dropoff.longitude}&key=${GOOGLE_API_KEY}`
// );

// if (response.data.status === 'OK' && response.data.routes.length > 0) {
// const points = decodePolyline(response.data.routes[0].overview_polyline.points);
// setRouteCoords(points);

// // Extract distance and duration from the response
// const leg = response.data.routes[0].legs[0];
// setDistance(leg.distance.text);
// setTravelTime(leg.duration.text);

// // Adjust map to show the entire route
// const northeast = response.data.routes[0].bounds.northeast;
// const southwest = response.data.routes[0].bounds.southwest;

// const region = {
// latitude: (northeast.lat + southwest.lat) / 2,
// longitude: (northeast.lng + southwest.lng) / 2,
// latitudeDelta: Math.abs(northeast.lat - southwest.lat) * 1.5,
// longitudeDelta: Math.abs(northeast.lng - southwest.lng) * 1.5,
// };

// setMapRegion(region);
// mapRef.current?.animateToRegion(region, 1000);
// } else if (response.data.status === 'REQUEST_DENIED') {
// setApiError('API Key Error: Directions API is not enabled for this project. Please enable it in Google Cloud Console.');
// Alert.alert(
// 'API Key Error',
// 'The Directions API is not enabled for this project. Please enable it in the Google Cloud Console and wait 5-10 minutes for changes to take effect.'
// );
// } else {
// setApiError(`Route Error: ${response.data.status}`);
// Alert.alert('Route Error', `Could not find route: ${response.data.status}`);
// }
// } catch (error: any) {
// console.error("Error fetching route:", error.response?.data || error.message);
// setApiError('Network Error: Failed to fetch route');
// Alert.alert('Route Error', 'Failed to fetch route. Please check your internet connection.');
// } finally {
// setLoadingRoute(false);
// }
// };
// // Polyline decoder
// const decodePolyline = (t: string) => {
// let points: Location[] = [];
// let index = 0, lat = 0, lng = 0;

// while (index < t.length) {
// let b, shift = 0, result = 0;
// do {
// b = t.charCodeAt(index++) - 63;
// result |= (b & 0x1f) << shift;
// shift += 5;
// } while (b >= 0x20);

// let dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
// lat += dlat;
// shift = 0;
// result = 0;

// do {
// b = t.charCodeAt(index++) - 63;
// result |= (b & 0x1f) << shift;
// shift += 5;
// } while (b >= 0x20);

// let dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
// lng += dlng;
// points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
// }

// return points;
// };
// // Calculate estimated price
// const calculatePrice = () => {
// if (!pickupLocation || !dropoffLocation || !routeCoords.length) return null;

// // Simple distance calculation (Haversine formula)
// const toRad = (value: number) => (value * Math.PI) / 180;
// const R = 6371; // Earth radius in km
// const dLat = toRad(dropoffLocation.latitude - pickupLocation.latitude);
// const dLon = toRad(dropoffLocation.longitude - pickupLocation.longitude);
// const a =
// Math.sin(dLat / 2) * Math.sin(dLat / 2) +
// Math.cos(toRad(pickupLocation.latitude)) *
// Math.cos(toRad(dropoffLocation.latitude)) *
// Math.sin(dLon / 2) * Math.sin(dLon / 2);
// const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// const distance = R * c; // Distance in km

// // Price calculation based on ride type
// let baseFare = 0;
// let perKm = 0;

// switch (selectedRideType) {
// case 'bike':
// baseFare = 20;
// perKm = 8;
// break;
// case 'taxi':
// baseFare = 50;
// perKm = 15;
// break;
// case 'port':
// baseFare = 80;
// perKm = 25;
// break;
// default:
// baseFare = 50;
// perKm = 15;
// }

// return Math.round(baseFare + (distance * perKm));
// };
// // Handle See My Route button press
// const handleSeeRoute = () => {
// if (!pickupLocation || !dropoffLocation) {
// Alert.alert('Location Missing', 'Please select both pickup and dropoff locations');
// return;
// }

// setShowRoute(true);
// fetchRoute(pickupLocation, dropoffLocation);
// };
// // Handle ride type selection
// const handleRideTypeSelect = (type: string) => {
// try {
// setSelectedRideType(type);
// setSelectedDriver(null);
// setShowDriverPanel(true);

// // Generate drivers based on selected type
// const newDrivers = generateDrivers(type as 'bike' | 'taxi' | 'port');
// setDrivers(newDrivers);
// setShowDrivers(true);

// // Calculate price if route is already shown
// if (pickupLocation && dropoffLocation && routeCoords.length > 0) {
// const price = calculatePrice();
// setEstimatedPrice(price);
// }
// } catch (error) {
// console.error('Error selecting ride type:', error);
// Alert.alert('Error', 'Failed to select ride type. Please try again.');
// }
// };
// // Handle driver selection
// const handleSelectDriver = (driver: Driver) => {
// setSelectedDriver(driver);
// };
// // Handle book ride
// const handleBookRide = () => {
// if (!selectedDriver) {
// Alert.alert('Error', 'Please select a driver first');
// return;
// }

// Alert.alert(
// 'Confirm Booking',
// `Ride Price: ₹${selectedDriver.price}\nAre you sure you want to book this ${selectedDriver.type}?`,
// [
// { text: 'Cancel', style: 'cancel' },
// {
// text: 'Confirm',
// onPress: () => {
// Alert.alert('Success', `Your ${selectedDriver.type} ride has been booked for ₹${selectedDriver.price}!`);
// // Here you would typically send the booking to your backend
// }
// }
// ]
// );
// };
// // Handle navigation to booking screen
// const handleNavigateToBooking = () => {
// // This function would navigate to the next screen
// // For now, we'll just show an alert
// Alert.alert('Navigation', 'Navigating to booking confirmation screen...');
// };
// // Select pickup on map
// const handleSelectPickupOnMap = async () => {
// setSelectingPickup(true);
// setSelectingDropoff(false);
// try {
// if (currentLocation) {
// setMapCenter(currentLocation);
// mapRef.current?.animateToRegion({
// ...currentLocation,
// latitudeDelta: 0.01,
// longitudeDelta: 0.01,
// }, 1000);
// }
// } catch (error) {
// if (currentLocation) setMapCenter(currentLocation);
// }
// };
// // Select dropoff on map
// const handleSelectDropoffOnMap = async () => {
// setSelectingDropoff(true);
// setSelectingPickup(false);
// try {
// if (currentLocation) {
// setMapCenter(currentLocation);
// mapRef.current?.animateToRegion({
// ...currentLocation,
// latitudeDelta: 0.01,
// longitudeDelta: 0.01,
// }, 1000);
// }
// } catch (error) {
// if (currentLocation) setMapCenter(currentLocation);
// }
// };
// // Track map movement
// const handleRegionChange = (region: Region) => {
// if (selectingPickup || selectingDropoff) {
// setIsMapMoving(true);
// setMapCenter({
// latitude: region.latitude,
// longitude: region.longitude,
// });
// }
// };
// const handleRegionChangeComplete = async (region: Region) => {
// if ((selectingPickup || selectingDropoff) && isMapMoving) {
// setIsMapMoving(false);
// const center = {
// latitude: region.latitude,
// longitude: region.longitude,
// };
// const address = await fetchAddress(center.latitude, center.longitude);

// if (selectingPickup) {
// setPickupLocation(center);
// setPickup(address);
// } else if (selectingDropoff) {
// setDropoffLocation(center);
// setDropoff(address);
// }
// }
// };
// // Custom map style - clean and minimal
// const customMapStyle = [
// {
// "elementType": "geometry",
// "stylers": [{ "color": "#f5f5f5" }]
// },
// {
// "elementType": "labels.icon",
// "stylers": [{ "visibility": "off" }]
// },
// {
// "elementType": "labels.text.fill",
// "stylers": [{ "color": "#616161" }]
// },
// {
// "elementType": "labels.text.stroke",
// "stylers": [{ "color": "#f5f5f5" }]
// },
// {
// "featureType": "administrative.land_parcel",
// "stylers": [{ "visibility": "off" }]
// },
// {
// "featureType": "administrative.neighborhood",
// "stylers": [{ "visibility": "off" }]
// },
// {
// "featureType": "poi",
// "stylers": [{ "visibility": "off" }]
// },
// {
// "featureType": "road",
// "elementType": "geometry",
// "stylers": [{ "color": "#ffffff" }]
// },
// {
// "featureType": "road",
// "elementType": "labels.icon",
// "stylers": [{ "visibility": "off" }]
// },
// {
// "featureType": "transit",
// "stylers": [{ "visibility": "off" }]
// },
// {
// "featureType": "water",
// "elementType": "geometry",
// "stylers": [{ "color": "#c9c9c9" }]
// }
// ];
// // Render vehicle icon based on type
// const renderVehicleIcon = (type: 'bike' | 'taxi' | 'port', size: number = 24, color: string = '#000000') => {
// try {
// switch (type) {
// case 'bike':
// return <BikeIcon />;
// case 'taxi':
// return <TaxiIcon />;
// case 'port':
// return <PortIcon />;
// default:
// return <TaxiIcon />;
// }
// } catch (error) {
// console.error('Error rendering vehicle icon:', error);
// return <TaxiIcon />;
// }
// };
// // Render driver item
// const renderDriverItem = (driver: Driver) => (
// <TouchableOpacity
// key={driver.id}
// style={[
// styles.driverItem,
// selectedDriver?.id === driver.id && styles.selectedDriverItem
// ]}
// onPress={() => handleSelectDriver(driver)}
// >
// <View style={styles.driverInfo}>
// <View style={styles.driverIcon}>
// {renderVehicleIcon(driver.type, 20, '#000000')}
// </View>
// <View style={styles.driverDetails}>
// <Text style={styles.driverName}>{driver.name}</Text>
// <Text style={styles.driverVehicle}>{driver.vehicleNumber}</Text>
// <View style={styles.ratingContainer}>
// <Ionicons name="star" size={12} color="#FFD700" />
// <Text style={styles.ratingText}>{driver.rating.toFixed(1)}</Text>
// </View>
// </View>
// </View>
// <View style={styles.driverMeta}>
// <Text style={styles.etaText}>{driver.eta} away</Text>
// <Text style={styles.priceText}>₹{driver.price}</Text>
// <Text style={styles.distanceText}>{driver.distance} km</Text>
// </View>
// </TouchableOpacity>
// );
// // Check if all details are filled to enable the book ride button
// const isBookRideButtonEnabled = pickupLocation && dropoffLocation && selectedDriver;
// return (
// <View style={styles.contentContainer}>
// <View style={styles.mapContainer}>
// {loadingLocation ? (
// <Text style={styles.mapLoadingText}>Loading map...</Text>
// ) : currentLocation ? (
// <MapView
// ref={mapRef}
// style={styles.map}
// initialRegion={{
// latitude: currentLocation.latitude,
// longitude: currentLocation.longitude,
// latitudeDelta: 0.01,
// longitudeDelta: 0.01,
// }}
// region={mapRegion || undefined}
// onRegionChange={handleRegionChange}
// onRegionChangeComplete={handleRegionChangeComplete}
// customMapStyle={customMapStyle}
// legalLabelInsets={{ bottom: -100, right: -100 }} // Hide Google logo
// >
// {/* Route polyline */}
// {showRoute && routeCoords.length > 0 && (
// <Polyline
// coordinates={routeCoords}
// strokeColor="#4CAF50"
// strokeWidth={4}
// lineDashPattern={[0]}
// />
// )}

// {/* Current location marker */}
// {!selectingPickup && !selectingDropoff && currentLocation && (
// <Marker coordinate={currentLocation} title="My Current Location">
// <View style={styles.currentLocationMarker}>
// <MaterialIcons name="my-location" size={24} color="#4CAF50" />
// </View>
// </Marker>
// )}

// {/* Pickup marker */}
// {pickupLocation && !selectingPickup && (
// <Marker coordinate={pickupLocation} title="Pickup Location">
// <View style={styles.pickupLocationMarker}>
// <MaterialIcons name="location-on" size={24} color="#4CAF50" />
// </View>
// </Marker>
// )}

// {/* Dropoff marker */}
// {dropoffLocation && !selectingDropoff && (
// <Marker coordinate={dropoffLocation} title="Dropoff Location">
// <View style={styles.dropoffLocationMarker}>
// <MaterialIcons name="location-on" size={24} color="#F44336" />
// </View>
// </Marker>
// )}

// {/* Driver markers with updated positions */}
// {showDrivers && drivers.map(driver => {
// const position = driverPositions[driver.id];
// if (!position) return null;

// return (
// <Marker
// key={driver.id}
// coordinate={position}
// title={driver.name}
// description={`${driver.distance}km away • ${driver.eta}`}
// >
// <View style={styles.driverMarkerContainer}>
// {renderVehicleIcon(driver.type, 24, '#90EE90')}
// </View>
// </Marker>
// );
// })}
// </MapView>
// ) : (
// <Text style={styles.mapLoadingText}>Could not get location. Check permissions.</Text>
// )}

// {/* Center marker when selecting */}
// {(selectingPickup || selectingDropoff) && mapCenter && (
// <View style={styles.centerMarkerContainer}>
// <MaterialIcons
// name={selectingPickup ? "my-location" : "location-on"}
// size={30}
// color={selectingPickup ? "#4CAF50" : "#F44336"}
// />
// </View>
// )}
// </View>

// <LocationInput
// pickup={pickup}
// dropoff={dropoff}
// handlePickupChange={handlePickupChange}
// handleDropoffChange={handleDropoffChange}
// showDropoffSuggestions={showDropoffSuggestions}
// setSelectingPickup={setSelectingPickup}
// setSelectingDropoff={setSelectingDropoff}
// onSelectPickupOnMap={handleSelectPickupOnMap}
// onSelectDropoffOnMap={handleSelectDropoffOnMap}
// selectingPickup={selectingPickup}
// selectingDropoff={selectingDropoff}
// />

// {showDropoffSuggestions && suggestions.length > 0 && (
// <View style={styles.suggestionsContainer}>
// {suggestions.map((item) => (
// <TouchableOpacity
// key={item.id}
// style={styles.suggestionItem}
// onPress={() => selectSuggestion(item)}
// >
// <MaterialIcons name="location-on" size={20} color="#A9A9A9" style={styles.suggestionIcon} />
// <Text style={styles.suggestionText}>{item.name}</Text>
// </TouchableOpacity>
// ))}
// </View>
// )}

// {/* Distance and Travel Time Display */}
// {(distance || travelTime) && (
// <View style={styles.distanceTimeContainer}>
// <View style={styles.distanceTimeItem}>
// <Text style={styles.distanceTimeLabel}>DISTANCE:</Text>
// <Text style={styles.distanceTimeValue}>{distance || '---'}</Text>
// </View>
// <View style={styles.distanceTimeItem}>
// <Text style={styles.distanceTimeLabel}>TRAVEL TIME:</Text>
// <Text style={styles.distanceTimeValue}>{travelTime || '---'}</Text>
// </View>
// </View>
// )}

// {apiError && (
// <View style={styles.errorContainer}>
// <Text style={styles.errorText}>{apiError}</Text>
// </View>
// )}

// <TouchableOpacity
// style={[styles.seeRouteButton, (!pickupLocation || !dropoffLocation) && styles.disabledButton]}
// onPress={handleSeeRoute}
// disabled={!pickupLocation || !dropoffLocation || loadingRoute}
// >
// {loadingRoute ? (
// <ActivityIndicator color="#FFFFFF" />
// ) : (
// <Text style={styles.seeRouteButtonText}>See My Route</Text>
// )}
// </TouchableOpacity>

// <RideTypeSelector
// selectedRideType={selectedRideType}
// setSelectedRideType={handleRideTypeSelect}
// />

// {/* BOOK RIDE Button */}
// <TouchableOpacity
// style={[
// styles.bookRideButton,
// isBookRideButtonEnabled ? styles.enabledBookRideButton : styles.disabledBookRideButton
// ]}
// onPress={handleNavigateToBooking}
// disabled={!isBookRideButtonEnabled}
// >
// <Text style={styles.bookRideButtonText}>BOOK RIDE</Text>
// </TouchableOpacity>

// {/* Driver Selection Panel */}
// {showDriverPanel && (
// <Animated.View
// style={[
// styles.driverPanel,
// {
// transform: [{
// translateY: panelAnimation.interpolate({
// inputRange: [0, 1],
// outputRange: [300, 0]
// })
// }]
// }
// ]}
// >
// <View style={styles.panelHeader}>
// <Text style={styles.panelTitle}>Available {selectedRideType === 'bike' ? 'Bikes' : selectedRideType === 'taxi' ? 'Taxis' : 'Port Vehicles'}</Text>
// <TouchableOpacity onPress={() => setShowDriverPanel(false)}>
// <MaterialIcons name="close" size={24} color="#666" />
// </TouchableOpacity>
// </View>

// <ScrollView style={styles.driversList}>
// {drivers.map(renderDriverItem)}
// </ScrollView>

// {selectedDriver && (
// <View style={styles.selectedDriverContainer}>
// <BookRideButton
// onPress={handleBookRide}
// driver={selectedDriver}
// />
// </View>
// )}
// </Animated.View>
// )}
// </View>
// );
// };
// const styles = StyleSheet.create({
// contentContainer: {
// flex: 1,
// padding: 20,
// alignItems: 'center',
// backgroundColor: '#F5F5F5',
// },
// // Reduced map container size
// mapContainer: {
// width: '100%',
// height: Dimensions.get('window').height * 0.30, // Reduced from 0.4 to 0.25
// borderRadius: 15,
// overflow: 'hidden',
// marginBottom: 15,
// borderWidth: 1,
// borderColor: '#d5d5d5ff',
// justifyContent: 'center',
// alignItems: 'center',
// },
// map: { ...StyleSheet.absoluteFillObject },
// mapLoadingText: {
// color: '#757575',
// fontSize: 16,
// textAlign: 'center',
// padding: 20,
// },
// centerMarkerContainer: {
// position: 'absolute',
// top: '50%',
// left: '50%',
// marginLeft: -15,
// marginTop: -30,
// zIndex: 10,
// elevation: 5,
// },
// currentLocationMarker: {



// },
// pickupLocationMarker: {


// },
// dropoffLocationMarker: {


// },
// driverMarkerContainer: {
// justifyContent: 'center',
// alignItems: 'center',
// width: 30,
// height: 30,
// },
// suggestionsContainer: {
// width: '100%',
// backgroundColor: '#FFFFFF',
// borderRadius: 12,
// padding: 15,
// marginBottom: 15,
// elevation: 3,
// shadowColor: '#000',
// shadowOffset: { width: 0, height: 2 },
// shadowOpacity: 0.1,
// shadowRadius: 4,
// },
// suggestionItem: {
// flexDirection: 'row',
// alignItems: 'center',
// paddingVertical: 12,
// borderBottomWidth: 1,
// borderBottomColor: '#EEEEEE',
// },
// suggestionIcon: {
// marginRight: 12,
// },
// suggestionText: {
// fontSize: 16,
// color: '#333333',
// flex: 1,
// },
// // New styles for distance and travel time
// distanceTimeContainer: {
// width: '100%',
// flexDirection: 'row',
// justifyContent: 'space-between',
// marginBottom: 15,
// backgroundColor: '#FFFFFF',
// borderRadius: 12,
// padding: 15,
// elevation: 3,
// shadowColor: '#000',
// shadowOffset: { width: 0, height: 2 },
// shadowOpacity: 0.1,
// shadowRadius: 4,
// },
// distanceTimeItem: {
// flexDirection: 'row',
// alignItems: 'center',
// },
// distanceTimeLabel: {
// fontSize: 14,
// fontWeight: '600',
// color: '#757575',
// marginRight: 8,
// },
// distanceTimeValue: {
// fontSize: 14,
// fontWeight: 'bold',
// color: '#333333',
// },
// seeRouteButton: {
// backgroundColor: '#4CAF50',
// paddingVertical: 15,
// borderRadius: 12,
// marginBottom: 15,
// width: '100%',
// alignItems: 'center',
// elevation: 3,
// shadowColor: '#000',
// shadowOffset: { width: 0, height: 2 },
// shadowOpacity: 0.2,
// shadowRadius: 4,
// },
// disabledButton: {
// backgroundColor: '#BDBDBD',
// },
// seeRouteButtonText: {
// color: '#FFFFFF',
// fontSize: 16,
// fontWeight: '600',
// },
// // New styles for BOOK RIDE button
// bookRideButton: {
// paddingVertical: 15,
// borderRadius: 12,
// marginBottom: 15,
// width: '100%',
// alignItems: 'center',
// elevation: 3,
// shadowColor: '#000',
// shadowOffset: { width: 0, height: 2 },
// shadowOpacity: 0.2,
// shadowRadius: 4,
// },
// enabledBookRideButton: {
// backgroundColor: '#FF5722',
// },
// disabledBookRideButton: {
// backgroundColor: '#BDBDBD',
// },
// bookRideButtonText: {
// color: '#FFFFFF',
// fontSize: 16,
// fontWeight: '600',
// },
// errorContainer: {
// width: '100%',
// backgroundColor: '#FFEBEE',
// borderRadius: 12,
// padding: 15,
// marginBottom: 15,
// borderLeftWidth: 4,
// borderLeftColor: '#F44336',
// },
// errorText: {
// color: '#D32F2F',
// fontSize: 14,
// textAlign: 'center',
// },
// driverPanel: {
// position: 'absolute',
// bottom: 0,
// left: 0,
// right: 0,
// backgroundColor: '#FFFFFF',
// borderTopLeftRadius: 20,
// borderTopRightRadius: 20,
// padding: 20,
// maxHeight: Dimensions.get('window').height * 0.5,
// elevation: 10,
// shadowColor: '#000',
// shadowOffset: { width: 0, height: -3 },
// shadowOpacity: 0.2,
// shadowRadius: 6,
// },
// panelHeader: {
// flexDirection: 'row',
// justifyContent: 'space-between',
// alignItems: 'center',
// marginBottom: 15,
// paddingBottom: 15,
// borderBottomWidth: 1,
// borderBottomColor: '#EEEEEE',
// },
// panelTitle: {
// fontSize: 18,
// fontWeight: 'bold',
// color: '#333333',
// },
// driversList: {
// maxHeight: Dimensions.get('window').height * 0.3,
// },
// driverItem: {
// flexDirection: 'row',
// justifyContent: 'space-between',
// alignItems: 'center',
// padding: 15,
// marginBottom: 10,
// backgroundColor: '#FAFAFA',
// borderRadius: 12,
// borderWidth: 1,
// borderColor: '#EEEEEE',
// },
// selectedDriverItem: {
// backgroundColor: '#E8F5E9',
// borderColor: '#4CAF50',
// borderWidth: 2,
// },
// driverInfo: {
// flexDirection: 'row',
// alignItems: 'center',
// flex: 1,
// },
// driverIcon: {
// width: 40,
// height: 40,
// borderRadius: 20,
// backgroundColor: '#4CAF50',
// justifyContent: 'center',
// alignItems: 'center',
// marginRight: 12,
// borderWidth: 2,
// borderColor: '#000000',
// },
// driverDetails: {
// flex: 1,
// },
// driverName: {
// fontSize: 16,
// fontWeight: '600',
// color: '#333333',
// marginBottom: 2,
// },
// driverVehicle: {
// fontSize: 12,
// color: '#757575',
// marginBottom: 4,
// },
// ratingContainer: {
// flexDirection: 'row',
// alignItems: 'center',
// },
// ratingText: {
// fontSize: 12,
// color: '#757575',
// marginLeft: 4,
// },
// driverMeta: {
// alignItems: 'flex-end',
// },
// etaText: {
// fontSize: 14,
// fontWeight: '600',
// color: '#4CAF50',
// marginBottom: 4,
// },
// priceText: {
// fontSize: 16,
// fontWeight: 'bold',
// color: '#333333',
// marginBottom: 4,
// },
// distanceText: {
// fontSize: 12,
// color: '#757575',
// },
// selectedDriverContainer: {
// marginTop: 15,
// paddingTop: 15,
// borderTopWidth: 1,
// borderTopColor: '#EEEEEE',
// },
// });
// export default TaxiContent;































































































































































































































// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   Dimensions,
//   Alert,
//   ActivityIndicator,
//   Animated,
//   ScrollView,
// } from 'react-native';
// import MapView, { Marker, Region, Polyline } from 'react-native-maps';
// import LocationInput from './LocationInput';
// import RideTypeSelector from './RideTypeSelector';
// import BookRideButton from './BookRideButton';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import axios from 'axios';
// import Svg, { Path } from 'react-native-svg';

// interface Location {
//   latitude: number;
//   longitude: number;
// }
// interface Driver {
//   id: string;
//   location: Location;
//   type: 'bike' | 'taxi' | 'port';
//   name: string;
//   rating: number;
//   distance: number;
//   eta: string;
//   price: number;
//   vehicleNumber: string;
// }
// interface TaxiContentProps {
//   loadingLocation: boolean;
//   currentLocation: Location | null;
//   lastSavedLocation: Location | null;
//   pickup: string;
//   dropoff: string;
//   suggestions: { id: string; name: string }[];
//   showDropoffSuggestions: boolean;
//   handlePickupChange: (text: string) => void;
//   handleDropoffChange: (text: string) => void;
//   selectSuggestion: (suggestion: { id: string; name: string }) => void;
//   selectingPickup: boolean;
//   setSelectingPickup: (value: boolean) => void;
//   selectingDropoff: boolean;
//   setSelectingDropoff: (value: boolean) => void;
//   setPickup: (value: string) => void;
//   setDropoff: (value: string) => void;
// }

// const GOOGLE_API_KEY = 'AIzaSyA9Ef953b2mO_rr940k-3OclHSZp3ldM2o';
// const TaxiContent: React.FC<TaxiContentProps> = ({
//   loadingLocation,
//   currentLocation,
//   lastSavedLocation,
//   pickup,
//   dropoff,
//   suggestions,
//   showDropoffSuggestions,
//   handlePickupChange,
//   handleDropoffChange,
//   selectSuggestion,
//   selectingPickup,
//   setSelectingPickup,
//   selectingDropoff,
//   setSelectingDropoff,
//   setPickup,
//   setDropoff,
// }) => {
//   const [selectedRideType, setSelectedRideType] = useState<string>('bike');
//   const [mapCenter, setMapCenter] = useState<Location | null>(null);
//   const [isMapMoving, setIsMapMoving] = useState(false);
//   const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
//   const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
//   const [routeCoords, setRouteCoords] = useState<Location[]>([]);
//   const [showRoute, setShowRoute] = useState(false);
//   const [loadingRoute, setLoadingRoute] = useState(false);
//   const [mapRegion, setMapRegion] = useState<Region | null>(null);
//   const [apiError, setApiError] = useState<string | null>(null);
//   const [drivers, setDrivers] = useState<Driver[]>([]);
//   const [showDrivers, setShowDrivers] = useState(false);
//   const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
//   const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
//   const [showDriverPanel, setShowDriverPanel] = useState(false);
//   // New state for distance and travel time
//   const [distance, setDistance] = useState<string>('');
//   const [travelTime, setTravelTime] = useState<string>('');
//   // New states for animation
//   const [isTraveling, setIsTraveling] = useState(false);
//   const [vehiclePosition, setVehiclePosition] = useState<Location | null>(null);
//   const [vehicleRotation, setVehicleRotation] = useState(0);
//   const [driverToPickupCoords, setDriverToPickupCoords] = useState<Location[]>([]);
//   const [currentSegment, setCurrentSegment] = useState<'driverToPickup' | 'pickupToDropoff'>('driverToPickup');
  
//   const mapRef = useRef<MapView>(null);
//   const panelAnimation = useRef(new Animated.Value(0)).current;
//   const animationProgress = useRef(new Animated.Value(0)).current;
  
//   const dropoffSuggestions = [
//     { id: '1', name: 'Central Mall' },
//     { id: '2', name: 'Railway Station' },
//     { id: '3', name: 'Airport' },
//   ];

//   // Animate driver panel
//   useEffect(() => {
//     if (showDriverPanel) {
//       Animated.timing(panelAnimation, {
//         toValue: 1,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     } else {
//       Animated.timing(panelAnimation, {
//         toValue: 0,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     }
//   }, [showDriverPanel]);

//   // Animation listener
//   useEffect(() => {
//     const listener = animationProgress.addListener(({ value }) => {
//       const coords = currentSegment === 'driverToPickup' ? driverToPickupCoords : routeCoords;
//       if (coords.length < 2 || value >= 1) return;

//       const fraction = value;
//       const totalPoints = coords.length - 1;
//       const floatIndex = fraction * totalPoints;
//       const index = Math.floor(floatIndex);
//       const rem = floatIndex - index;

//       const p1 = coords[index];
//       const p2 = coords[Math.min(index + 1, totalPoints)];

//       const pos = {
//         latitude: p1.latitude + (p2.latitude - p1.latitude) * rem,
//         longitude: p1.longitude + (p2.longitude - p1.longitude) * rem,
//       };

//       const bearing = calculateBearing(p1, p2);

//       setVehiclePosition(pos);
//       setVehicleRotation(bearing);
//     });

//     return () => animationProgress.removeListener(listener);
//   }, [currentSegment, driverToPickupCoords, routeCoords]);

//   // Start animation when ready
//   useEffect(() => {
//     if (isTraveling && ((currentSegment === 'driverToPickup' && driverToPickupCoords.length > 0) || (currentSegment === 'pickupToDropoff' && routeCoords.length > 0))) {
//       const coords = currentSegment === 'driverToPickup' ? driverToPickupCoords : routeCoords;
//       if (coords.length < 2) return;

//       animationProgress.setValue(0);
//       const duration = currentSegment === 'driverToPickup' ? 10000 : 20000;
//       Animated.timing(animationProgress, {
//         toValue: 1,
//         duration,
//         useNativeDriver: false,
//       }).start(({ finished }) => {
//         if (finished) {
//           if (currentSegment === 'driverToPickup') {
//             setCurrentSegment('pickupToDropoff');
//           } else {
//             setIsTraveling(false);
//             Alert.alert('Trip Complete', 'You have arrived at your destination!');
//           }
//         }
//       });
//     }
//   }, [isTraveling, currentSegment, driverToPickupCoords, routeCoords]);

//   // Generate random drivers near current location
//   const generateDrivers = (type: 'bike' | 'taxi' | 'port') => {
//     if (!currentLocation) return [];
    
//     const newDrivers: Driver[] = [];
//     // Updated driver counts based on requirements
//     const driverCount = type === 'bike' ? 7 : type === 'taxi' ? 5 : 5;
    
//     for (let i = 0; i < driverCount; i++) {
//       // Generate random location within 3km radius
//       const radius = 3; // 3km
//       const angle = Math.random() * Math.PI * 2;
//       const distance = Math.random() * radius;
      
//       const latOffset = (distance / 111.32) * Math.cos(angle);
//       const lngOffset = (distance / 111.32) * Math.sin(angle);
      
//       const driverLocation = {
//         latitude: currentLocation.latitude + latOffset,
//         longitude: currentLocation.longitude + lngOffset,
//       };
      
//       // Calculate ETA based on distance (approx 1 min per 0.5km)
//       const etaMinutes = Math.max(1, Math.round(distance * 2));
      
//       // Calculate price based on ride type and distance
//       let baseFare = 0;
//       let perKm = 0;
      
//       switch (type) {
//         case 'bike':
//           baseFare = 20;
//           perKm = 8;
//           break;
//         case 'taxi':
//           baseFare = 50;
//           perKm = 15;
//           break;
//         case 'port':
//           baseFare = 80;
//           perKm = 25;
//           break;
//       }
      
//       const price = Math.round(baseFare + (distance * perKm));
      
//       newDrivers.push({
//         id: `${type}-${i}`,
//         location: driverLocation,
//         type,
//         name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
//         rating: 4 + Math.random(), // 4.0 to 5.0
//         distance: Math.round(distance * 10) / 10, // 1 decimal place
//         eta: `${etaMinutes} min${etaMinutes > 1 ? 's' : ''}`,
//         price,
//         vehicleNumber: `${type.toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`,
//       });
//     }
    
//     // Sort by distance
//     return newDrivers.sort((a, b) => a.distance - b.distance);
//   };

//   useEffect(() => {
//     if (pickupLocation && dropoffLocation && routeCoords.length > 0) {
//       const price = calculatePrice();
//       setEstimatedPrice(price);
//     }
//   }, [pickupLocation, dropoffLocation, routeCoords, selectedRideType]);

//   // Fetch address by coordinates
//   const fetchAddress = async (latitude: number, longitude: number): Promise<string> => {
//     try {
//       const response = await axios.get(
//         `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
//       );
//       if (response.data.status === 'OK' && response.data.results.length > 0) {
//         return response.data.results[0].formatted_address;
//       }
//       return 'Unknown Location';
//     } catch (error) {
//       console.error('Geocoding error:', error);
//       return 'Error fetching address';
//     }
//   };

//   // Fetch route between pickup & dropoff
//   const fetchRoute = async (pickup: Location, dropoff: Location) => {
//     setLoadingRoute(true);
//     setApiError(null);
    
//     try {
//       const response = await axios.get(
//         `https://maps.googleapis.com/maps/api/directions/json?origin=${pickup.latitude},${pickup.longitude}&destination=${dropoff.latitude},${dropoff.longitude}&key=${GOOGLE_API_KEY}`
//       );
      
//       if (response.data.status === 'OK' && response.data.routes.length > 0) {
//         const points = decodePolyline(response.data.routes[0].overview_polyline.points);
//         setRouteCoords(points);
        
//         // Extract distance and duration from the response
//         const leg = response.data.routes[0].legs[0];
//         setDistance(leg.distance.text);
//         setTravelTime(leg.duration.text);
        
//         // Adjust map to show the entire route
//         const northeast = response.data.routes[0].bounds.northeast;
//         const southwest = response.data.routes[0].bounds.southwest;
        
//         const region = {
//           latitude: (northeast.lat + southwest.lat) / 2,
//           longitude: (northeast.lng + southwest.lng) / 2,
//           latitudeDelta: Math.abs(northeast.lat - southwest.lat) * 1.5,
//           longitudeDelta: Math.abs(northeast.lng - southwest.lng) * 1.5,
//         };
        
//         setMapRegion(region);
//         mapRef.current?.animateToRegion(region, 1000);
//       } else if (response.data.status === 'REQUEST_DENIED') {
//         setApiError('API Key Error: Directions API is not enabled for this project. Please enable it in Google Cloud Console.');
//         Alert.alert(
//           'API Key Error',
//           'The Directions API is not enabled for this project. Please enable it in the Google Cloud Console and wait 5-10 minutes for changes to take effect.'
//         );
//       } else {
//         setApiError(`Route Error: ${response.data.status}`);
//         Alert.alert('Route Error', `Could not find route: ${response.data.status}`);
//       }
//     } catch (error: any) {
//       console.error("Error fetching route:", error.response?.data || error.message);
//       setApiError('Network Error: Failed to fetch route');
//       Alert.alert('Route Error', 'Failed to fetch route. Please check your internet connection.');
//     } finally {
//       setLoadingRoute(false);
//     }
//   };

//   // Fetch route from driver to pickup
//   const fetchDriverRoute = async (driverLoc: Location, pickupLoc: Location) => {
//     try {
//       const response = await axios.get(
//         `https://maps.googleapis.com/maps/api/directions/json?origin=${driverLoc.latitude},${driverLoc.longitude}&destination=${pickupLoc.latitude},${pickupLoc.longitude}&key=${GOOGLE_API_KEY}`
//       );
      
//       if (response.data.status === 'OK' && response.data.routes.length > 0) {
//         const points = decodePolyline(response.data.routes[0].overview_polyline.points);
//         setDriverToPickupCoords(points);
//       } else {
//         console.error(`Driver route error: ${response.data.status}`);
//       }
//     } catch (error: any) {
//       console.error("Error fetching driver route:", error.response?.data || error.message);
//     }
//   };

//   // Polyline decoder
//   const decodePolyline = (t: string) => {
//     let points: Location[] = [];
//     let index = 0, lat = 0, lng = 0;
    
//     while (index < t.length) {
//       let b, shift = 0, result = 0;
//       do {
//         b = t.charCodeAt(index++) - 63;
//         result |= (b & 0x1f) << shift;
//         shift += 5;
//       } while (b >= 0x20);
      
//       let dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
//       lat += dlat;
//       shift = 0;
//       result = 0;
      
//       do {
//         b = t.charCodeAt(index++) - 63;
//         result |= (b & 0x1f) << shift;
//         shift += 5;
//       } while (b >= 0x20);
      
//       let dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
//       lng += dlng;
//       points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
//     }
    
//     return points;
//   };

//   // Calculate bearing for rotation
//   const toRad = (deg: number) => deg * Math.PI / 180;
//   const toDeg = (rad: number) => rad * 180 / Math.PI;
//   const calculateBearing = (start: Location, end: Location) => {
//     const startLat = toRad(start.latitude);
//     const startLng = toRad(start.longitude);
//     const endLat = toRad(end.latitude);
//     const endLng = toRad(end.longitude);

//     const y = Math.sin(endLng - startLng) * Math.cos(endLat);
//     const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
//     let brng = toDeg(Math.atan2(y, x));
//     return (brng + 360) % 360;
//   };

//   // Calculate estimated price
//   const calculatePrice = () => {
//     if (!pickupLocation || !dropoffLocation || !routeCoords.length) return null;
    
//     // Simple distance calculation (Haversine formula)
//     const toRad = (value: number) => (value * Math.PI) / 180;
//     const R = 6371; // Earth radius in km
//     const dLat = toRad(dropoffLocation.latitude - pickupLocation.latitude);
//     const dLon = toRad(dropoffLocation.longitude - pickupLocation.longitude);
//     const a = 
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(toRad(pickupLocation.latitude)) * 
//       Math.cos(toRad(dropoffLocation.latitude)) * 
//       Math.sin(dLon / 2) * Math.sin(dLon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     const distance = R * c; // Distance in km
    
//     // Price calculation based on ride type
//     let baseFare = 0;
//     let perKm = 0;
    
//     switch (selectedRideType) {
//       case 'bike':
//         baseFare = 20;
//         perKm = 8;
//         break;
//       case 'taxi':
//         baseFare = 50;
//         perKm = 15;
//         break;
//       case 'port':
//         baseFare = 80;
//         perKm = 25;
//         break;
//       default:
//         baseFare = 50;
//         perKm = 15;
//     }
    
//     return Math.round(baseFare + (distance * perKm));
//   };

//   // Handle See My Route button press
//   const handleSeeRoute = () => {
//     if (!pickupLocation || !dropoffLocation) {
//       Alert.alert('Location Missing', 'Please select both pickup and dropoff locations');
//       return;
//     }
    
//     setShowRoute(true);
//     fetchRoute(pickupLocation, dropoffLocation);
//   };

//   // Handle ride type selection
//   const handleRideTypeSelect = (type: string) => {
//     setSelectedRideType(type);
//     setSelectedDriver(null);
//     setShowDriverPanel(true);
    
//     // Generate drivers based on selected type
//     const newDrivers = generateDrivers(type as 'bike' | 'taxi' | 'port');
//     setDrivers(newDrivers);
//     setShowDrivers(true);
    
//     // Calculate price if route is already shown
//     if (pickupLocation && dropoffLocation && routeCoords.length > 0) {
//       const price = calculatePrice();
//       setEstimatedPrice(price);
//     }
//   };

//   // Handle driver selection
//   const handleSelectDriver = (driver: Driver) => {
//     setSelectedDriver(driver);
//   };

//   // Handle book ride
//   const handleBookRide = () => {
//     if (!selectedDriver || !pickupLocation || !dropoffLocation) {
//       Alert.alert('Error', 'Please select a driver and locations first');
//       return;
//     }
    
//     Alert.alert(
//       'Confirm Booking',
//       `Ride Price: ₹${selectedDriver.price}\nAre you sure you want to book this ${selectedDriver.type}?`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Confirm', 
//           onPress: () => {
//             Alert.alert('Success', `Your ${selectedDriver.type} ride has been booked for ₹${selectedDriver.price}!`);
//             setIsTraveling(true);
//             setVehiclePosition(selectedDriver.location);
//             setVehicleRotation(0);
//             setCurrentSegment('driverToPickup');
//             fetchDriverRoute(selectedDriver.location, pickupLocation);
//             setShowDriverPanel(false);
//             setShowDrivers(false);
//             // Here you would typically send the booking to your backend
//           }
//         }
//       ]
//     );
//   };

//   // Handle navigation to booking screen
//   const handleNavigateToBooking = () => {
//     // This function would navigate to the next screen
//     // For now, we'll just show an alert
//     Alert.alert('Navigation', 'Navigating to booking confirmation screen...');
//   };

//   // Select pickup on map
//   const handleSelectPickupOnMap = async () => {
//     setSelectingPickup(true);
//     setSelectingDropoff(false);
//     try {
//       if (currentLocation) {
//         setMapCenter(currentLocation);
//         mapRef.current?.animateToRegion({
//           ...currentLocation,
//           latitudeDelta: 0.01,
//           longitudeDelta: 0.01,
//         }, 1000);
//       }
//     } catch (error) {
//       if (currentLocation) setMapCenter(currentLocation);
//     }
//   };

//   // Select dropoff on map
//   const handleSelectDropoffOnMap = async () => {
//     setSelectingDropoff(true);
//     setSelectingPickup(false);
//     try {
//       if (currentLocation) {
//         setMapCenter(currentLocation);
//         mapRef.current?.animateToRegion({
//           ...currentLocation,
//           latitudeDelta: 0.01,
//           longitudeDelta: 0.01,
//         }, 1000);
//       }
//     } catch (error) {
//       if (currentLocation) setMapCenter(currentLocation);
//     }
//   };

//   // Track map movement
//   const handleRegionChange = (region: Region) => {
//     if (selectingPickup || selectingDropoff) {
//       setIsMapMoving(true);
//       setMapCenter({
//         latitude: region.latitude,
//         longitude: region.longitude,
//       });
//     }
//   };

//   const handleRegionChangeComplete = async (region: Region) => {
//     if ((selectingPickup || selectingDropoff) && isMapMoving) {
//       setIsMapMoving(false);
//       const center = {
//         latitude: region.latitude,
//         longitude: region.longitude,
//       };
//       const address = await fetchAddress(center.latitude, center.longitude);
      
//       if (selectingPickup) {
//         setPickupLocation(center);
//         setPickup(address);
//       } else if (selectingDropoff) {
//         setDropoffLocation(center);
//         setDropoff(address);
//       }
//     }
//   };

//   // Custom map style - clean and minimal
//   const customMapStyle = [
//     {
//       "elementType": "geometry",
//       "stylers": [{ "color": "#f5f5f5" }]
//     },
//     {
//       "elementType": "labels.icon",
//       "stylers": [{ "visibility": "off" }]
//     },
//     {
//       "elementType": "labels.text.fill",
//       "stylers": [{ "color": "#616161" }]
//     },
//     {
//       "elementType": "labels.text.stroke",
//       "stylers": [{ "color": "#f5f5f5" }]
//     },
//     {
//       "featureType": "administrative.land_parcel",
//       "stylers": [{ "visibility": "off" }]
//     },
//     {
//       "featureType": "administrative.neighborhood",
//       "stylers": [{ "visibility": "off" }]
//     },
//     {
//       "featureType": "poi",
//       "stylers": [{ "visibility": "off" }]
//     },
//     {
//       "featureType": "road",
//       "elementType": "geometry",
//       "stylers": [{ "color": "#ffffff" }]
//     },
//     {
//       "featureType": "road",
//       "elementType": "labels.icon",
//       "stylers": [{ "visibility": "off" }]
//     },
//     {
//       "featureType": "transit",
//       "stylers": [{ "visibility": "off" }]
//     },
//     {
//       "featureType": "water",
//       "elementType": "geometry",
//       "stylers": [{ "color": "#c9c9c9" }]
//     }
//   ];

//   // SVG vehicle icons
//   const BikeIcon = ({ size = 24, color = '#000000' }) => (
//     <Svg width={size} height={size} viewBox="0 0 24 24">
//       <Path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3c-.2-.2-.4-.3-.6-.3z" fill={color} />
//     </Svg>
//   );

//   const CarIcon = ({ size = 24, color = '#000000' }) => (
//     <Svg width={size} height={size} viewBox="0 0 24 24">
//       <Path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" fill={color} />
//     </Svg>
//   );

//   const TruckIcon = ({ size = 24, color = '#000000' }) => (
//     <Svg width={size} height={size} viewBox="0 0 24 24">
//       <Path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill={color} />
//     </Svg>
//   );

//   // Render vehicle icon based on type
//   const renderVehicleIcon = (type: 'bike' | 'taxi' | 'port', size: number = 24, color: string = '#000000') => {
//     switch (type) {
//       case 'bike':
//         return <BikeIcon size={size} color={color} />;
//       case 'taxi':
//         return <CarIcon size={size} color={color} />;
//       case 'port':
//         return <TruckIcon size={size} color={color} />;
//       default:
//         return <CarIcon size={size} color={color} />;
//     }
//   };

//   // Render driver item
//   const renderDriverItem = (driver: Driver) => (
//     <TouchableOpacity
//       key={driver.id}
//       style={[
//         styles.driverItem,
//         selectedDriver?.id === driver.id && styles.selectedDriverItem
//       ]}
//       onPress={() => handleSelectDriver(driver)}
//     >
//       <View style={styles.driverInfo}>
//         <View style={styles.driverIcon}>
//           {renderVehicleIcon(driver.type, 20, '#FFFFFF')}
//         </View>
//         <View style={styles.driverDetails}>
//           <Text style={styles.driverName}>{driver.name}</Text>
//           <Text style={styles.driverVehicle}>{driver.vehicleNumber}</Text>
//           <View style={styles.ratingContainer}>
//             <Ionicons name="star" size={12} color="#FFD700" />
//             <Text style={styles.ratingText}>{driver.rating.toFixed(1)}</Text>
//           </View>
//         </View>
//       </View>
//       <View style={styles.driverMeta}>
//         <Text style={styles.etaText}>{driver.eta} away</Text>
//         <Text style={styles.priceText}>₹{driver.price}</Text>
//         <Text style={styles.distanceText}>{driver.distance} km</Text>
//       </View>
//     </TouchableOpacity>
//   );

//   // Check if all details are filled to enable the book ride button
//   const isBookRideButtonEnabled = pickupLocation && dropoffLocation && selectedDriver;

//   return (
//     <View style={styles.contentContainer}>
//       <View style={styles.mapContainer}>
//         {loadingLocation ? (
//           <Text style={styles.mapLoadingText}>Loading map...</Text>
//         ) : currentLocation ? (
//           <MapView
//             ref={mapRef}
//             style={styles.map}
//             initialRegion={{
//               latitude: currentLocation.latitude,
//               longitude: currentLocation.longitude,
//               latitudeDelta: 0.01,
//               longitudeDelta: 0.01,
//             }}
//             region={mapRegion || undefined}
//             onRegionChange={handleRegionChange}
//             onRegionChangeComplete={handleRegionChangeComplete}
//             customMapStyle={customMapStyle}
//             legalLabelInsets={{ bottom: -100, right: -100 }} // Hide Google logo
//           >
//             {/* Route polyline */}
//             {showRoute && routeCoords.length > 0 && (
//               <Polyline
//                 coordinates={routeCoords}
//                 strokeColor="#4CAF50"
//                 strokeWidth={4}
//                 lineDashPattern={[0]}
//               />
//             )}
            
//             {/* Current location marker */}
//             {!selectingPickup && !selectingDropoff && currentLocation && (
//               <Marker coordinate={currentLocation} title="My Current Location">
//                 <View style={styles.currentLocationMarker}>
//                   <MaterialIcons name="my-location" size={24} color="#4CAF50" />
//                 </View>
//               </Marker>
//             )}
            
//             {/* Pickup marker */}
//             {pickupLocation && !selectingPickup && (
//               <Marker coordinate={pickupLocation} title="Pickup Location">
//                 <View style={styles.pickupLocationMarker}>
//                   <MaterialIcons name="location-on" size={24} color="#4CAF50" />
//                 </View>
//               </Marker>
//             )}
            
//             {/* Dropoff marker */}
//             {dropoffLocation && !selectingDropoff && (
//               <Marker coordinate={dropoffLocation} title="Dropoff Location">
//                 <View style={styles.dropoffLocationMarker}>
//                   <MaterialIcons name="location-on" size={24} color="#F44336" />
//                 </View>
//               </Marker>
//             )}
            
//             {/* Driver markers */}
//             {showDrivers && !isTraveling && drivers.map(driver => (
//               <Marker
//                 key={driver.id}
//                 coordinate={driver.location}
//                 title={driver.name}
//                 description={`${driver.distance}km away • ${driver.eta}`}
//               >
//                 <View style={styles.driverMarkerContainer}>
//                   {renderVehicleIcon(driver.type, 24, '#90EE90')}
//                 </View>
//               </Marker>
//             ))}

//             {/* Traveling vehicle marker */}
//             {isTraveling && selectedDriver && vehiclePosition && (
//               <Marker
//                 coordinate={vehiclePosition}
//                 title={selectedDriver.name}
//                 description="Your ride"
//                 rotation={vehicleRotation}
//                 anchor={{ x: 0.5, y: 0.5 }}
//                 flat={true}
//               >
//                 <View style={styles.driverMarkerContainer}>
//                   {renderVehicleIcon(selectedDriver.type, 30, '#FF5722')}
//                 </View>
//               </Marker>
//             )}
//           </MapView>
//         ) : (
//           <Text style={styles.mapLoadingText}>Could not get location. Check permissions.</Text>
//         )}
        
//         {/* Center marker when selecting */}
//         {(selectingPickup || selectingDropoff) && mapCenter && (
//           <View style={styles.centerMarkerContainer}>
//             <MaterialIcons
//               name={selectingPickup ? "my-location" : "location-on"}
//               size={30}
//               color={selectingPickup ? "#4CAF50" : "#F44336"}
//             />
//           </View>
//         )}
//       </View>
      
//       <LocationInput
//         pickup={pickup}
//         dropoff={dropoff}
//         handlePickupChange={handlePickupChange}
//         handleDropoffChange={handleDropoffChange}
//         showDropoffSuggestions={showDropoffSuggestions}
//         setSelectingPickup={setSelectingPickup}
//         setSelectingDropoff={setSelectingDropoff}
//         onSelectPickupOnMap={handleSelectPickupOnMap}
//         onSelectDropoffOnMap={handleSelectDropoffOnMap}
//         selectingPickup={selectingPickup}
//         selectingDropoff={selectingDropoff}
//       />
      
//       {showDropoffSuggestions && suggestions.length > 0 && (
//         <View style={styles.suggestionsContainer}>
//           {suggestions.map((item) => (
//             <TouchableOpacity
//               key={item.id}
//               style={styles.suggestionItem}
//               onPress={() => selectSuggestion(item)}
//             >
//               <MaterialIcons name="location-on" size={20} color="#A9A9A9" style={styles.suggestionIcon} />
//               <Text style={styles.suggestionText}>{item.name}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       )}
      
//       {/* Distance and Travel Time Display */}
//       {(distance || travelTime) && (
//         <View style={styles.distanceTimeContainer}>
//           <View style={styles.distanceTimeItem}>
//             <Text style={styles.distanceTimeLabel}>DISTANCE:</Text>
//             <Text style={styles.distanceTimeValue}>{distance || '---'}</Text>
//           </View>
//           <View style={styles.distanceTimeItem}>
//             <Text style={styles.distanceTimeLabel}>TRAVEL TIME:</Text>
//             <Text style={styles.distanceTimeValue}>{travelTime || '---'}</Text>
//           </View>
//         </View>
//       )}
      
//       {apiError && (
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>{apiError}</Text>
//         </View>
//       )}
      
//       <TouchableOpacity
//         style={[styles.seeRouteButton, (!pickupLocation || !dropoffLocation) && styles.disabledButton]}
//         onPress={handleSeeRoute}
//         disabled={!pickupLocation || !dropoffLocation || loadingRoute}
//       >
//         {loadingRoute ? (
//           <ActivityIndicator color="#FFFFFF" />
//         ) : (
//           <Text style={styles.seeRouteButtonText}>See My Route</Text>
//         )}
//       </TouchableOpacity>
      
//       <RideTypeSelector 
//         selectedRideType={selectedRideType} 
//         setSelectedRideType={handleRideTypeSelect} 
//       />
      
//       {/* BOOK RIDE Button */}
//       <TouchableOpacity
//         style={[
//           styles.bookRideButton,
//           isBookRideButtonEnabled ? styles.enabledBookRideButton : styles.disabledBookRideButton
//         ]}
//         onPress={handleNavigateToBooking}
//         disabled={!isBookRideButtonEnabled}
//       >
//         <Text style={styles.bookRideButtonText}>BOOK RIDE</Text>
//       </TouchableOpacity>
      
//       {/* Driver Selection Panel */}
//       {showDriverPanel && (
//         <Animated.View 
//           style={[
//             styles.driverPanel,
//             {
//               transform: [{
//                 translateY: panelAnimation.interpolate({
//                   inputRange: [0, 1],
//                   outputRange: [300, 0]
//                 })
//               }]
//             }
//           ]}
//         >
//           <View style={styles.panelHeader}>
//             <Text style={styles.panelTitle}>Available {selectedRideType === 'bike' ? 'Bikes' : selectedRideType === 'taxi' ? 'Taxis' : 'Port Vehicles'}</Text>
//             <TouchableOpacity onPress={() => setShowDriverPanel(false)}>
//               <MaterialIcons name="close" size={24} color="#666" />
//             </TouchableOpacity>
//           </View>
          
//           <ScrollView style={styles.driversList}>
//             {drivers.map(renderDriverItem)}
//           </ScrollView>
          
//           {selectedDriver && (
//             <View style={styles.selectedDriverContainer}>
//               <BookRideButton 
//                 onPress={handleBookRide}
//                 driver={selectedDriver}
//               />
//             </View>
//           )}
//         </Animated.View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   contentContainer: { 
//     flex: 1, 
//     padding: 20, 
//     alignItems: 'center',
//     backgroundColor: '#F5F5F5',
//   },
//   // Reduced map container size
//   mapContainer: {
//     width: '100%',
//     height: Dimensions.get('window').height * 0.25, // Reduced from 0.4 to 0.25
//     borderRadius: 15,
//     overflow: 'hidden',
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   map: { ...StyleSheet.absoluteFillObject },
//   mapLoadingText: { 
//     color: '#757575', 
//     fontSize: 16,
//     textAlign: 'center',
//     padding: 20,
//   },
//   centerMarkerContainer: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     marginLeft: -15,
//     marginTop: -30,
//     zIndex: 10,
//     elevation: 5,
//   },
//   currentLocationMarker: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 20,
//     padding: 5,
//     borderWidth: 2,
//     borderColor: '#4CAF50',
//   },
//   pickupLocationMarker: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 20,
//     padding: 5,
//     borderWidth: 2,
//     borderColor: '#4CAF50',
//   },
//   dropoffLocationMarker: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 20,
//     padding: 5,
//     borderWidth: 2,
//     borderColor: '#F44336',
//   },
//   driverMarkerContainer: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: 30,
//     height: 30,
//   },
//   suggestionsContainer: {
//     width: '100%',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 15,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   suggestionItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEEEEE',
//   },
//   suggestionIcon: { 
//     marginRight: 12,
//   },
//   suggestionText: { 
//     fontSize: 16, 
//     color: '#333333',
//     flex: 1,
//   },
//   // New styles for distance and travel time
//   distanceTimeContainer: {
//     width: '100%',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 15,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 15,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   distanceTimeItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   distanceTimeLabel: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#757575',
//     marginRight: 8,
//   },
//   distanceTimeValue: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: '#333333',
//   },
//   seeRouteButton: {
//     backgroundColor: '#4CAF50',
//     paddingVertical: 15,
//     borderRadius: 12,
//     marginBottom: 15,
//     width: '100%',
//     alignItems: 'center',
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//   },
//   disabledButton: {
//     backgroundColor: '#BDBDBD',
//   },
//   seeRouteButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   // New styles for BOOK RIDE button
//   bookRideButton: {
//     paddingVertical: 15,
//     borderRadius: 12,
//     marginBottom: 15,
//     width: '100%',
//     alignItems: 'center',
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//   },
//   enabledBookRideButton: {
//     backgroundColor: '#FF5722',
//   },
//   disabledBookRideButton: {
//     backgroundColor: '#BDBDBD',
//   },
//   bookRideButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   errorContainer: {
//     width: '100%',
//     backgroundColor: '#FFEBEE',
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 15,
//     borderLeftWidth: 4,
//     borderLeftColor: '#F44336',
//   },
//   errorText: {
//     color: '#D32F2F',
//     fontSize: 14,
//     textAlign: 'center',
//   },
//   driverPanel: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: '#FFFFFF',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     padding: 20,
//     maxHeight: Dimensions.get('window').height * 0.5,
//     elevation: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -3 },
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//   },
//   panelHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 15,
//     paddingBottom: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEEEEE',
//   },
//   panelTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333333',
//   },
//   driversList: {
//     maxHeight: Dimensions.get('window').height * 0.3,
//   },
//   driverItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 15,
//     marginBottom: 10,
//     backgroundColor: '#FAFAFA',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#EEEEEE',
//   },
//   selectedDriverItem: {
//     backgroundColor: '#E8F5E9',
//     borderColor: '#4CAF50',
//     borderWidth: 2,
//   },
//   driverInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   driverIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#4CAF50',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   driverDetails: {
//     flex: 1,
//   },
//   driverName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333333',
//     marginBottom: 2,
//   },
//   driverVehicle: {
//     fontSize: 12,
//     color: '#757575',
//     marginBottom: 4,
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   ratingText: {
//     fontSize: 12,
//     color: '#757575',
//     marginLeft: 4,
//   },
//   driverMeta: {
//     alignItems: 'flex-end',
//   },
//   etaText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#4CAF50',
//     marginBottom: 4,
//   },
//   priceText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333333',
//     marginBottom: 4,
//   },
//   distanceText: {
//     fontSize: 12,
//     color: '#757575',
//   },
//   selectedDriverContainer: {
//     marginTop: 15,
//     paddingTop: 15,
//     borderTopWidth: 1,
//     borderTopColor: '#EEEEEE',
//   },
// });

// export default TaxiContent;






// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   Dimensions,
//   Alert,
//   ActivityIndicator,
//   Animated,
//   ScrollView,
//   Image,
// } from 'react-native';
// import MapView, { Marker, Region, Polyline } from 'react-native-maps';
// import LocationInput from './LocationInput';
// import RideTypeSelector from './RideTypeSelector';
// import BookRideButton from './BookRideButton';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import axios from 'axios';
// import { SvgUri } from 'react-native-svg'; // Import this for handling SVGs

// interface Location {
//   latitude: number;
//   longitude: number;
// }
// interface Driver {
//   id: string;
//   location: Location;
//   type: 'bike' | 'taxi' | 'port';
//   name: string;
//   rating: number;
//   distance: number;
//   eta: string;
//   price: number;
//   vehicleNumber: string;
// }
// interface TaxiContentProps {
//   loadingLocation: boolean;
//   currentLocation: Location | null;
//   lastSavedLocation: Location | null;
//   pickup: string;
//   dropoff: string;
//   suggestions: { id: string; name: string }[];
//   showDropoffSuggestions: boolean;
//   handlePickupChange: (text: string) => void;
//   handleDropoffChange: (text: string) => void;
//   selectSuggestion: (suggestion: { id: string; name: string }) => void;
//   selectingPickup: boolean;
//   setSelectingPickup: (value: boolean) => void;
//   selectingDropoff: boolean;
//   setSelectingDropoff: (value: boolean) => void;
//   setPickup: (value: string) => void;
//   setDropoff: (value: string) => void;
// }

// const GOOGLE_API_KEY = 'AIzaSyA9Ef953b2mO_rr940k-3OclHSZp3ldM2o';
// const TaxiContent: React.FC<TaxiContentProps> = ({
//   loadingLocation,
//   currentLocation,
//   lastSavedLocation,
//   pickup,
//   dropoff,
//   suggestions,
//   showDropoffSuggestions,
//   handlePickupChange,
//   handleDropoffChange,
//   selectSuggestion,
//   selectingPickup,
//   setSelectingPickup,
//   selectingDropoff,
//   setSelectingDropoff,
//   setPickup,
//   setDropoff,
// }) => {
//   const [selectedRideType, setSelectedRideType] = useState<string>('bike');
//   const [mapCenter, setMapCenter] = useState<Location | null>(null);
//   const [isMapMoving, setIsMapMoving] = useState(false);
//   const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
//   const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
//   const [routeCoords, setRouteCoords] = useState<Location[]>([]);
//   const [showRoute, setShowRoute] = useState(false);
//   const [loadingRoute, setLoadingRoute] = useState(false);
//   const [mapRegion, setMapRegion] = useState<Region | null>(null);
//   const [apiError, setApiError] = useState<string | null>(null);
//   const [drivers, setDrivers] = useState<Driver[]>([]);
//   const [showDrivers, setShowDrivers] = useState(false);
//   const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
//   const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
//   const [showDriverPanel, setShowDriverPanel] = useState(false);
//   // New state for distance and travel time
//   const [distance, setDistance] = useState<string>('');
//   const [travelTime, setTravelTime] = useState<string>('');
  
//   const mapRef = useRef<MapView>(null);
//   const panelAnimation = useRef(new Animated.Value(0)).current;
  
//   const dropoffSuggestions = [
//     { id: '1', name: 'Central Mall' },
//     { id: '2', name: 'Railway Station' },
//     { id: '3', name: 'Airport' },
//   ];

//   // Animate driver panel
//   useEffect(() => {
//     if (showDriverPanel) {
//       Animated.timing(panelAnimation, {
//         toValue: 1,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     } else {
//       Animated.timing(panelAnimation, {
//         toValue: 0,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     }
//   }, [showDriverPanel]);

//   // Generate random drivers near current location
//   const generateDrivers = (type: 'bike' | 'taxi' | 'port') => {
//     if (!currentLocation) return [];
    
//     const newDrivers: Driver[] = [];
//     // Updated driver counts based on requirements
//     const driverCount = type === 'bike' ? 7 : type === 'taxi' ? 5 : 5;
    
//     for (let i = 0; i < driverCount; i++) {
//       // Generate random location within 3km radius
//       const radius = 3; // 3km
//       const angle = Math.random() * Math.PI * 2;
//       const distance = Math.random() * radius;
      
//       const latOffset = (distance / 111.32) * Math.cos(angle);
//       const lngOffset = (distance / 111.32) * Math.sin(angle);
      
//       const driverLocation = {
//         latitude: currentLocation.latitude + latOffset,
//         longitude: currentLocation.longitude + lngOffset,
//       };
      
//       // Calculate ETA based on distance (approx 1 min per 0.5km)
//       const etaMinutes = Math.max(1, Math.round(distance * 2));
      
//       // Calculate price based on ride type and distance
//       let baseFare = 0;
//       let perKm = 0;
      
//       switch (type) {
//         case 'bike':
//           baseFare = 20;
//           perKm = 8;
//           break;
//         case 'taxi':
//           baseFare = 50;
//           perKm = 15;
//           break;
//         case 'port':
//           baseFare = 80;
//           perKm = 25;
//           break;
//       }
      
//       const price = Math.round(baseFare + (distance * perKm));
      
//       newDrivers.push({
//         id: `${type}-${i}`,
//         location: driverLocation,
//         type,
//         name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
//         rating: 4 + Math.random(), // 4.0 to 5.0
//         distance: Math.round(distance * 10) / 10, // 1 decimal place
//         eta: `${etaMinutes} min${etaMinutes > 1 ? 's' : ''}`,
//         price,
//         vehicleNumber: `${type.toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`,
//       });
//     }
    
//     // Sort by distance
//     return newDrivers.sort((a, b) => a.distance - b.distance);
//   };

//   useEffect(() => {
//     if (pickupLocation && dropoffLocation && routeCoords.length > 0) {
//       const price = calculatePrice();
//       setEstimatedPrice(price);
//     }
//   }, [pickupLocation, dropoffLocation, routeCoords, selectedRideType]);

//   // Fetch address by coordinates
//   const fetchAddress = async (latitude: number, longitude: number): Promise<string> => {
//     try {
//       const response = await axios.get(
//         `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
//       );
//       if (response.data.status === 'OK' && response.data.results.length > 0) {
//         return response.data.results[0].formatted_address;
//       }
//       return 'Unknown Location';
//     } catch (error) {
//       console.error('Geocoding error:', error);
//       return 'Error fetching address';
//     }
//   };

//   // Fetch route between pickup & dropoff
//   const fetchRoute = async (pickup: Location, dropoff: Location) => {
//     setLoadingRoute(true);
//     setApiError(null);
    
//     try {
//       const response = await axios.get(
//         `https://maps.googleapis.com/maps/api/directions/json?origin=${pickup.latitude},${pickup.longitude}&destination=${dropoff.latitude},${dropoff.longitude}&key=${GOOGLE_API_KEY}`
//       );
      
//       if (response.data.status === 'OK' && response.data.routes.length > 0) {
//         const points = decodePolyline(response.data.routes[0].overview_polyline.points);
//         setRouteCoords(points);
        
//         // Extract distance and duration from the response
//         const leg = response.data.routes[0].legs[0];
//         setDistance(leg.distance.text);
//         setTravelTime(leg.duration.text);
        
//         // Adjust map to show the entire route
//         const northeast = response.data.routes[0].bounds.northeast;
//         const southwest = response.data.routes[0].bounds.southwest;
        
//         const region = {
//           latitude: (northeast.lat + southwest.lat) / 2,
//           longitude: (northeast.lng + southwest.lng) / 2,
//           latitudeDelta: Math.abs(northeast.lat - southwest.lat) * 1.5,
//           longitudeDelta: Math.abs(northeast.lng - southwest.lng) * 1.5,
//         };
        
//         setMapRegion(region);
//         mapRef.current?.animateToRegion(region, 1000);
//       } else if (response.data.status === 'REQUEST_DENIED') {
//         setApiError('API Key Error: Directions API is not enabled for this project. Please enable it in Google Cloud Console.');
//         Alert.alert(
//           'API Key Error',
//           'The Directions API is not enabled for this project. Please enable it in the Google Cloud Console and wait 5-10 minutes for changes to take effect.'
//         );
//       } else {
//         setApiError(`Route Error: ${response.data.status}`);
//         Alert.alert('Route Error', `Could not find route: ${response.data.status}`);
//       }
//     } catch (error: any) {
//       console.error("Error fetching route:", error.response?.data || error.message);
//       setApiError('Network Error: Failed to fetch route');
//       Alert.alert('Route Error', 'Failed to fetch route. Please check your internet connection.');
//     } finally {
//       setLoadingRoute(false);
//     }
//   };

//   // Polyline decoder
//   const decodePolyline = (t: string) => {
//     let points: Location[] = [];
//     let index = 0, lat = 0, lng = 0;
    
//     while (index < t.length) {
//       let b, shift = 0, result = 0;
//       do {
//         b = t.charCodeAt(index++) - 63;
//         result |= (b & 0x1f) << shift;
//         shift += 5;
//       } while (b >= 0x20);
      
//       let dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
//       lat += dlat;
//       shift = 0;
//       result = 0;
      
//       do {
//         b = t.charCodeAt(index++) - 63;
//         result |= (b & 0x1f) << shift;
//         shift += 5;
//       } while (b >= 0x20);
      
//       let dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
//       lng += dlng;
//       points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
//     }
    
//     return points;
//   };

//   // Calculate estimated price
//   const calculatePrice = () => {
//     if (!pickupLocation || !dropoffLocation || !routeCoords.length) return null;
    
//     // Simple distance calculation (Haversine formula)
//     const toRad = (value: number) => (value * Math.PI) / 180;
//     const R = 6371; // Earth radius in km
//     const dLat = toRad(dropoffLocation.latitude - pickupLocation.latitude);
//     const dLon = toRad(dropoffLocation.longitude - pickupLocation.longitude);
//     const a = 
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(toRad(pickupLocation.latitude)) * 
//       Math.cos(toRad(dropoffLocation.latitude)) * 
//       Math.sin(dLon / 2) * Math.sin(dLon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     const distance = R * c; // Distance in km
    
//     // Price calculation based on ride type
//     let baseFare = 0;
//     let perKm = 0;
    
//     switch (selectedRideType) {
//       case 'bike':
//         baseFare = 20;
//         perKm = 8;
//         break;
//       case 'taxi':
//         baseFare = 50;
//         perKm = 15;
//         break;
//       case 'port':
//         baseFare = 80;
//         perKm = 25;
//         break;
//       default:
//         baseFare = 50;
//         perKm = 15;
//     }
    
//     return Math.round(baseFare + (distance * perKm));
//   };

//   // Handle See My Route button press
//   const handleSeeRoute = () => {
//     if (!pickupLocation || !dropoffLocation) {
//       Alert.alert('Location Missing', 'Please select both pickup and dropoff locations');
//       return;
//     }
    
//     setShowRoute(true);
//     fetchRoute(pickupLocation, dropoffLocation);
//   };

//   // Handle ride type selection
//   const handleRideTypeSelect = (type: string) => {
//     setSelectedRideType(type);
//     setSelectedDriver(null);
//     setShowDriverPanel(true);
    
//     // Generate drivers based on selected type
//     const newDrivers = generateDrivers(type as 'bike' | 'taxi' | 'port');
//     setDrivers(newDrivers);
//     setShowDrivers(true);
    
//     // Calculate price if route is already shown
//     if (pickupLocation && dropoffLocation && routeCoords.length > 0) {
//       const price = calculatePrice();
//       setEstimatedPrice(price);
//     }
//   };

//   // Handle driver selection
//   const handleSelectDriver = (driver: Driver) => {
//     setSelectedDriver(driver);
//   };

//   // Handle book ride
//   const handleBookRide = () => {
//     if (!selectedDriver) {
//       Alert.alert('Error', 'Please select a driver first');
//       return;
//     }
    
//     Alert.alert(
//       'Confirm Booking',
//       `Ride Price: ₹${selectedDriver.price}\nAre you sure you want to book this ${selectedDriver.type}?`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Confirm', 
//           onPress: () => {
//             Alert.alert('Success', `Your ${selectedDriver.type} ride has been booked for ₹${selectedDriver.price}!`);
//             // Here you would typically send the booking to your backend
//           }
//         }
//       ]
//     );
//   };

//   // Handle navigation to booking screen
//   const handleNavigateToBooking = () => {
//     // This function would navigate to the next screen
//     // For now, we'll just show an alert
//     Alert.alert('Navigation', 'Navigating to booking confirmation screen...');
//   };

//   // Select pickup on map
//   const handleSelectPickupOnMap = async () => {
//     setSelectingPickup(true);
//     setSelectingDropoff(false);
//     try {
//       if (currentLocation) {
//         setMapCenter(currentLocation);
//         mapRef.current?.animateToRegion({
//           ...currentLocation,
//           latitudeDelta: 0.01,
//           longitudeDelta: 0.01,
//         }, 1000);
//       }
//     } catch (error) {
//       if (currentLocation) setMapCenter(currentLocation);
//     }
//   };

//   // Select dropoff on map
//   const handleSelectDropoffOnMap = async () => {
//     setSelectingDropoff(true);
//     setSelectingPickup(false);
//     try {
//       if (currentLocation) {
//         setMapCenter(currentLocation);
//         mapRef.current?.animateToRegion({
//           ...currentLocation,
//           latitudeDelta: 0.01,
//           longitudeDelta: 0.01,
//         }, 1000);
//       }
//     } catch (error) {
//       if (currentLocation) setMapCenter(currentLocation);
//     }
//   };

//   // Track map movement
//   const handleRegionChange = (region: Region) => {
//     if (selectingPickup || selectingDropoff) {
//       setIsMapMoving(true);
//       setMapCenter({
//         latitude: region.latitude,
//         longitude: region.longitude,
//       });
//     }
//   };

//   const handleRegionChangeComplete = async (region: Region) => {
//     if ((selectingPickup || selectingDropoff) && isMapMoving) {
//       setIsMapMoving(false);
//       const center = {
//         latitude: region.latitude,
//         longitude: region.longitude,
//       };
//       const address = await fetchAddress(center.latitude, center.longitude);
      
//       if (selectingPickup) {
//         setPickupLocation(center);
//         setPickup(address);
//       } else if (selectingDropoff) {
//         setDropoffLocation(center);
//         setDropoff(address);
//       }
//     }
//   };

//   // Custom map style - clean and minimal
//   const customMapStyle = [
//     {
//       "elementType": "geometry",
//       "stylers": [{ "color": "#f5f5f5" }]
//     },
//     {
//       "elementType": "labels.icon",
//       "stylers": [{ "visibility": "off" }]
//     },
//     {
//       "elementType": "labels.text.fill",
//       "stylers": [{ "color": "#616161" }]
//     },
//     {
//       "elementType": "labels.text.stroke",
//       "stylers": [{ "color": "#f5f5f5" }]
//     },
//     {
//       "featureType": "administrative.land_parcel",
//       "stylers": [{ "visibility": "off" }]
//     },
//     {
//       "featureType": "administrative.neighborhood",
//       "stylers": [{ "visibility": "off" }]
//     },
//     {
//       "featureType": "poi",
//       "stylers": [{ "visibility": "off" }]
//     },
//     {
//       "featureType": "road",
//       "elementType": "geometry",
//       "stylers": [{ "color": "#ffffff" }]
//     },
//     {
//       "featureType": "road",
//       "elementType": "labels.icon",
//       "stylers": [{ "visibility": "off" }]
//     },
//     {
//       "featureType": "transit",
//       "stylers": [{ "visibility": "off" }]
//     },
//     {
//       "featureType": "water",
//       "elementType": "geometry",
//       "stylers": [{ "color": "#c9c9c9" }]
//     }
//   ];

//   // Render vehicle icon based on type
//   const renderVehicleIcon = (type: 'bike' | 'taxi' | 'port', size: number = 24, color: string = '#000000') => {
//     switch (type) {
//       case 'bike':
//         return <FontAwesome name="motorcycle" size={size} color={color} />;
//       case 'taxi':
//         return <FontAwesome name="car" size={size} color={color} />;
//       case 'port':
//         return <MaterialIcons name="local-shipping" size={size} color={color} />;
//       default:
//         return <FontAwesome name="car" size={size} color={color} />;
//     }
//   };

//   // Render driver item
//   const renderDriverItem = (driver: Driver) => (
//     <TouchableOpacity
//       key={driver.id}
//       style={[
//         styles.driverItem,
//         selectedDriver?.id === driver.id && styles.selectedDriverItem
//       ]}
//       onPress={() => handleSelectDriver(driver)}
//     >
//       <View style={styles.driverInfo}>
//         <View style={styles.driverIcon}>
//           {renderVehicleIcon(driver.type, 20, '#000000')}
//         </View>
//         <View style={styles.driverDetails}>
//           <Text style={styles.driverName}>{driver.name}</Text>
//           <Text style={styles.driverVehicle}>{driver.vehicleNumber}</Text>
//           <View style={styles.ratingContainer}>
//             <Ionicons name="star" size={12} color="#FFD700" />
//             <Text style={styles.ratingText}>{driver.rating.toFixed(1)}</Text>
//           </View>
//         </View>
//       </View>
//       <View style={styles.driverMeta}>
//         <Text style={styles.etaText}>{driver.eta} away</Text>
//         <Text style={styles.priceText}>₹{driver.price}</Text>
//         <Text style={styles.distanceText}>{driver.distance} km</Text>
//       </View>
//     </TouchableOpacity>
//   );

//   // Check if all details are filled to enable the book ride button
//   const isBookRideButtonEnabled = pickupLocation && dropoffLocation && selectedDriver;

//   return (
//     <View style={styles.contentContainer}>
//       <View style={styles.mapContainer}>
//         {loadingLocation ? (
//           <Text style={styles.mapLoadingText}>Loading map...</Text>
//         ) : currentLocation ? (
//           <MapView
//             ref={mapRef}
//             style={styles.map}
//             initialRegion={{
//               latitude: currentLocation.latitude,
//               longitude: currentLocation.longitude,
//               latitudeDelta: 0.01,
//               longitudeDelta: 0.01,
//             }}
//             region={mapRegion || undefined}
//             onRegionChange={handleRegionChange}
//             onRegionChangeComplete={handleRegionChangeComplete}
//             customMapStyle={customMapStyle}
//             legalLabelInsets={{ bottom: -100, right: -100 }} // Hide Google logo
//           >
//             {/* Route polyline */}
//             {showRoute && routeCoords.length > 0 && (
//               <Polyline
//                 coordinates={routeCoords}
//                 strokeColor="#4CAF50"
//                 strokeWidth={4}
//                 lineDashPattern={[0]}
//               />
//             )}
            
//             {/* Current location marker */}
//             {!selectingPickup && !selectingDropoff && currentLocation && (
//               <Marker coordinate={currentLocation} title="My Current Location">
//                 <View style={styles.currentLocationMarker}>
//                   <MaterialIcons name="my-location" size={24} color="#4CAF50" />
//                 </View>
//               </Marker>
//             )}
            
//             {/* Pickup marker */}
//             {pickupLocation && !selectingPickup && (
//               <Marker coordinate={pickupLocation} title="Pickup Location">
//                 <View style={styles.pickupLocationMarker}>
//                   <MaterialIcons name="location-on" size={24} color="#4CAF50" />
//                 </View>
//               </Marker>
//             )}
            
//             {/* Dropoff marker */}
//             {dropoffLocation && !selectingDropoff && (
//               <Marker coordinate={dropoffLocation} title="Dropoff Location">
//                 <View style={styles.dropoffLocationMarker}>
//                   <MaterialIcons name="location-on" size={24} color="#F44336" />
//                 </View>
//               </Marker>
//             )}
            
//             {/* Driver markers */}
//             {showDrivers && drivers.map(driver => (
//               <Marker
//                 key={driver.id}
//                 coordinate={driver.location}
//                 title={driver.name}
//                 description={`${driver.distance}km away • ${driver.eta}`}
//               >
//                 <View style={styles.driverMarkerContainer}>
//                   {renderVehicleIcon(driver.type, 24, '#90EE90')}
//                 </View>
//               </Marker>
//             ))}
//           </MapView>
//         ) : (
//           <Text style={styles.mapLoadingText}>Could not get location. Check permissions.</Text>
//         )}
        
//         {/* Center marker when selecting */}
//         {(selectingPickup || selectingDropoff) && mapCenter && (
//           <View style={styles.centerMarkerContainer}>
//             <MaterialIcons
//               name={selectingPickup ? "my-location" : "location-on"}
//               size={30}
//               color={selectingPickup ? "#4CAF50" : "#F44336"}
//             />
//           </View>
//         )}
//       </View>
      
//       <LocationInput
//         pickup={pickup}
//         dropoff={dropoff}
//         handlePickupChange={handlePickupChange}
//         handleDropoffChange={handleDropoffChange}
//         showDropoffSuggestions={showDropoffSuggestions}
//         setSelectingPickup={setSelectingPickup}
//         setSelectingDropoff={setSelectingDropoff}
//         onSelectPickupOnMap={handleSelectPickupOnMap}
//         onSelectDropoffOnMap={handleSelectDropoffOnMap}
//         selectingPickup={selectingPickup}
//         selectingDropoff={selectingDropoff}
//       />
      
//       {showDropoffSuggestions && suggestions.length > 0 && (
//         <View style={styles.suggestionsContainer}>
//           {suggestions.map((item) => (
//             <TouchableOpacity
//               key={item.id}
//               style={styles.suggestionItem}
//               onPress={() => selectSuggestion(item)}
//             >
//               <MaterialIcons name="location-on" size={20} color="#A9A9A9" style={styles.suggestionIcon} />
//               <Text style={styles.suggestionText}>{item.name}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       )}
      
//       {/* Distance and Travel Time Display */}
//       {(distance || travelTime) && (
//         <View style={styles.distanceTimeContainer}>
//           <View style={styles.distanceTimeItem}>
//             <Text style={styles.distanceTimeLabel}>DISTANCE:</Text>
//             <Text style={styles.distanceTimeValue}>{distance || '---'}</Text>
//           </View>
//           <View style={styles.distanceTimeItem}>
//             <Text style={styles.distanceTimeLabel}>TRAVEL TIME:</Text>
//             <Text style={styles.distanceTimeValue}>{travelTime || '---'}</Text>
//           </View>
//         </View>
//       )}
      
//       {apiError && (
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>{apiError}</Text>
//         </View>
//       )}
      
//       <TouchableOpacity
//         style={[styles.seeRouteButton, (!pickupLocation || !dropoffLocation) && styles.disabledButton]}
//         onPress={handleSeeRoute}
//         disabled={!pickupLocation || !dropoffLocation || loadingRoute}
//       >
//         {loadingRoute ? (
//           <ActivityIndicator color="#FFFFFF" />
//         ) : (
//           <Text style={styles.seeRouteButtonText}>See My Route</Text>
//         )}
//       </TouchableOpacity>
      
//       <RideTypeSelector 
//         selectedRideType={selectedRideType} 
//         setSelectedRideType={handleRideTypeSelect} 
//       />
      
//       {/* BOOK RIDE Button */}
//       <TouchableOpacity
//         style={[
//           styles.bookRideButton,
//           isBookRideButtonEnabled ? styles.enabledBookRideButton : styles.disabledBookRideButton
//         ]}
//         onPress={handleNavigateToBooking}
//         disabled={!isBookRideButtonEnabled}
//       >
//         <Text style={styles.bookRideButtonText}>BOOK RIDE</Text>
//       </TouchableOpacity>
      
//       {/* Driver Selection Panel */}
//       {showDriverPanel && (
//         <Animated.View 
//           style={[
//             styles.driverPanel,
//             {
//               transform: [{
//                 translateY: panelAnimation.interpolate({
//                   inputRange: [0, 1],
//                   outputRange: [300, 0]
//                 })
//               }]
//             }
//           ]}
//         >
//           <View style={styles.panelHeader}>
//             <Text style={styles.panelTitle}>Available {selectedRideType === 'bike' ? 'Bikes' : selectedRideType === 'taxi' ? 'Taxis' : 'Port Vehicles'}</Text>
//             <TouchableOpacity onPress={() => setShowDriverPanel(false)}>
//               <MaterialIcons name="close" size={24} color="#666" />
//             </TouchableOpacity>
//           </View>
          
//           <ScrollView style={styles.driversList}>
//             {drivers.map(renderDriverItem)}
//           </ScrollView>
          
//           {selectedDriver && (
//             <View style={styles.selectedDriverContainer}>
//               <BookRideButton 
//                 onPress={handleBookRide}
//                 driver={selectedDriver}
//               />
//             </View>
//           )}
//         </Animated.View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   contentContainer: { 
//     flex: 1, 
//     padding: 20, 
//     alignItems: 'center',
//     backgroundColor: '#F5F5F5',
//   },
//   // Reduced map container size
//   mapContainer: {
//     width: '100%',
//     height: Dimensions.get('window').height * 0.25, // Reduced from 0.4 to 0.25
//     borderRadius: 15,
//     overflow: 'hidden',
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   map: { ...StyleSheet.absoluteFillObject },
//   mapLoadingText: { 
//     color: '#757575', 
//     fontSize: 16,
//     textAlign: 'center',
//     padding: 20,
//   },
//   centerMarkerContainer: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     marginLeft: -15,
//     marginTop: -30,
//     zIndex: 10,
//     elevation: 5,
//   },
//   currentLocationMarker: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 20,
//     padding: 5,
//     borderWidth: 2,
//     borderColor: '#4CAF50',
//   },
//   pickupLocationMarker: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 20,
//     padding: 5,
//     borderWidth: 2,
//     borderColor: '#4CAF50',
//   },
//   dropoffLocationMarker: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 20,
//     padding: 5,
//     borderWidth: 2,
//     borderColor: '#F44336',
//   },
//   driverMarkerContainer: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: 30,
//     height: 30,
//   },
//   suggestionsContainer: {
//     width: '100%',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 15,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   suggestionItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEEEEE',
//   },
//   suggestionIcon: { 
//     marginRight: 12,
//   },
//   suggestionText: { 
//     fontSize: 16, 
//     color: '#333333',
//     flex: 1,
//   },
//   // New styles for distance and travel time
//   distanceTimeContainer: {
//     width: '100%',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 15,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 15,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   distanceTimeItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   distanceTimeLabel: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#757575',
//     marginRight: 8,
//   },
//   distanceTimeValue: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: '#333333',
//   },
//   seeRouteButton: {
//     backgroundColor: '#4CAF50',
//     paddingVertical: 15,
//     borderRadius: 12,
//     marginBottom: 15,
//     width: '100%',
//     alignItems: 'center',
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//   },
//   disabledButton: {
//     backgroundColor: '#BDBDBD',
//   },
//   seeRouteButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   // New styles for BOOK RIDE button
//   bookRideButton: {
//     paddingVertical: 15,
//     borderRadius: 12,
//     marginBottom: 15,
//     width: '100%',
//     alignItems: 'center',
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//   },
//   enabledBookRideButton: {
//     backgroundColor: '#FF5722',
//   },
//   disabledBookRideButton: {
//     backgroundColor: '#BDBDBD',
//   },
//   bookRideButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   errorContainer: {
//     width: '100%',
//     backgroundColor: '#FFEBEE',
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 15,
//     borderLeftWidth: 4,
//     borderLeftColor: '#F44336',
//   },
//   errorText: {
//     color: '#D32F2F',
//     fontSize: 14,
//     textAlign: 'center',
//   },
//   driverPanel: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: '#FFFFFF',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     padding: 20,
//     maxHeight: Dimensions.get('window').height * 0.5,
//     elevation: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -3 },
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//   },
//   panelHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 15,
//     paddingBottom: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEEEEE',
//   },
//   panelTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333333',
//   },
//   driversList: {
//     maxHeight: Dimensions.get('window').height * 0.3,
//   },
//   driverItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 15,
//     marginBottom: 10,
//     backgroundColor: '#FAFAFA',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#EEEEEE',
//   },
//   selectedDriverItem: {
//     backgroundColor: '#E8F5E9',
//     borderColor: '#4CAF50',
//     borderWidth: 2,
//   },
//   driverInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   driverIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#4CAF50',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//     borderWidth: 2,
//     borderColor: '#000000',
//   },
//   driverDetails: {
//     flex: 1,
//   },
//   driverName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333333',
//     marginBottom: 2,
//   },
//   driverVehicle: {
//     fontSize: 12,
//     color: '#757575',
//     marginBottom: 4,
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   ratingText: {
//     fontSize: 12,
//     color: '#757575',
//     marginLeft: 4,
//   },
//   driverMeta: {
//     alignItems: 'flex-end',
//   },
//   etaText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#4CAF50',
//     marginBottom: 4,
//   },
//   priceText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333333',
//     marginBottom: 4,
//   },
//   distanceText: {
//     fontSize: 12,
//     color: '#757575',
//   },
//   selectedDriverContainer: {
//     marginTop: 15,
//     paddingTop: 15,
//     borderTopWidth: 1,
//     borderTopColor: '#EEEEEE',
//   },
// });

// export default TaxiContent;

















































































































// D:\EazyGo\front\easyGofrontend-main\src\Screen1\Taxibooking\TaxiContent.tsx

// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   Dimensions,
//   Alert,
//   ActivityIndicator,
//   Animated,
//   ScrollView,
//   Image,
// } from 'react-native';
// import MapView, { Marker, Region, Polyline } from 'react-native-maps';
// import LocationInput from './LocationInput';
// import RideTypeSelector from './RideTypeSelector';
// import BookRideButton from './BookRideButton';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import axios from 'axios';

// interface Location {
//   latitude: number;
//   longitude: number;
// }

// interface Driver {
//   id: string;
//   location: Location;
//   type: 'bike' | 'taxi' | 'port';
//   name: string;
//   rating: number;
//   distance: number;
//   eta: string;
//   price: number;
//   vehicleNumber: string;
// }

// interface TaxiContentProps {
//   loadingLocation: boolean;
//   currentLocation: Location | null;
//   lastSavedLocation: Location | null;
//   pickup: string;
//   dropoff: string;
//   suggestions: { id: string; name: string }[];
//   showDropoffSuggestions: boolean;
//   handlePickupChange: (text: string) => void;
//   handleDropoffChange: (text: string) => void;
//   selectSuggestion: (suggestion: { id: string; name: string }) => void;
//   selectingPickup: boolean;
//   setSelectingPickup: (value: boolean) => void;
//   selectingDropoff: boolean;
//   setSelectingDropoff: (value: boolean) => void;
//   setPickup: (value: string) => void;
//   setDropoff: (value: string) => void;
// }

// const GOOGLE_API_KEY = 'AIzaSyA9Ef953b2mO_rr940k-3OclHSZp3ldM2o';

// const TaxiContent: React.FC<TaxiContentProps> = ({
//   loadingLocation,
//   currentLocation,
//   lastSavedLocation,
//   pickup,
//   dropoff,
//   suggestions,
//   showDropoffSuggestions,
//   handlePickupChange,
//   handleDropoffChange,
//   selectSuggestion,
//   selectingPickup,
//   setSelectingPickup,
//   selectingDropoff,
//   setSelectingDropoff,
//   setPickup,
//   setDropoff,
// }) => {
//   const [selectedRideType, setSelectedRideType] = useState<string>('bike');
//   const [mapCenter, setMapCenter] = useState<Location | null>(null);
//   const [isMapMoving, setIsMapMoving] = useState(false);
//   const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
//   const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
//   const [routeCoords, setRouteCoords] = useState<Location[]>([]);
//   const [showRoute, setShowRoute] = useState(false);
//   const [loadingRoute, setLoadingRoute] = useState(false);
//   const [mapRegion, setMapRegion] = useState<Region | null>(null);
//   const [apiError, setApiError] = useState<string | null>(null);
//   const [drivers, setDrivers] = useState<Driver[]>([]);
//   const [showDrivers, setShowDrivers] = useState(false);
//   const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
//   const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
//   const [showDriverPanel, setShowDriverPanel] = useState(false);
  
//   const mapRef = useRef<MapView>(null);
//   const panelAnimation = useRef(new Animated.Value(0)).current;
  
//   const dropoffSuggestions = [
//     { id: '1', name: 'Central Mall' },
//     { id: '2', name: 'Railway Station' },
//     { id: '3', name: 'Airport' },
//   ];

//   // Animate driver panel
//   useEffect(() => {
//     if (showDriverPanel) {
//       Animated.timing(panelAnimation, {
//         toValue: 1,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     } else {
//       Animated.timing(panelAnimation, {
//         toValue: 0,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     }
//   }, [showDriverPanel]);

//   // Generate random drivers near current location
//   const generateDrivers = (type: 'bike' | 'taxi' | 'port') => {
//     if (!currentLocation) return [];
    
//     const newDrivers: Driver[] = [];
//     // Updated driver counts based on requirements
//     const driverCount = type === 'bike' ? 7 : type === 'taxi' ? 5 : 5;
    
//     for (let i = 0; i < driverCount; i++) {
//       // Generate random location within 3km radius
//       const radius = 3; // 3km
//       const angle = Math.random() * Math.PI * 2;
//       const distance = Math.random() * radius;
      
//       const latOffset = (distance / 111.32) * Math.cos(angle);
//       const lngOffset = (distance / 111.32) * Math.sin(angle);
      
//       const driverLocation = {
//         latitude: currentLocation.latitude + latOffset,
//         longitude: currentLocation.longitude + lngOffset,
//       };
      
//       // Calculate ETA based on distance (approx 1 min per 0.5km)
//       const etaMinutes = Math.max(1, Math.round(distance * 2));
      
//       // Calculate price based on ride type and distance
//       let baseFare = 0;
//       let perKm = 0;
      
//       switch (type) {
//         case 'bike':
//           baseFare = 20;
//           perKm = 8;
//           break;
//         case 'taxi':
//           baseFare = 50;
//           perKm = 15;
//           break;
//         case 'port':
//           baseFare = 80;
//           perKm = 25;
//           break;
//       }
      
//       const price = Math.round(baseFare + (distance * perKm));
      
//       newDrivers.push({
//         id: `${type}-${i}`,
//         location: driverLocation,
//         type,
//         name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
//         rating: 4 + Math.random(), // 4.0 to 5.0
//         distance: Math.round(distance * 10) / 10, // 1 decimal place
//         eta: `${etaMinutes} min${etaMinutes > 1 ? 's' : ''}`,
//         price,
//         vehicleNumber: `${type.toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`,
//       });
//     }
    
//     // Sort by distance
//     return newDrivers.sort((a, b) => a.distance - b.distance);
//   };

//   useEffect(() => {
//     if (pickupLocation && dropoffLocation && routeCoords.length > 0) {
//       const price = calculatePrice();
//       setEstimatedPrice(price);
//     }
//   }, [pickupLocation, dropoffLocation, routeCoords, selectedRideType]);

//   // Fetch address by coordinates
//   const fetchAddress = async (latitude: number, longitude: number): Promise<string> => {
//     try {
//       const response = await axios.get(
//         `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
//       );
//       if (response.data.status === 'OK' && response.data.results.length > 0) {
//         return response.data.results[0].formatted_address;
//       }
//       return 'Unknown Location';
//     } catch (error) {
//       console.error('Geocoding error:', error);
//       return 'Error fetching address';
//     }
//   };

//   // Fetch route between pickup & dropoff
//   const fetchRoute = async (pickup: Location, dropoff: Location) => {
//     setLoadingRoute(true);
//     setApiError(null);
    
//     try {
//       const response = await axios.get(
//         `https://maps.googleapis.com/maps/api/directions/json?origin=${pickup.latitude},${pickup.longitude}&destination=${dropoff.latitude},${dropoff.longitude}&key=${GOOGLE_API_KEY}`
//       );
      
//       if (response.data.status === 'OK' && response.data.routes.length > 0) {
//         const points = decodePolyline(response.data.routes[0].overview_polyline.points);
//         setRouteCoords(points);
        
//         // Adjust map to show the entire route
//         const northeast = response.data.routes[0].bounds.northeast;
//         const southwest = response.data.routes[0].bounds.southwest;
        
//         const region = {
//           latitude: (northeast.lat + southwest.lat) / 2,
//           longitude: (northeast.lng + southwest.lng) / 2,
//           latitudeDelta: Math.abs(northeast.lat - southwest.lat) * 1.5,
//           longitudeDelta: Math.abs(northeast.lng - southwest.lng) * 1.5,
//         };
        
//         setMapRegion(region);
//         mapRef.current?.animateToRegion(region, 1000);
//       } else if (response.data.status === 'REQUEST_DENIED') {
//         setApiError('API Key Error: Directions API is not enabled for this project. Please enable it in Google Cloud Console.');
//         Alert.alert(
//           'API Key Error',
//           'The Directions API is not enabled for this project. Please enable it in the Google Cloud Console and wait 5-10 minutes for changes to take effect.'
//         );
//       } else {
//         setApiError(`Route Error: ${response.data.status}`);
//         Alert.alert('Route Error', `Could not find route: ${response.data.status}`);
//       }
//     } catch (error: any) {
//       console.error("Error fetching route:", error.response?.data || error.message);
//       setApiError('Network Error: Failed to fetch route');
//       Alert.alert('Route Error', 'Failed to fetch route. Please check your internet connection.');
//     } finally {
//       setLoadingRoute(false);
//     }
//   };

//   // Polyline decoder
//   const decodePolyline = (t: string) => {
//     let points: Location[] = [];
//     let index = 0, lat = 0, lng = 0;
    
//     while (index < t.length) {
//       let b, shift = 0, result = 0;
//       do {
//         b = t.charCodeAt(index++) - 63;
//         result |= (b & 0x1f) << shift;
//         shift += 5;
//       } while (b >= 0x20);
      
//       let dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
//       lat += dlat;
//       shift = 0;
//       result = 0;
      
//       do {
//         b = t.charCodeAt(index++) - 63;
//         result |= (b & 0x1f) << shift;
//         shift += 5;
//       } while (b >= 0x20);
      
//       let dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
//       lng += dlng;
//       points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
//     }
    
//     return points;
//   };

//   // Calculate estimated price
//   const calculatePrice = () => {
//     if (!pickupLocation || !dropoffLocation || !routeCoords.length) return null;
    
//     // Simple distance calculation (Haversine formula)
//     const toRad = (value: number) => (value * Math.PI) / 180;
//     const R = 6371; // Earth radius in km
//     const dLat = toRad(dropoffLocation.latitude - pickupLocation.latitude);
//     const dLon = toRad(dropoffLocation.longitude - pickupLocation.longitude);
//     const a = 
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(toRad(pickupLocation.latitude)) * 
//       Math.cos(toRad(dropoffLocation.latitude)) * 
//       Math.sin(dLon / 2) * Math.sin(dLon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     const distance = R * c; // Distance in km
    
//     // Price calculation based on ride type
//     let baseFare = 0;
//     let perKm = 0;
    
//     switch (selectedRideType) {
//       case 'bike':
//         baseFare = 20;
//         perKm = 8;
//         break;
//       case 'taxi':
//         baseFare = 50;
//         perKm = 15;
//         break;
//       case 'port':
//         baseFare = 80;
//         perKm = 25;
//         break;
//       default:
//         baseFare = 50;
//         perKm = 15;
//     }
    
//     return Math.round(baseFare + (distance * perKm));
//   };

//   // Handle See My Route button press
//   const handleSeeRoute = () => {
//     if (!pickupLocation || !dropoffLocation) {
//       Alert.alert('Location Missing', 'Please select both pickup and dropoff locations');
//       return;
//     }
    
//     setShowRoute(true);
//     fetchRoute(pickupLocation, dropoffLocation);
//   };

//   // Handle ride type selection
//   const handleRideTypeSelect = (type: string) => {
//     setSelectedRideType(type);
//     setSelectedDriver(null);
//     setShowDriverPanel(true);
    
//     // Generate drivers based on selected type
//     const newDrivers = generateDrivers(type as 'bike' | 'taxi' | 'port');
//     setDrivers(newDrivers);
//     setShowDrivers(true);
    
//     // Calculate price if route is already shown
//     if (pickupLocation && dropoffLocation && routeCoords.length > 0) {
//       const price = calculatePrice();
//       setEstimatedPrice(price);
//     }
//   };

//   // Handle driver selection
//   const handleSelectDriver = (driver: Driver) => {
//     setSelectedDriver(driver);
//   };

//   // Handle book ride
//   const handleBookRide = () => {
//     if (!selectedDriver) {
//       Alert.alert('Error', 'Please select a driver first');
//       return;
//     }
    
//     Alert.alert(
//       'Confirm Booking',
//       `Ride Price: ₹${selectedDriver.price}\nAre you sure you want to book this ${selectedDriver.type}?`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Confirm', 
//           onPress: () => {
//             Alert.alert('Success', `Your ${selectedDriver.type} ride has been booked for ₹${selectedDriver.price}!`);
//             // Here you would typically send the booking to your backend
//           }
//         }
//       ]
//     );
//   };

//   // Select pickup on map
//   const handleSelectPickupOnMap = async () => {
//     setSelectingPickup(true);
//     setSelectingDropoff(false);
//     try {
//       if (currentLocation) {
//         setMapCenter(currentLocation);
//         mapRef.current?.animateToRegion({
//           ...currentLocation,
//           latitudeDelta: 0.01,
//           longitudeDelta: 0.01,
//         }, 1000);
//       }
//     } catch (error) {
//       if (currentLocation) setMapCenter(currentLocation);
//     }
//   };

//   // Select dropoff on map
//   const handleSelectDropoffOnMap = async () => {
//     setSelectingDropoff(true);
//     setSelectingPickup(false);
//     try {
//       if (currentLocation) {
//         setMapCenter(currentLocation);
//         mapRef.current?.animateToRegion({
//           ...currentLocation,
//           latitudeDelta: 0.01,
//           longitudeDelta: 0.01,
//         }, 1000);
//       }
//     } catch (error) {
//       if (currentLocation) setMapCenter(currentLocation);
//     }
//   };

//   // Track map movement
//   const handleRegionChange = (region: Region) => {
//     if (selectingPickup || selectingDropoff) {
//       setIsMapMoving(true);
//       setMapCenter({
//         latitude: region.latitude,
//         longitude: region.longitude,
//       });
//     }
//   };

//   const handleRegionChangeComplete = async (region: Region) => {
//     if ((selectingPickup || selectingDropoff) && isMapMoving) {
//       setIsMapMoving(false);
//       const center = {
//         latitude: region.latitude,
//         longitude: region.longitude,
//       };
//       const address = await fetchAddress(center.latitude, center.longitude);
      
//       if (selectingPickup) {
//         setPickupLocation(center);
//         setPickup(address);
//       } else if (selectingDropoff) {
//         setDropoffLocation(center);
//         setDropoff(address);
//       }
//     }
//   };

//   // Custom map style - clean and minimal
//   const customMapStyle = [
//     {
//       "elementType": "geometry",
//       "stylers": [{ "color": "#f5f5f5" }]
//     },
//     {
//       "elementType": "labels.icon",
//       "stylers": [{ "visibility": "off" }]
//     },
//     {
//       "elementType": "labels.text.fill",
//       "stylers": [{ "color": "#616161" }]
//     },
//     {
//       "elementType": "labels.text.stroke",
//       "stylers": [{ "color": "#f5f5f5" }]
//     },
//     {
//       "featureType": "administrative.land_parcel",
//       "stylers": [{ "visibility": "off" }]
//     },
//     {
//       "featureType": "administrative.neighborhood",
//       "stylers": [{ "visibility": "off" }]
//     },
//     {
//       "featureType": "poi",
//       "stylers": [{ "visibility": "off" }]
//     },
//     {
//       "featureType": "road",
//       "elementType": "geometry",
//       "stylers": [{ "color": "#ffffff" }]
//     },
//     {
//       "featureType": "road",
//       "elementType": "labels.icon",
//       "stylers": [{ "visibility": "off" }]
//     },
//     {
//       "featureType": "transit",
//       "stylers": [{ "visibility": "off" }]
//     },
//     {
//       "featureType": "water",
//       "elementType": "geometry",
//       "stylers": [{ "color": "#c9c9c9" }]
//     }
//   ];

//   // Render driver item
//   const renderDriverItem = (driver: Driver) => (
//     <TouchableOpacity
//       key={driver.id}
//       style={[
//         styles.driverItem,
//         selectedDriver?.id === driver.id && styles.selectedDriverItem
//       ]}
//       onPress={() => handleSelectDriver(driver)}
//     >
//       <View style={styles.driverInfo}>
//         <View style={styles.driverIcon}>
//           {driver.type === 'bike' && (
//             <FontAwesome name="motorcycle" size={20} color="#000000" />
//           )}
//           {driver.type === 'taxi' && (
//             <FontAwesome name="car" size={20} color="#000000" />
//           )}
//           {driver.type === 'port' && (
//             <MaterialIcons name="local-shipping" size={20} color="#000000" />
//           )}
//         </View>
//         <View style={styles.driverDetails}>
//           <Text style={styles.driverName}>{driver.name}</Text>
//           <Text style={styles.driverVehicle}>{driver.vehicleNumber}</Text>
//           <View style={styles.ratingContainer}>
//             <Ionicons name="star" size={12} color="#FFD700" />
//             <Text style={styles.ratingText}>{driver.rating.toFixed(1)}</Text>
//           </View>
//         </View>
//       </View>
//       <View style={styles.driverMeta}>
//         <Text style={styles.etaText}>{driver.eta} away</Text>
//         <Text style={styles.priceText}>₹{driver.price}</Text>
//         <Text style={styles.distanceText}>{driver.distance} km</Text>
//       </View>
//     </TouchableOpacity>
//   );

//   return (
//     <View style={styles.contentContainer}>
//       <View style={styles.mapContainer}>
//         {loadingLocation ? (
//           <Text style={styles.mapLoadingText}>Loading map...</Text>
//         ) : currentLocation ? (
//           <MapView
//             ref={mapRef}
//             style={styles.map}
//             initialRegion={{
//               latitude: currentLocation.latitude,
//               longitude: currentLocation.longitude,
//               latitudeDelta: 0.01,
//               longitudeDelta: 0.01,
//             }}
//             region={mapRegion || undefined}
//             onRegionChange={handleRegionChange}
//             onRegionChangeComplete={handleRegionChangeComplete}
//             customMapStyle={customMapStyle}
//             legalLabelInsets={{ bottom: -100, right: -100 }} // Hide Google logo
//           >
//             {/* Route polyline */}
//             {showRoute && routeCoords.length > 0 && (
//               <Polyline
//                 coordinates={routeCoords}
//                 strokeColor="#4CAF50"
//                 strokeWidth={4}
//                 lineDashPattern={[0]}
//               />
//             )}
            
//             {/* Current location marker */}
//             {!selectingPickup && !selectingDropoff && currentLocation && (
//               <Marker coordinate={currentLocation} title="My Current Location">
//                 <View style={styles.currentLocationMarker}>
//                   <MaterialIcons name="my-location" size={24} color="#4CAF50" />
//                 </View>
//               </Marker>
//             )}
            
//             {/* Pickup marker */}
//             {pickupLocation && !selectingPickup && (
//               <Marker coordinate={pickupLocation} title="Pickup Location">
//                 <View style={styles.pickupLocationMarker}>
//                   <MaterialIcons name="location-on" size={24} color="#4CAF50" />
//                 </View>
//               </Marker>
//             )}
            
//             {/* Dropoff marker */}
//             {dropoffLocation && !selectingDropoff && (
//               <Marker coordinate={dropoffLocation} title="Dropoff Location">
//                 <View style={styles.dropoffLocationMarker}>
//                   <MaterialIcons name="location-on" size={24} color="#F44336" />
//                 </View>
//               </Marker>
//             )}
            
//             {/* Driver markers */}
//             {showDrivers && drivers.map(driver => (
//               <Marker
//                 key={driver.id}
//                 coordinate={driver.location}
//                 title={driver.name}
//                 description={`${driver.distance}km away • ${driver.eta}`}
//               >
//                 <View style={styles.driverMarkerContainer}>
//                   {driver.type === 'bike' && (
//                     <FontAwesome name="motorcycle" size={24} color="#90EE90" />
//                   )}
//                   {driver.type === 'taxi' && (
//                     <FontAwesome name="car" size={24} color="#90EE90" />
//                   )}
//                   {driver.type === 'port' && (
//                     <MaterialIcons name="local-shipping" size={24} color="#90EE90" />
//                   )}
//                 </View>
//               </Marker>
//             ))}
//           </MapView>
//         ) : (
//           <Text style={styles.mapLoadingText}>Could not get location. Check permissions.</Text>
//         )}
        
//         {/* Center marker when selecting */}
//         {(selectingPickup || selectingDropoff) && mapCenter && (
//           <View style={styles.centerMarkerContainer}>
//             <MaterialIcons
//               name={selectingPickup ? "my-location" : "location-on"}
//               size={30}
//               color={selectingPickup ? "#4CAF50" : "#F44336"}
//             />
//           </View>
//         )}
//       </View>
      
//       <LocationInput
//         pickup={pickup}
//         dropoff={dropoff}
//         handlePickupChange={handlePickupChange}
//         handleDropoffChange={handleDropoffChange}
//         showDropoffSuggestions={showDropoffSuggestions}
//         setSelectingPickup={setSelectingPickup}
//         setSelectingDropoff={setSelectingDropoff}
//         onSelectPickupOnMap={handleSelectPickupOnMap}
//         onSelectDropoffOnMap={handleSelectDropoffOnMap}
//         selectingPickup={selectingPickup}
//         selectingDropoff={selectingDropoff}
//       />
      
//       {showDropoffSuggestions && suggestions.length > 0 && (
//         <View style={styles.suggestionsContainer}>
//           {suggestions.map((item) => (
//             <TouchableOpacity
//               key={item.id}
//               style={styles.suggestionItem}
//               onPress={() => selectSuggestion(item)}
//             >
//               <MaterialIcons name="location-on" size={20} color="#A9A9A9" style={styles.suggestionIcon} />
//               <Text style={styles.suggestionText}>{item.name}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       )}
      
//       {apiError && (
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>{apiError}</Text>
//         </View>
//       )}
      
//       <TouchableOpacity
//         style={[styles.seeRouteButton, (!pickupLocation || !dropoffLocation) && styles.disabledButton]}
//         onPress={handleSeeRoute}
//         disabled={!pickupLocation || !dropoffLocation || loadingRoute}
//       >
//         {loadingRoute ? (
//           <ActivityIndicator color="#FFFFFF" />
//         ) : (
//           <Text style={styles.seeRouteButtonText}>See My Route</Text>
//         )}
//       </TouchableOpacity>
      
//       <RideTypeSelector 
//         selectedRideType={selectedRideType} 
//         setSelectedRideType={handleRideTypeSelect} 
//       />
      
//       {/* Driver Selection Panel */}
//       {showDriverPanel && (
//         <Animated.View 
//           style={[
//             styles.driverPanel,
//             {
//               transform: [{
//                 translateY: panelAnimation.interpolate({
//                   inputRange: [0, 1],
//                   outputRange: [300, 0]
//                 })
//               }]
//             }
//           ]}
//         >
//           <View style={styles.panelHeader}>
//             <Text style={styles.panelTitle}>Available {selectedRideType === 'bike' ? 'Bikes' : selectedRideType === 'taxi' ? 'Taxis' : 'Port Vehicles'}</Text>
//             <TouchableOpacity onPress={() => setShowDriverPanel(false)}>
//               <MaterialIcons name="close" size={24} color="#666" />
//             </TouchableOpacity>
//           </View>
          
//           <ScrollView style={styles.driversList}>
//             {drivers.map(renderDriverItem)}
//           </ScrollView>
          
//           {selectedDriver && (
//             <View style={styles.selectedDriverContainer}>
//               <BookRideButton 
//                 onPress={handleBookRide}
//                 driver={selectedDriver}
//               />
//             </View>
//           )}
//         </Animated.View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   contentContainer: { 
//     flex: 1, 
//     padding: 20, 
//     alignItems: 'center',
//     backgroundColor: '#F5F5F5',
//   },
//   mapContainer: {
//     width: '100%',
//     height: Dimensions.get('window').height * 0.4,
//     borderRadius: 15,
//     overflow: 'hidden',
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   map: { ...StyleSheet.absoluteFillObject },
//   mapLoadingText: { 
//     color: '#757575', 
//     fontSize: 16,
//     textAlign: 'center',
//     padding: 20,
//   },
//   centerMarkerContainer: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     marginLeft: -15,
//     marginTop: -30,
//     zIndex: 10,
//     elevation: 5,
//   },
//   currentLocationMarker: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 20,
//     padding: 5,
//     borderWidth: 2,
//     borderColor: '#4CAF50',
//   },
//   pickupLocationMarker: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 20,
//     padding: 5,
//     borderWidth: 2,
//     borderColor: '#4CAF50',
//   },
//   dropoffLocationMarker: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 20,
//     padding: 5,
//     borderWidth: 2,
//     borderColor: '#F44336',
//   },
//   // Updated style for driver markers - removed background and border
//   driverMarkerContainer: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: 30, // Set width to 30
//     height: 30, // Set height to 30
//   },
//   suggestionsContainer: {
//     width: '100%',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 15,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   suggestionItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEEEEE',
//   },
//   suggestionIcon: { 
//     marginRight: 12,
//   },
//   suggestionText: { 
//     fontSize: 16, 
//     color: '#333333',
//     flex: 1,
//   },
//   seeRouteButton: {
//     backgroundColor: '#4CAF50',
//     paddingVertical: 15,
//     borderRadius: 12,
//     marginBottom: 15,
//     width: '100%',
//     alignItems: 'center',
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//   },
//   disabledButton: {
//     backgroundColor: '#BDBDBD',
//   },
//   seeRouteButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   errorContainer: {
//     width: '100%',
//     backgroundColor: '#FFEBEE',
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 15,
//     borderLeftWidth: 4,
//     borderLeftColor: '#F44336',
//   },
//   errorText: {
//     color: '#D32F2F',
//     fontSize: 14,
//     textAlign: 'center',
//   },
//   driverPanel: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: '#FFFFFF',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     padding: 20,
//     maxHeight: Dimensions.get('window').height * 0.5,
//     elevation: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -3 },
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//   },
//   panelHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 15,
//     paddingBottom: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEEEEE',
//   },
//   panelTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333333',
//   },
//   driversList: {
//     maxHeight: Dimensions.get('window').height * 0.3,
//   },
//   driverItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 15,
//     marginBottom: 10,
//     backgroundColor: '#FAFAFA',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#EEEEEE',
//   },
//   selectedDriverItem: {
//     backgroundColor: '#E8F5E9',
//     borderColor: '#4CAF50',
//     borderWidth: 2,
//   },
//   driverInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   driverIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#4CAF50', // Green background
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//     borderWidth: 2,
//     borderColor: '#000000', // Black border
//   },
//   driverDetails: {
//     flex: 1,
//   },
//   driverName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333333',
//     marginBottom: 2,
//   },
//   driverVehicle: {
//     fontSize: 12,
//     color: '#757575',
//     marginBottom: 4,
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   ratingText: {
//     fontSize: 12,
//     color: '#757575',
//     marginLeft: 4,
//   },
//   driverMeta: {
//     alignItems: 'flex-end',
//   },
//   etaText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#4CAF50',
//     marginBottom: 4,
//   },
//   priceText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333333',
//     marginBottom: 4,
//   },
//   distanceText: {
//     fontSize: 12,
//     color: '#757575',
//   },
//   selectedDriverContainer: {
//     marginTop: 15,
//     paddingTop: 15,
//     borderTopWidth: 1,
//     borderTopColor: '#EEEEEE',
//   },
// });

// export default TaxiContent;

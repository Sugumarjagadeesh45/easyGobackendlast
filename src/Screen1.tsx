import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth'; // Import Firebase auth

// Constants
const PRIMARY_GREEN = '#4caf50';
const LIGHT_GRAY = '#f5f5f5';
const WHITE = '#ffffff';
const DARK_GRAY = '#333';
const MEDIUM_GRAY = '#666';
const { width } = Dimensions.get('window');

// Auto-detect base URL for backend
const getBackendUrl = () => {
  const LOCAL_IP = '10.0.2.2'; // Android emulator
  const LOCAL_PORT = '5000';
  const LIVE_SERVER_URL = 'https://easygobackend.onrender.com';

  if (__DEV__) {
    return {
      register: `http://${LOCAL_IP}:${LOCAL_PORT}/api/auth/register`,
      profile: `http://${LOCAL_IP}:${LOCAL_PORT}/api/users/profile`,
      location: `http://${LOCAL_IP}:${LOCAL_PORT}/api/users/location`,
      me: `http://${LOCAL_IP}:${LOCAL_PORT}/api/users/me`,
      logout: `http://${LOCAL_IP}:${LOCAL_PORT}/api/auth/logout`, // Add logout endpoint
    };
  } else {
    return {
      register: `${LIVE_SERVER_URL}/api/auth/register`,
      profile: `${LIVE_SERVER_URL}/api/users/profile`,
      location: `${LIVE_SERVER_URL}/api/users/location`,
      me: `${LIVE_SERVER_URL}/api/users/me`,
      logout: `${LIVE_SERVER_URL}/api/auth/logout`, // Add logout endpoint
    };
  }
};

// Interfaces
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

interface Category {
  id: string;
  name: string;
}

interface Location {
  latitude: number;
  longitude: number;
}

// Mock Data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Smartphone',
    description: 'Latest model smartphone with great camera',
    price: 699.99,
    image: 'https://via.placeholder.com/150',
  },
  {
    id: '2',
    name: 'Headphones',
    description: 'Wireless noise-canceling headphones',
    price: 199.99,
    image: 'https://via.placeholder.com/150',
  },
];

const mockCategories: Category[] = [
  { id: '1', name: 'Electronics' },
  { id: '2', name: 'Clothing' },
  { id: '3', name: 'Home' },
  { id: '4', name: 'Books' },
];

const dropoffSuggestions = [
  { id: '1', name: 'Downtown Mall' },
  { id: '2', name: 'Central Railway Station' },
  { id: '3', name: 'City Park' },
  { id: '4', name: 'Main Hospital' },
];

export default function Screen1() {
  const navigation = useNavigation();
  const route = useRoute();
  const BACKEND_URLS = getBackendUrl();

  // State Management for UI
  const [activeTab, setActiveTab] = useState('taxi');
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedRideType, setSelectedRideType] = useState('taxi');
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);

  // State Management for Location
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [lastSavedLocation, setLastSavedLocation] = useState<Location | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  // State for Registration
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(route.params?.phone || '');
  const [showRegistrationModal, setShowRegistrationModal] = useState(route.params?.isNewUser || false);
  const [loadingRegistration, setLoadingRegistration] = useState(false);

  // Handlers for UI
  const handlePickupChange = (text: string) => {
    setPickup(text);
  };

  const handleDropoffChange = (text: string) => {
    setDropoff(text);
    if (text.length > 2) {
      const mockSuggestions = [
        { id: '1', name: `${text} Street` },
        { id: '2', name: `${text} Mall` },
        { id: '3', name: `${text} Center` },
      ];
      setSuggestions(mockSuggestions);
      setShowDropoffSuggestions(true);
    } else {
      setShowDropoffSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: { id: string; name: string }) => {
    setDropoff(suggestion.name);
    setShowDropoffSuggestions(false);
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
    setNotificationsVisible(false);
  };

  const toggleNotifications = () => {
    setNotificationsVisible(!notificationsVisible);
    setMenuVisible(false);
  };

  const handleLogout = async () => {
    try {
      setMenuVisible(false);
      // Sign out from Firebase
      await auth().signOut();
      // Clear all relevant AsyncStorage keys to reset login state
      await AsyncStorage.multiRemove(['authToken', 'isRegistered', 'name', 'address', 'phoneNumber']);
      // Navigate to WelcomeScreen3
      navigation.reset({
        index: 0,
        routes: [{ name: 'WelcomeScreen3' }],
      });
    } catch (err) {
      console.error('Logout error:', err);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'electronics':
        return 'devices';
      case 'clothing':
        return 'checkroom';
      case 'home':
        return 'home';
      case 'books':
        return 'menu-book';
      default:
        return 'shopping-cart';
    }
  };

  // Handler for Registration
  const handleSubmitRegistration = async () => {
    if (!name || !address || !phoneNumber) {
      Alert.alert('Error', 'Name, address, and phone number are required');
      return;
    }

    setLoadingRegistration(true);

    try {
      const userData = { name, address, phoneNumber };
      const response = await axios.post(BACKEND_URLS.register, userData);

      if (response.data.success && response.data.token) {
        await AsyncStorage.multiSet([
          ['authToken', response.data.token],
          ['isRegistered', 'true'],
          ['name', name],
          ['address', address],
          ['phoneNumber', phoneNumber],
        ]);
        setShowRegistrationModal(false);
        Alert.alert('Success', 'Registration completed successfully');
      } else {
        throw new Error(response.data.error || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Failed to register. Please try again.');
    } finally {
      setLoadingRegistration(false);
    }
  };

  // Handlers for Location & Backend
  const getCurrentLocation = async () => {
    Geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        console.log('📍 My current location:', coords);
        setCurrentLocation(coords);
        setPickup('My Current Location');

        try {
          const res = await axios.post(BACKEND_URLS.location, coords, {
            headers: { 'Content-Type': 'application/json' },
          });
          console.log('✅ Sent location to backend:', res.data);
        } catch (err: any) {
          console.log('❌ Error sending location:', err.message);
        }
      },
      (error) => {
        console.log('❌ Location Error:', error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const fetchLastLocation = async () => {
    try {
      const res = await axios.get(BACKEND_URLS.location + '/last');
      console.log('📂 Last saved location from backend:', res.data);
      setLastSavedLocation(res.data.location || res.data);
    } catch (err: any) {
      console.log('❌ Error fetching last location:', err.message);
    } finally {
      setLoadingLocation(false);
    }
  };

  // Effect to run on component mount
  useEffect(() => {
    getCurrentLocation();
    fetchLastLocation();
  }, []);

  // Render Functions
  const renderTaxiContent = () => {
    return (
      <View style={styles.contentContainer}>
        {/* Map View */}
        <View style={styles.mapContainer}>
          {loadingLocation ? (
            <Text style={styles.mapLoadingText}>Loading map...</Text>
          ) : currentLocation ? (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker coordinate={currentLocation} title="My Current Location" pinColor="blue" />
              {lastSavedLocation && (
                <Marker
                  coordinate={lastSavedLocation}
                  title="Last Saved Location"
                  pinColor={PRIMARY_GREEN}
                />
              )}
            </MapView>
          ) : (
            <Text style={styles.mapLoadingText}>Could not get location. Check permissions.</Text>
          )}
        </View>

        <View style={styles.locationInputContainer}>
          <View style={styles.locationInput}>
            <View style={styles.locationIcon}>
              <MaterialIcons name="my-location" size={20} color={PRIMARY_GREEN} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter Pickup Location"
              value={pickup}
              onChangeText={handlePickupChange}
              placeholderTextColor={MEDIUM_GRAY}
            />
          </View>
          <View style={styles.locationInput}>
            <View style={styles.locationIcon}>
              <MaterialIcons name="location-on" size={20} color="#f75555" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Where to?"
              value={dropoff}
              onChangeText={handleDropoffChange}
              onFocus={() => dropoff.length > 2 && setShowDropoffSuggestions(true)}
              placeholderTextColor={MEDIUM_GRAY}
            />
          </View>
        </View>

        {showDropoffSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((item: { id: string; name: string }) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionItem}
                onPress={() => selectSuggestion(item)}
              >
                <MaterialIcons name="location-on" size={20} color={MEDIUM_GRAY} style={styles.suggestionIcon} />
                <Text style={styles.suggestionText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!showDropoffSuggestions && dropoffSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Popular nearby locations</Text>
            {dropoffSuggestions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionItem}
                onPress={() => selectSuggestion(item)}
              >
                <MaterialIcons name="place" size={20} color={PRIMARY_GREEN} style={styles.suggestionIcon} />
                <Text style={styles.suggestionText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Ride type selector */}
        <View style={styles.rideTypeContainer}>
          <TouchableOpacity
            style={[styles.rideTypeButton, selectedRideType === 'taxi' && styles.selectedRideType]}
            onPress={() => setSelectedRideType('taxi')}
          >
            <FontAwesome name="taxi" size={24} color={selectedRideType === 'taxi' ? WHITE : PRIMARY_GREEN} />
            <Text style={[styles.rideTypeText, selectedRideType === 'taxi' && styles.selectedRideTypeText]}>Book Taxi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rideTypeButton, selectedRideType === 'evehicle' && styles.selectedRideType]}
            onPress={() => setSelectedRideType('evehicle')}
          >
            <MaterialIcons name="electric-car" size={24} color={selectedRideType === 'evehicle' ? WHITE : PRIMARY_GREEN} />
            <Text style={[styles.rideTypeText, selectedRideType === 'evehicle' && styles.selectedRideTypeText]}>E-Vehicle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rideTypeButton, selectedRideType === 'port' && styles.selectedRideType]}
            onPress={() => setSelectedRideType('port')}
          >
            <MaterialIcons name="local-shipping" size={24} color={selectedRideType === 'port' ? WHITE : PRIMARY_GREEN} />
            <Text style={[styles.rideTypeText, selectedRideType === 'port' && styles.selectedRideTypeText]}>Book Port</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.bookRideButton}>
          <Text style={styles.bookRideButtonText}>BOOK RIDE</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderShoppingContent = () => (
    <ScrollView style={styles.shoppingContainer}>
      <Text style={styles.sectionTitle}>Featured Products</Text>

      {mockProducts.map((product) => (
        <View key={product.id} style={styles.productCard}>
          <View style={styles.productImage}>
            <MaterialIcons name="image" size={80} color={MEDIUM_GRAY} />
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription}>{product.description}</Text>
            <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
        {mockCategories.map((category) => (
          <TouchableOpacity key={category.id} style={styles.categoryItem}>
            <View style={styles.categoryIcon}>
              <MaterialIcons name={getCategoryIcon(category.name)} size={24} color={PRIMARY_GREEN} />
            </View>
            <Text style={styles.categoryText}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScrollView>
  );

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <View style={styles.menuHeader}>
        <TouchableOpacity onPress={toggleMenu}>
          <Ionicons name="arrow-back" size={24} color={DARK_GRAY} />
        </TouchableOpacity>
        <Text style={styles.menuTitle}>Menu</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileIcon}>
          <FontAwesome name="user" size={24} color={PRIMARY_GREEN} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{name || 'John Doe'}</Text>
          <Text style={styles.profilePhone}>{phoneNumber || '+1 234 567 890'}</Text>
        </View>
        <Feather name="chevron-right" size={20} color={MEDIUM_GRAY} />
      </View>

      <View style={styles.walletSection}>
        <View style={styles.walletIcon}>
          <FontAwesome name="money" size={20} color={PRIMARY_GREEN} />
        </View>
        <View style={styles.walletInfo}>
          <Text style={styles.walletTitle}>Wallet</Text>
          <Text style={styles.walletBalance}>$50.00</Text>
        </View>
        <Feather name="chevron-right" size={20} color={MEDIUM_GRAY} />
      </View>

      <View style={styles.menuDivider} />

      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIcon}>
          <MaterialIcons name="payment" size={20} color={PRIMARY_GREEN} />
        </View>
        <Text style={styles.menuText}>Payment</Text>
        <Feather name="chevron-right" size={20} color={MEDIUM_GRAY} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIcon}>
          <MaterialIcons name="history" size={20} color={PRIMARY_GREEN} />
        </View>
        <Text style={styles.menuText}>My Travel History</Text>
        <Feather name="chevron-right" size={20} color={MEDIUM_GRAY} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIcon}>
          <MaterialIcons name="security" size={20} color={PRIMARY_GREEN} />
        </View>
        <Text style={styles.menuText}>Safety</Text>
        <Feather name="chevron-right" size={20} color={MEDIUM_GRAY} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
        <View style={styles.menuIcon}>
          <MaterialIcons name="logout" size={20} color={PRIMARY_GREEN} />
        </View>
        <Text style={styles.menuText}>Logout</Text>
        <Feather name="chevron-right" size={20} color={MEDIUM_GRAY} />
      </TouchableOpacity>

      <View style={styles.menuDivider} />

      <View style={styles.menuFooter}>
        <Text style={styles.footerText}>App Version 1.0.0</Text>
        <Text style={styles.footerText}>© 2023 TaxiApp Inc.</Text>
      </View>
    </View>
  );

  const renderNotifications = () => (
    <View style={styles.notificationsContainer}>
      <View style={styles.notificationsHeader}>
        <TouchableOpacity onPress={toggleNotifications}>
          <Ionicons name="arrow-back" size={24} color={DARK_GRAY} />
        </TouchableOpacity>
        <Text style={styles.notificationsTitle}>Notifications</Text>
      </View>

      <ScrollView>
        <View style={styles.notificationItem}>
          <View style={styles.notificationIcon}>
            <MaterialIcons name="local-offer" size={20} color={PRIMARY_GREEN} />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Special Offer</Text>
            <Text style={styles.notificationText}>Get 20% off on your next ride</Text>
            <Text style={styles.notificationTime}>2 hours ago</Text>
          </View>
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationIcon}>
            <MaterialIcons name="directions-car" size={20} color={PRIMARY_GREEN} />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Ride Completed</Text>
            <Text style={styles.notificationText}>Your ride to Downtown has been completed</Text>
            <Text style={styles.notificationTime}>Yesterday</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <LinearGradient
      colors={['#f0fff0', '#ccffcc']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu}>
          <MaterialIcons name="menu" size={24} color={DARK_GRAY} />
        </TouchableOpacity>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'taxi' && styles.activeTab]}
            onPress={() => setActiveTab('taxi')}
          >
            <FontAwesome name="taxi" size={20} color={activeTab === 'taxi' ? WHITE : PRIMARY_GREEN} />
            <Text style={[styles.tabText, activeTab === 'taxi' && styles.activeTabText]}>Taxi</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'shopping' && styles.activeTab]}
            onPress={() => setActiveTab('shopping')}
          >
            <MaterialIcons name="shopping-cart" size={20} color={activeTab === 'shopping' ? WHITE : PRIMARY_GREEN} />
            <Text style={[styles.tabText, activeTab === 'shopping' && styles.activeTabText]}>Shopping</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={toggleNotifications}>
          <MaterialIcons name="notifications" size={24} color={DARK_GRAY} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {activeTab === 'taxi' ? renderTaxiContent() : renderShoppingContent()}

      {/* Overlays */}
      {menuVisible && <View style={styles.overlay}>{renderMenu()}</View>}
      {notificationsVisible && <View style={styles.overlay}>{renderNotifications()}</View>}

      {/* Registration Modal */}
      <Modal visible={showRegistrationModal} transparent={true} animationType="fade">
        <View style={styles.registrationModal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Complete Your Registration</Text>
            <Text style={styles.modalText}>Please provide your details to continue.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={MEDIUM_GRAY}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Address"
              value={address}
              onChangeText={setAddress}
              placeholderTextColor={MEDIUM_GRAY}
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitRegistration} disabled={loadingRegistration}>
              {loadingRegistration ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: LIGHT_GRAY,
    borderRadius: 15,
    padding: 5,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: PRIMARY_GREEN,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_GREEN,
  },
  activeTabText: {
    color: WHITE,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  mapContainer: {
    width: '100%',
    height: Dimensions.get('window').height * 0.4,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLoadingText: {
    color: MEDIUM_GRAY,
    fontSize: 16,
  },
  locationInputContainer: {
    width: '100%',
    backgroundColor: WHITE,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_GRAY,
    borderRadius: 10,
    height: 50,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  locationIcon: {
    width: 30,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: DARK_GRAY,
  },
  suggestionsContainer: {
    width: '100%',
    backgroundColor: WHITE,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  suggestionsTitle: {
    fontSize: 16,
    color: MEDIUM_GRAY,
    marginBottom: 15,
    fontWeight: '600',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionText: {
    fontSize: 16,
    color: DARK_GRAY,
  },
  rideTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
    padding: 15,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 15,
  },
  rideTypeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 10,
  },
  selectedRideType: {
    backgroundColor: PRIMARY_GREEN,
  },
  rideTypeText: {
    marginTop: 5,
    fontSize: 14,
    color: PRIMARY_GREEN,
    fontWeight: '600',
  },
  selectedRideTypeText: {
    color: WHITE,
  },
  bookRideButton: {
    backgroundColor: PRIMARY_GREEN,
    width: '100%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookRideButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  shoppingContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: WHITE,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 20,
    color: DARK_GRAY,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  productImage: {
    width: 100,
    height: 100,
    backgroundColor: LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_GRAY,
  },
  productDescription: {
    fontSize: 14,
    color: MEDIUM_GRAY,
    marginTop: 5,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_GREEN,
    marginTop: 10,
  },
  categoriesScroll: {
    paddingVertical: 10,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryIcon: {
    backgroundColor: WHITE,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 14,
    color: MEDIUM_GRAY,
    fontWeight: '500',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  menuContainer: {
    width: '75%',
    height: '100%',
    backgroundColor: WHITE,
    padding: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK_GRAY,
    marginLeft: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileIcon: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_GRAY,
  },
  profilePhone: {
    fontSize: 14,
    color: MEDIUM_GRAY,
    lineHeight: 20,
  },
  walletSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 10,
    marginBottom: 20,
  },
  walletIcon: {
    marginRight: 15,
  },
  walletInfo: {
    flex: 1,
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_GRAY,
  },
  walletBalance: {
    fontSize: 14,
    color: PRIMARY_GREEN,
    lineHeight: 20,
  },
  menuDivider: {
    height: 1,
    backgroundColor: LIGHT_GRAY,
    marginVertical: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  menuIcon: {
    width: 30,
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: DARK_GRAY,
  },
  menuFooter: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: MEDIUM_GRAY,
    marginTop: 5,
  },
  notificationsContainer: {
    width: '75%',
    height: '100%',
    backgroundColor: WHITE,
    padding: 20,
    marginLeft: 'auto',
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  notificationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK_GRAY,
    marginLeft: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: LIGHT_GRAY,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  notificationIcon: {
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_GRAY,
  },
  notificationText: {
    fontSize: 14,
    color: MEDIUM_GRAY,
    marginTop: 5,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: MEDIUM_GRAY,
    marginTop: 5,
  },
  registrationModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: WHITE,
    borderRadius: 10,
    padding: 20,
    width: width * 0.8,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: DARK_GRAY,
  },
  modalText: {
    fontSize: 14,
    color: MEDIUM_GRAY,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    width: '100%',
    height: 40,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    color: DARK_GRAY,
  },
  submitButton: {
    backgroundColor: PRIMARY_GREEN,
    width: '100%',
    height: 40,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: WHITE,
    fontWeight: 'bold',
    fontSize: 16,
  },
});


// //gemini AI

// import React, { useState, useEffect } from 'react';

// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   TextInput,
//   Dimensions,
//   Platform,
//   Modal,
//   Alert,
//   ActivityIndicator,
// } from 'react-native';

// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import Feather from 'react-native-vector-icons/Feather';
// import MapView, { Marker } from 'react-native-maps';
// import Geolocation from '@react-native-community/geolocation';
// import axios from 'axios';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import LinearGradient from 'react-native-linear-gradient';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// // Constants
// const PRIMARY_GREEN = '#4caf50';
// const LIGHT_GRAY = '#f5f5f5';
// const WHITE = '#ffffff';
// const DARK_GRAY = '#333';
// const MEDIUM_GRAY = '#666';
// const { width } = Dimensions.get('window');

// // Auto-detect base URL for backend
// const getBackendUrl = () => {
//   const LOCAL_IP = '10.0.2.2'; // Android emulator
//   const LOCAL_PORT = '5000';
//   const LIVE_SERVER_URL = 'https://easygobackend.onrender.com';

//   if (__DEV__) {
//     // For local development
//     return {
//       register: `http://${LOCAL_IP}:${LOCAL_PORT}/api/auth/register`,
//       profile: `http://${LOCAL_IP}:${LOCAL_PORT}/api/users/profile`,
//       location: `http://${LOCAL_IP}:${LOCAL_PORT}/api/users/location`,
//       me: `http://${LOCAL_IP}:${LOCAL_PORT}/api/users/me`,
//     };
//   } else {
//     // For production
//     return {
//       register: `${LIVE_SERVER_URL}/api/auth/register`,
//       profile: `${LIVE_SERVER_URL}/api/users/profile`,
//       location: `${LIVE_SERVER_URL}/api/users/location`,
//       me: `${LIVE_SERVER_URL}/api/users/me`,
//     };
//   }
// };

// // Interfaces
// interface Product {
//   id: string;
//   name: string;
//   description: string;
//   price: number;
//   image: string;
// }

// interface Category {
//   id: string;
//   name: string;
// }

// interface Location {
//   latitude: number;
//   longitude: number;
// }

// // Mock Data
// const mockProducts: Product[] = [
//   {
//     id: '1',
//     name: 'Smartphone',
//     description: 'Latest model smartphone with great camera',
//     price: 699.99,
//     image: 'https://via.placeholder.com/150',
//   },
//   {
//     id: '2',
//     name: 'Headphones',
//     description: 'Wireless noise-canceling headphones',
//     price: 199.99,
//     image: 'https://via.placeholder.com/150',
//   },
// ];

// const mockCategories: Category[] = [
//   { id: '1', name: 'Electronics' },
//   { id: '2', name: 'Clothing' },
//   { id: '3', name: 'Home' },
//   { id: '4', name: 'Books' },
// ];

// const dropoffSuggestions = [
//   { id: '1', name: 'Downtown Mall' },
//   { id: '2', name: 'Central Railway Station' },
//   { id: '3', name: 'City Park' },
//   { id: '4', name: 'Main Hospital' },
// ];

// export default function Screen1() {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const BACKEND_URLS = getBackendUrl();

//   // State Management for UI
//   const [activeTab, setActiveTab] = useState('taxi');
//   const [menuVisible, setMenuVisible] = useState(false);
//   const [notificationsVisible, setNotificationsVisible] = useState(false);
//   const [pickup, setPickup] = useState('');
//   const [dropoff, setDropoff] = useState('');
//   const [suggestions, setSuggestions] = useState<any[]>([]);
//   const [selectedRideType, setSelectedRideType] = useState('taxi');
//   const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);

//   // State Management for Location
//   const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
//   const [lastSavedLocation, setLastSavedLocation] = useState<Location | null>(null);
//   const [loadingLocation, setLoadingLocation] = useState(true);

//   // State for Registration
//   const [name, setName] = useState('');
//   const [address, setAddress] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState(route.params?.phone || '');
//   const [showRegistrationModal, setShowRegistrationModal] = useState(route.params?.isNewUser || false);
//   const [loadingRegistration, setLoadingRegistration] = useState(false);

//   // Handlers for UI
//   const handlePickupChange = (text: string) => {
//     setPickup(text);
//   };

//   const handleDropoffChange = (text: string) => {
//     setDropoff(text);
//     if (text.length > 2) {
//       const mockSuggestions = [
//         { id: '1', name: `${text} Street` },
//         { id: '2', name: `${text} Mall` },
//         { id: '3', name: `${text} Center` },
//       ];
//       setSuggestions(mockSuggestions);
//       setShowDropoffSuggestions(true);
//     } else {
//       setShowDropoffSuggestions(false);
//     }
//   };

//   const selectSuggestion = (suggestion: { id: string; name: string }) => {
//     setDropoff(suggestion.name);
//     setShowDropoffSuggestions(false);
//   };

//   const toggleMenu = () => {
//     setMenuVisible(!menuVisible);
//     setNotificationsVisible(false);
//   };

//   const toggleNotifications = () => {
//     setNotificationsVisible(!notificationsVisible);
//     setMenuVisible(false);
//   };

//   const handleLogout = () => {
//     setMenuVisible(false);
//     AsyncStorage.multiRemove(['authToken', 'registered', 'name', 'address', 'phoneNumber'])
//       .then(() => navigation.navigate('WelcomeScreen3'))
//       .catch(err => console.error('Logout error:', err));
//   };

//   const getCategoryIcon = (categoryName: string) => {
//     switch (categoryName.toLowerCase()) {
//       case 'electronics':
//         return 'devices';
//       case 'clothing':
//         return 'checkroom';
//       case 'home':
//         return 'home';
//       case 'books':
//         return 'menu-book';
//       default:
//         return 'shopping-cart';
//     }
//   };

//   // Handler for Registration
//   const handleSubmitRegistration = async () => {
//     if (!name || !address || !phoneNumber) {
//       Alert.alert('Error', 'Name, address, and phone number are required');
//       return;
//     }

//     setLoadingRegistration(true);

//     try {
//       const userData = { name, address, phoneNumber };
//       const response = await axios.post(BACKEND_URLS.register, userData);

//       if (response.data.success && response.data.token) {
//         await AsyncStorage.multiSet([
//           ['authToken', response.data.token],
//           ['registered', 'true'],
//           ['name', name],
//           ['address', address],
//           ['phoneNumber', phoneNumber],
//         ]);
//         setShowRegistrationModal(false);
//         Alert.alert('Success', 'Registration completed successfully');
//       } else {
//         throw new Error(response.data.error || 'Registration failed');
//       }
//     } catch (error: any) {
//       console.error('Registration error:', error.response?.data || error.message);
//       Alert.alert('Error', error.response?.data?.error || 'Failed to register. Please try again.');
//     } finally {
//       setLoadingRegistration(false);
//     }
//   };

//   // Handlers for Location & Backend
//   const getCurrentLocation = async () => {
//     Geolocation.getCurrentPosition(
//       async (position) => {
//         const coords = {
//           latitude: position.coords.latitude,
//           longitude: position.coords.longitude,
//         };
//         console.log('📍 My current location:', coords);
//         setCurrentLocation(coords);
//         setPickup('My Current Location');

//         try {
//           const res = await axios.post(BACKEND_URLS.location, coords, {
//             headers: { 'Content-Type': 'application/json' },
//           });
//           console.log('✅ Sent location to backend:', res.data);
//         } catch (err: any) {
//           console.log('❌ Error sending location:', err.message);
//         }
//       },
//       (error) => {
//         console.log('❌ Location Error:', error.message);
//       },
//       { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
//     );
//   };

//   const fetchLastLocation = async () => {
//     try {
//       const res = await axios.get(BACKEND_URLS.location + '/last');
//       console.log('📂 Last saved location from backend:', res.data);
//       setLastSavedLocation(res.data.location || res.data);
//     } catch (err: any) {
//       console.log('❌ Error fetching last location:', err.message);
//     } finally {
//       setLoadingLocation(false);
//     }
//   };

//   // Effect to run on component mount
//   useEffect(() => {
//     getCurrentLocation();
//     fetchLastLocation();
//   }, []);

//   // Render Functions
//   const renderTaxiContent = () => {
//     return (
//       <View style={styles.contentContainer}>
//         {/* Map View */}
//         <View style={styles.mapContainer}>
//           {loadingLocation ? (
//             <Text style={styles.mapLoadingText}>Loading map...</Text>
//           ) : currentLocation ? (
//             <MapView
//               style={styles.map}
//               initialRegion={{
//                 latitude: currentLocation.latitude,
//                 longitude: currentLocation.longitude,
//                 latitudeDelta: 0.01,
//                 longitudeDelta: 0.01,
//               }}
//             >
//               <Marker
//                 coordinate={currentLocation}
//                 title="My Current Location"
//                 pinColor="blue"
//               />
//               {lastSavedLocation && (
//                 <Marker
//                   coordinate={lastSavedLocation}
//                   title="Last Saved Location"
//                   pinColor={PRIMARY_GREEN}
//                 />
//               )}
//             </MapView>
//           ) : (
//             <Text style={styles.mapLoadingText}>Could not get location. Check permissions.</Text>
//           )}
//         </View>

//         <View style={styles.locationInputContainer}>
//           <View style={styles.locationInput}>
//             <View style={styles.locationIcon}>
//               <MaterialIcons name="my-location" size={20} color={PRIMARY_GREEN} />
//             </View>
//             <TextInput
//               style={styles.input}
//               placeholder="Enter Pickup Location"
//               value={pickup}
//               onChangeText={handlePickupChange}
//               placeholderTextColor={MEDIUM_GRAY}
//             />
//           </View>
//           <View style={styles.locationInput}>
//             <View style={styles.locationIcon}>
//               <MaterialIcons name="location-on" size={20} color="#f75555" />
//             </View>
//             <TextInput
//               style={styles.input}
//               placeholder="Where to?"
//               value={dropoff}
//               onChangeText={handleDropoffChange}
//               onFocus={() => dropoff.length > 2 && setShowDropoffSuggestions(true)}
//               placeholderTextColor={MEDIUM_GRAY}
//             />
//           </View>
//         </View>

//         {showDropoffSuggestions && suggestions.length > 0 && (
//           <View style={styles.suggestionsContainer}>
//             {suggestions.map((item: { id: string; name: string }) => (
//               <TouchableOpacity
//                 key={item.id}
//                 style={styles.suggestionItem}
//                 onPress={() => selectSuggestion(item)}
//               >
//                 <MaterialIcons name="location-on" size={20} color={MEDIUM_GRAY} style={styles.suggestionIcon} />
//                 <Text style={styles.suggestionText}>{item.name}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         )}

//         {!showDropoffSuggestions && dropoffSuggestions.length > 0 && (
//           <View style={styles.suggestionsContainer}>
//             <Text style={styles.suggestionsTitle}>Popular nearby locations</Text>
//             {dropoffSuggestions.map((item) => (
//               <TouchableOpacity
//                 key={item.id}
//                 style={styles.suggestionItem}
//                 onPress={() => selectSuggestion(item)}
//               >
//                 <MaterialIcons name="place" size={20} color={PRIMARY_GREEN} style={styles.suggestionIcon} />
//                 <Text style={styles.suggestionText}>{item.name}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         )}

//         {/* Ride type selector */}
//         <View style={styles.rideTypeContainer}>
//           <TouchableOpacity
//             style={[styles.rideTypeButton, selectedRideType === 'taxi' && styles.selectedRideType]}
//             onPress={() => setSelectedRideType('taxi')}
//           >
//             <FontAwesome name="taxi" size={24} color={selectedRideType === 'taxi' ? WHITE : PRIMARY_GREEN} />
//             <Text style={[styles.rideTypeText, selectedRideType === 'taxi' && styles.selectedRideTypeText]}>Book Taxi</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.rideTypeButton, selectedRideType === 'evehicle' && styles.selectedRideType]}
//             onPress={() => setSelectedRideType('evehicle')}
//           >
//             <MaterialIcons name="electric-car" size={24} color={selectedRideType === 'evehicle' ? WHITE : PRIMARY_GREEN} />
//             <Text style={[styles.rideTypeText, selectedRideType === 'evehicle' && styles.selectedRideTypeText]}>E-Vehicle</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.rideTypeButton, selectedRideType === 'port' && styles.selectedRideType]}
//             onPress={() => setSelectedRideType('port')}
//           >
//             <MaterialIcons name="local-shipping" size={24} color={selectedRideType === 'port' ? WHITE : PRIMARY_GREEN} />
//             <Text style={[styles.rideTypeText, selectedRideType === 'port' && styles.selectedRideTypeText]}>Book Port</Text>
//           </TouchableOpacity>
//         </View>

//         <TouchableOpacity style={styles.bookRideButton}>
//           <Text style={styles.bookRideButtonText}>BOOK RIDE</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   };

//   const renderShoppingContent = () => (
//     <ScrollView style={styles.shoppingContainer}>
//       <Text style={styles.sectionTitle}>Featured Products</Text>

//       {mockProducts.map((product) => (
//         <View key={product.id} style={styles.productCard}>
//           <View style={styles.productImage}>
//             <MaterialIcons name="image" size={80} color={MEDIUM_GRAY} />
//           </View>
//           <View style={styles.productInfo}>
//             <Text style={styles.productName}>{product.name}</Text>
//             <Text style={styles.productDescription}>{product.description}</Text>
//             <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
//           </View>
//         </View>
//       ))}

//       <Text style={styles.sectionTitle}>Categories</Text>
//       <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
//         {mockCategories.map((category) => (
//           <TouchableOpacity
//             key={category.id}
//             style={styles.categoryItem}
//           >
//             <View style={styles.categoryIcon}>
//               <MaterialIcons name={getCategoryIcon(category.name)} size={24} color={PRIMARY_GREEN} />
//             </View>
//             <Text style={styles.categoryText}>{category.name}</Text>
//           </TouchableOpacity>
//         ))}
//       </ScrollView>
//     </ScrollView>
//   );

//   const renderMenu = () => (
//     <View style={styles.menuContainer}>
//       <View style={styles.menuHeader}>
//         <TouchableOpacity onPress={toggleMenu}>
//           <Ionicons name="arrow-back" size={24} color={DARK_GRAY} />
//         </TouchableOpacity>
//         <Text style={styles.menuTitle}>Menu</Text>
//       </View>

//       <View style={styles.profileSection}>
//         <View style={styles.profileIcon}>
//           <FontAwesome name="user" size={24} color={PRIMARY_GREEN} />
//         </View>
//         <View style={styles.profileInfo}>
//           <Text style={styles.profileName}>{name || 'John Doe'}</Text>
//           <Text style={styles.profilePhone}>{phoneNumber || '+1 234 567 890'}</Text>
//         </View>
//         <Feather name="chevron-right" size={20} color={MEDIUM_GRAY} />
//       </View>

//       <View style={styles.walletSection}>
//         <View style={styles.walletIcon}>
//           <FontAwesome name="money" size={20} color={PRIMARY_GREEN} />
//         </View>
//         <View style={styles.walletInfo}>
//           <Text style={styles.walletTitle}>Wallet</Text>
//           <Text style={styles.walletBalance}>$50.00</Text>
//         </View>
//         <Feather name="chevron-right" size={20} color={MEDIUM_GRAY} />
//       </View>

//       <View style={styles.menuDivider} />

//       <TouchableOpacity style={styles.menuItem}>
//         <View style={styles.menuIcon}>
//           <MaterialIcons name="payment" size={20} color={PRIMARY_GREEN} />
//         </View>
//         <Text style={styles.menuText}>Payment</Text>
//         <Feather name="chevron-right" size={20} color={MEDIUM_GRAY} />
//       </TouchableOpacity>

//       <TouchableOpacity style={styles.menuItem}>
//         <View style={styles.menuIcon}>
//           <MaterialIcons name="history" size={20} color={PRIMARY_GREEN} />
//         </View>
//         <Text style={styles.menuText}>My Travel History</Text>
//         <Feather name="chevron-right" size={20} color={MEDIUM_GRAY} />
//       </TouchableOpacity>

//       <TouchableOpacity style={styles.menuItem}>
//         <View style={styles.menuIcon}>
//           <MaterialIcons name="security" size={20} color={PRIMARY_GREEN} />
//         </View>
//         <Text style={styles.menuText}>Safety</Text>
//         <Feather name="chevron-right" size={20} color={MEDIUM_GRAY} />
//       </TouchableOpacity>

//       <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
//         <View style={styles.menuIcon}>
//           <MaterialIcons name="logout" size={20} color={PRIMARY_GREEN} />
//         </View>
//         <Text style={styles.menuText}>Logout</Text>
//         <Feather name="chevron-right" size={20} color={MEDIUM_GRAY} />
//       </TouchableOpacity>

//       <View style={styles.menuDivider} />

//       <View style={styles.menuFooter}>
//         <Text style={styles.footerText}>App Version 1.0.0</Text>
//         <Text style={styles.footerText}>© 2023 TaxiApp Inc.</Text>
//       </View>
//     </View>
//   );

//   const renderNotifications = () => (
//     <View style={styles.notificationsContainer}>
//       <View style={styles.notificationsHeader}>
//         <TouchableOpacity onPress={toggleNotifications}>
//           <Ionicons name="arrow-back" size={24} color={DARK_GRAY} />
//         </TouchableOpacity>
//         <Text style={styles.notificationsTitle}>Notifications</Text>
//       </View>

//       <ScrollView>
//         <View style={styles.notificationItem}>
//           <View style={styles.notificationIcon}>
//             <MaterialIcons name="local-offer" size={20} color={PRIMARY_GREEN} />
//           </View>
//           <View style={styles.notificationContent}>
//             <Text style={styles.notificationTitle}>Special Offer</Text>
//             <Text style={styles.notificationText}>Get 20% off on your next ride</Text>
//             <Text style={styles.notificationTime}>2 hours ago</Text>
//           </View>
//         </View>

//         <View style={styles.notificationItem}>
//           <View style={styles.notificationIcon}>
//             <MaterialIcons name="directions-car" size={20} color={PRIMARY_GREEN} />
//           </View>
//           <View style={styles.notificationContent}>
//             <Text style={styles.notificationTitle}>Ride Completed</Text>
//             <Text style={styles.notificationText}>Your ride to Downtown has been completed</Text>
//             <Text style={styles.notificationTime}>Yesterday</Text>
//           </View>
//         </View>
//       </ScrollView>
//     </View>
//   );

//   return (
//     <LinearGradient
//       colors={['#f0fff0', '#ccffcc']}
//       style={styles.container}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//     >
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={toggleMenu}>
//           <MaterialIcons name="menu" size={24} color={DARK_GRAY} />
//         </TouchableOpacity>
//         <View style={styles.tabContainer}>
//           <TouchableOpacity
//             style={[styles.tabButton, activeTab === 'taxi' && styles.activeTab]}
//             onPress={() => setActiveTab('taxi')}
//           >
//             <FontAwesome name="taxi" size={20} color={activeTab === 'taxi' ? WHITE : PRIMARY_GREEN} />
//             <Text style={[styles.tabText, activeTab === 'taxi' && styles.activeTabText]}>Taxi</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[styles.tabButton, activeTab === 'shopping' && styles.activeTab]}
//             onPress={() => setActiveTab('shopping')}
//           >
//             <MaterialIcons name="shopping-cart" size={20} color={activeTab === 'shopping' ? WHITE : PRIMARY_GREEN} />
//             <Text style={[styles.tabText, activeTab === 'shopping' && styles.activeTabText]}>Shopping</Text>
//           </TouchableOpacity>
//         </View>
//         <TouchableOpacity onPress={toggleNotifications}>
//           <MaterialIcons name="notifications" size={24} color={DARK_GRAY} />
//         </TouchableOpacity>
//       </View>

//       {/* Main Content */}
//       {activeTab === 'taxi' ? renderTaxiContent() : renderShoppingContent()}

//       {/* Overlays */}
//       {menuVisible && <View style={styles.overlay}>{renderMenu()}</View>}
//       {notificationsVisible && <View style={styles.overlay}>{renderNotifications()}</View>}

//       {/* Registration Modal */}
//       <Modal
//         visible={showRegistrationModal}
//         transparent={true}
//         animationType="fade"
//       >
//         <View style={styles.registrationModal}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Complete Your Registration</Text>
//             <Text style={styles.modalText}>Please provide your details to continue.</Text>
//             <TextInput
//               style={styles.modalInput}
//               placeholder="Name"
//               value={name}
//               onChangeText={setName}
//               placeholderTextColor={MEDIUM_GRAY}
//             />
//             <TextInput
//               style={styles.modalInput}
//               placeholder="Address"
//               value={address}
//               onChangeText={setAddress}
//               placeholderTextColor={MEDIUM_GRAY}
//             />
//             <TouchableOpacity style={styles.submitButton} onPress={handleSubmitRegistration} disabled={loadingRegistration}>
//               {loadingRegistration ? (
//                 <ActivityIndicator color={WHITE} />
//               ) : (
//                 <Text style={styles.submitButtonText}>Submit</Text>
//               )}
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </LinearGradient>
//   );
// }

// // StyleSheet
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: 20,
//     paddingTop: Platform.OS === 'android' ? 40 : 20,
//     backgroundColor: WHITE,
//     borderBottomWidth: 1,
//     borderBottomColor: LIGHT_GRAY,
//   },
//   tabContainer: {
//     flexDirection: 'row',
//     backgroundColor: LIGHT_GRAY,
//     borderRadius: 15,
//     padding: 5,
//   },
//   tabButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//     borderRadius: 10,
//   },
//   activeTab: {
//     backgroundColor: PRIMARY_GREEN,
//   },
//   tabText: {
//     marginLeft: 8,
//     fontSize: 16,
//     fontWeight: '600',
//     color: PRIMARY_GREEN,
//   },
//   activeTabText: {
//     color: WHITE,
//   },
//   contentContainer: {
//     flex: 1,
//     padding: 20,
//     alignItems: 'center',
//   },
//   mapContainer: {
//     width: '100%',
//     height: Dimensions.get('window').height * 0.4,
//     borderRadius: 15,
//     overflow: 'hidden',
//     marginBottom: 20,
//     borderWidth: 1,
//     borderColor: LIGHT_GRAY,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   map: {
//     ...StyleSheet.absoluteFillObject,
//   },
//   mapLoadingText: {
//     color: MEDIUM_GRAY,
//     fontSize: 16,
//   },
//   locationInputContainer: {
//     width: '100%',
//     backgroundColor: WHITE,
//     borderRadius: 15,
//     padding: 15,
//     marginBottom: 20,
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//   },
//   locationInput: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: LIGHT_GRAY,
//     borderRadius: 10,
//     height: 50,
//     marginBottom: 15,
//     paddingHorizontal: 15,
//   },
//   locationIcon: {
//     width: 30,
//     alignItems: 'center',
//   },
//   input: {
//     flex: 1,
//     height: 50,
//     fontSize: 16,
//     color: DARK_GRAY,
//   },
//   suggestionsContainer: {
//     width: '100%',
//     backgroundColor: WHITE,
//     borderRadius: 15,
//     padding: 15,
//     marginBottom: 20,
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//   },
//   suggestionsTitle: {
//     fontSize: 16,
//     color: MEDIUM_GRAY,
//     marginBottom: 15,
//     fontWeight: '600',
//   },
//   suggestionItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: LIGHT_GRAY,
//   },
//   suggestionIcon: {
//     marginRight: 10,
//   },
//   suggestionText: {
//     fontSize: 16,
//     color: DARK_GRAY,
//   },
//   rideTypeContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     width: '100%',
//     marginBottom: 20,
//     padding: 15,
//     backgroundColor: LIGHT_GRAY,
//     borderRadius: 15,
//   },
//   rideTypeButton: {
//     flex: 1,
//     alignItems: 'center',
//     paddingVertical: 10,
//     marginHorizontal: 5,
//     borderRadius: 10,
//   },
//   selectedRideType: {
//     backgroundColor: PRIMARY_GREEN,
//   },
//   rideTypeText: {
//     marginTop: 5,
//     fontSize: 14,
//     color: PRIMARY_GREEN,
//     fontWeight: '600',
//   },
//   selectedRideTypeText: {
//     color: WHITE,
//   },
//   bookRideButton: {
//     backgroundColor: PRIMARY_GREEN,
//     width: '100%',
//     height: 50,
//     borderRadius: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   bookRideButtonText: {
//     color: WHITE,
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   shoppingContainer: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: WHITE,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     marginVertical: 20,
//     color: DARK_GRAY,
//   },
//   productCard: {
//     flexDirection: 'row',
//     backgroundColor: WHITE,
//     borderRadius: 15,
//     padding: 15,
//     marginBottom: 20,
//     alignItems: 'center',
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//   },
//   productImage: {
//     width: 100,
//     height: 100,
//     backgroundColor: LIGHT_GRAY,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 10,
//     marginRight: 15,
//   },
//   productInfo: {
//     flex: 1,
//   },
//   productName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: DARK_GRAY,
//   },
//   productDescription: {
//     fontSize: 14,
//     color: MEDIUM_GRAY,
//     marginTop: 5,
//     lineHeight: 20,
//   },
//   productPrice: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: PRIMARY_GREEN,
//     marginTop: 10,
//   },
//   categoriesScroll: {
//     paddingVertical: 10,
//   },
//   categoryItem: {
//     alignItems: 'center',
//     marginRight: 20,
//   },
//   categoryIcon: {
//     backgroundColor: WHITE,
//     borderRadius: 30,
//     width: 60,
//     height: 60,
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     marginBottom: 5,
//   },
//   categoryText: {
//     fontSize: 14,
//     color: MEDIUM_GRAY,
//     fontWeight: '500',
//   },
//   overlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center',
//     alignItems: 'flex-start',
//     zIndex: 10,
//   },
//   menuContainer: {
//     width: '75%',
//     height: '100%',
//     backgroundColor: WHITE,
//     padding: 20,
//   },
//   menuHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//     paddingTop: Platform.OS === 'android' ? 20 : 0,
//   },
//   menuTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: DARK_GRAY,
//     marginLeft: 20,
//   },
//   profileSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   profileIcon: {
//     backgroundColor: LIGHT_GRAY,
//     borderRadius: 25,
//     width: 50,
//     height: 50,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 15,
//   },
//   profileInfo: {
//     flex: 1,
//   },
//   profileName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: DARK_GRAY,
//   },
//   profilePhone: {
//     fontSize: 14,
//     color: MEDIUM_GRAY,
//     lineHeight: 20,
//   },
//   walletSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 15,
//     backgroundColor: LIGHT_GRAY,
//     borderRadius: 10,
//     marginBottom: 20,
//   },
//   walletIcon: {
//     marginRight: 15,
//   },
//   walletInfo: {
//     flex: 1,
//   },
//   walletTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: DARK_GRAY,
//   },
//   walletBalance: {
//     fontSize: 14,
//     color: PRIMARY_GREEN,
//     lineHeight: 20,
//   },
//   menuDivider: {
//     height: 1,
//     backgroundColor: LIGHT_GRAY,
//     marginVertical: 15,
//   },
//   menuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 15,
//   },
//   menuIcon: {
//     width: 30,
//     alignItems: 'center',
//     marginRight: 15,
//   },
//   menuText: {
//     flex: 1,
//     fontSize: 16,
//     fontWeight: '500',
//     color: DARK_GRAY,
//   },
//   menuFooter: {
//     marginTop: 'auto',
//     alignItems: 'center',
//   },
//   footerText: {
//     fontSize: 12,
//     color: MEDIUM_GRAY,
//     marginTop: 5,
//   },
//   notificationsContainer: {
//     width: '75%',
//     height: '100%',
//     backgroundColor: WHITE,
//     padding: 20,
//     marginLeft: 'auto',
//   },
//   notificationsHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//     paddingTop: Platform.OS === 'android' ? 20 : 0,
//   },
//   notificationsTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: DARK_GRAY,
//     marginLeft: 20,
//   },
//   notificationItem: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     backgroundColor: LIGHT_GRAY,
//     borderRadius: 10,
//     padding: 15,
//     marginBottom: 15,
//   },
//   notificationIcon: {
//     marginRight: 15,
//   },
//   notificationContent: {
//     flex: 1,
//   },
//   notificationTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: DARK_GRAY,
//   },
//   notificationText: {
//     fontSize: 14,
//     color: MEDIUM_GRAY,
//     marginTop: 5,
//     lineHeight: 20,
//   },
//   notificationTime: {
//     fontSize: 12,
//     color: MEDIUM_GRAY,
//     marginTop: 5,
//   },
//   registrationModal: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   modalContent: {
//     backgroundColor: WHITE,
//     borderRadius: 10,
//     padding: 20,
//     width: width * 0.8,
//     alignItems: 'center',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//     color: DARK_GRAY,
//   },
//   modalText: {
//     fontSize: 14,
//     color: MEDIUM_GRAY,
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   modalInput: {
//     width: '100%',
//     height: 40,
//     backgroundColor: LIGHT_GRAY,
//     borderRadius: 5,
//     paddingHorizontal: 10,
//     marginBottom: 15,
//     color: DARK_GRAY,
//   },
//   submitButton: {
//     backgroundColor: PRIMARY_GREEN,
//     width: '100%',
//     height: 40,
//     borderRadius: 5,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   submitButtonText: {
//     color: WHITE,
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
// });

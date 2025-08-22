import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import Menu from './Screen1/Menuicon/Menu';
import TaxiContent from './Screen1/Taxibooking/TaxiContent';
import ShoppingContent from './Screen1/Shopping/ShoppingContent';
import Notifications from './Screen1/Bellicon/Notifications';

// Screen width
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
      logout: `http://${LOCAL_IP}:${LOCAL_PORT}/api/auth/logout`,
    };
  } else {
    return {
      register: `${LIVE_SERVER_URL}/api/auth/register`,
      profile: `${LIVE_SERVER_URL}/api/users/profile`,
      location: `${LIVE_SERVER_URL}/api/users/location`,
      me: `${LIVE_SERVER_URL}/api/users/me`,
      logout: `${LIVE_SERVER_URL}/api/auth/logout`,
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

const mockProducts: Product[] = [
  { id: '1', name: 'Smartphone', description: 'Latest model smartphone with great camera', price: 699.99, image: 'https://via.placeholder.com/150' },
  { id: '2', name: 'Headphones', description: 'Wireless noise-canceling headphones', price: 199.99, image: 'https://via.placeholder.com/150' },
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
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const BACKEND_URLS = getBackendUrl();

  // State Management
  const [activeTab, setActiveTab] = useState<'taxi' | 'shopping'>('taxi');
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [selectedRideType, setSelectedRideType] = useState<string>('taxi');
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [lastSavedLocation, setLastSavedLocation] = useState<Location | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(route.params?.phone || '');
  const [showRegistrationModal, setShowRegistrationModal] = useState(route.params?.isNewUser || false);
  const [loadingRegistration, setLoadingRegistration] = useState(false);
  const [selectingPickup, setSelectingPickup] = useState(false);
  const [selectingDropoff, setSelectingDropoff] = useState(false);

  // Handlers
  const handlePickupChange = (text: string) => {
    setPickup(text);
    setSelectingPickup(false);
  };

  const handleDropoffChange = (text: string) => {
    setDropoff(text);
    setSelectingDropoff(false);
    if (text.length > 2) {
      setSuggestions([
        { id: '1', name: `${text} Street` },
        { id: '2', name: `${text} Mall` },
        { id: '3', name: `${text} Center` },
      ]);
      setShowDropoffSuggestions(true);
    } else {
      setShowDropoffSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: { id: string; name: string }) => {
    setDropoff(suggestion.name);
    setShowDropoffSuggestions(false);
    setSelectingDropoff(false);
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
      await auth().signOut();
      await AsyncStorage.multiRemove(['authToken', 'isRegistered', 'name', 'address', 'phoneNumber']);
      navigation.reset({
        index: 0,
        routes: [{ name: 'WelcomeScreen3' as never }],
      });
    } catch (err) {
      console.error('Logout error:', err);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'electronics': return 'devices';
      case 'clothing': return 'checkroom';
      case 'home': return 'home';
      case 'books': return 'menu-book';
      default: return 'shopping-cart';
    }
  };

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

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      async (position) => {
        const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setCurrentLocation(coords);
        setPickup('My Current Location');

        try {
          await axios.post(BACKEND_URLS.location, coords, { headers: { 'Content-Type': 'application/json' } });
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
      setLastSavedLocation(res.data.location || res.data);
    } catch (err: any) {
      console.log('❌ Error fetching last location:', err.message);
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
    fetchLastLocation();
  }, []);

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
          <MaterialIcons name="menu" size={24} color="#333333" />
        </TouchableOpacity>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'taxi' && styles.activeTab]}
            onPress={() => setActiveTab('taxi')}
          >
            <FontAwesome name="taxi" size={20} color={activeTab === 'taxi' ? '#ffffff' : '#4caf50'} />
            <Text style={[styles.tabText, activeTab === 'taxi' && styles.activeTabText]}>Taxi</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'shopping' && styles.activeTab]}
            onPress={() => setActiveTab('shopping')}
          >
            <MaterialIcons name="shopping-cart" size={20} color={activeTab === 'shopping' ? '#ffffff' : '#4caf50'} />
            <Text style={[styles.tabText, activeTab === 'shopping' && styles.activeTabText]}>Shopping</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={toggleNotifications}>
          <MaterialIcons name="notifications" size={24} color="#333333" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'taxi' ? (
        <TaxiContent
          loadingLocation={loadingLocation}
          currentLocation={currentLocation}
          lastSavedLocation={lastSavedLocation}
          pickup={pickup}
          dropoff={dropoff}
          suggestions={suggestions}
          showDropoffSuggestions={showDropoffSuggestions}
          handlePickupChange={handlePickupChange}
          handleDropoffChange={handleDropoffChange}
          selectSuggestion={selectSuggestion}
          selectingPickup={selectingPickup}
          setSelectingPickup={setSelectingPickup}
          selectingDropoff={selectingDropoff}
          setSelectingDropoff={setSelectingDropoff}
          setPickup={setPickup}
          setDropoff={setDropoff}
        />
      ) : (
        <ShoppingContent
          mockProducts={mockProducts}
          mockCategories={mockCategories}
          getCategoryIcon={getCategoryIcon}
        />
      )}

      {/* Overlay */}
      {menuVisible && (
        <View style={styles.overlay}>
          <Menu name={name} phoneNumber={phoneNumber} toggleMenu={toggleMenu} handleLogout={handleLogout} />
        </View>
      )}
      {notificationsVisible && (
        <View style={styles.overlay}>
          <Notifications toggleNotifications={toggleNotifications} />
        </View>
      )}

      {/* Registration Modal */}
      <Modal visible={showRegistrationModal} transparent animationType="fade">
        <View style={styles.registrationModal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Complete Your Registration</Text>
            <Text style={styles.modalText}>Please provide your details to continue.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#666666"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Address"
              value={address}
              onChangeText={setAddress}
              placeholderTextColor="#666666"
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitRegistration}
              disabled={loadingRegistration}
            >
              {loadingRegistration ? (
                <ActivityIndicator color="#ffffff" />
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
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
  activeTab: { backgroundColor: '#4caf50' },
  tabText: { marginLeft: 8, fontSize: 16, fontWeight: '600', color: '#4caf50' },
  activeTabText: { color: '#ffffff' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  registrationModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    width: width * 0.8,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333333' },
  modalText: { fontSize: 14, color: '#666666', marginBottom: 20, textAlign: 'center' },
  modalInput: {
    width: '100%',
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    color: '#333333',
  },
  submitButton: {
    backgroundColor: '#4caf50',
    width: '100%',
    height: 40,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});
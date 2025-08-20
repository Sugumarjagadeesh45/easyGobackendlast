import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PermissionsAndroid, Platform, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import Geolocation from 'react-native-geolocation-service';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type WelcomeScreen1NavigationProp = NativeStackNavigationProp<RootStackParamList, 'WelcomeScreen1'>;

const WelcomeScreen1 = () => {
  const navigation = useNavigation<WelcomeScreen1NavigationProp>();

  const [address, setAddress] = useState('Fetching location...');
  const [notificationCount, setNotificationCount] = useState(0);

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'You have ' + notificationCount + ' new notifications.');
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission denied', 'Location permission is required.');
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("My current location:", latitude, longitude);
        setAddress(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
      },
      (error) => {
        console.log(error);
        Alert.alert('Error', 'Unable to get location');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    getCurrentLocation();
    setNotificationCount(3);
  }, []);

  return (
    <LinearGradient
      colors={['#27FA07', '#76F57E']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Notification Bell */}
      <TouchableOpacity 
        style={styles.notificationBell} 
        onPress={handleNotificationPress}
      >
        <Icon name="bell" size={24} color="#FFF" />
        {notificationCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationText}>{notificationCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.content}>
        <Icon name="taxi" size={100} color="#FFF" style={styles.icon} />
        <Text style={styles.title}>Welcome to EazyGo</Text>
        <Text style={styles.subtitle}>Book your ride in seconds</Text>

        <View style={styles.locationContainer}>
          <Icon name="map-marker" size={24} color="#FFF" />
          <Text style={styles.locationText}>{address}</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={getCurrentLocation}
        >
          <Icon name="refresh" size={20} color="#27FA07" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Refresh Location</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => navigation.navigate('WelcomeScreen5')}
      >
        <Text style={styles.nextButtonText}>Continue</Text>
        <Icon name="arrow-right" size={18} color="#27FA07" style={styles.nextButtonIcon} />
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notificationBell: {
    position: 'absolute',
    top: 50,
    right: 25,
    zIndex: 10,
  },
  notificationBadge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  icon: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 40,
    textAlign: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    marginBottom: 30,
  },
  locationText: {
    color: '#FFF',
    marginLeft: 10,
    fontSize: 16,
    flex: 1,
  },
  button: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#27FA07',
    fontWeight: 'bold',
    fontSize: 16,
  },
  nextButton: {
    position: 'absolute',
    bottom: 50,
    right: 30,
    backgroundColor: '#FFF',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nextButtonText: {
    color: '#27FA07',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 10,
  },
  nextButtonIcon: {
    marginLeft: 5,
  },
});

export default WelcomeScreen1;
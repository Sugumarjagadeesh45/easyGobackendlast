import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

interface ProfileSectionProps {
  name: string;
  phoneNumber: string;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ name, phoneNumber }) => {
  return (
    <View style={styles.profileSection}>
      <View style={styles.profileIcon}>
        <FontAwesome name="user" size={24} color="#28a745" />
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>{name || 'John Doe'}</Text>
        <Text style={styles.profilePhone}>{phoneNumber || '+1 234 567 890'}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#A9A9A9" />
    </View>
  );
};

const styles = StyleSheet.create({
  profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  profileIcon: {
    backgroundColor: '#D3D3D3',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '600', color: '#000000' },
  profilePhone: { fontSize: 14, color: '#A9A9A9', lineHeight: 20 },
});

export default ProfileSection;
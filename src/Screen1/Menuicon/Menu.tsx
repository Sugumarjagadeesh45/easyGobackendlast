import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ProfileSection from './ProfileSection';
import WalletSection from './WalletSection';
import MenuItem from './MenuItem';
import { Text } from 'react-native';

interface MenuProps {
  name: string;
  phoneNumber: string;
  toggleMenu: () => void;
  handleLogout: () => Promise<void>;
}

const Menu: React.FC<MenuProps> = ({ name, phoneNumber, toggleMenu, handleLogout }) => {
  return (
    <View style={styles.menuContainer}>
      <View style={styles.menuHeader}>
        <TouchableOpacity onPress={toggleMenu}>
          <Ionicons name="arrow-back" size={24} color='#D3D3D3' />
        </TouchableOpacity>
        <Text style={styles.menuTitle}>Menu</Text>
      </View>

      <ProfileSection name={name} phoneNumber={phoneNumber} />
      <WalletSection />

      <View style={styles.menuDivider} />

      <MenuItem icon="payment" text="Payment" />
      <MenuItem icon="history" text="My Travel History" />
      <MenuItem icon="security" text="Safety" />
      <MenuItem icon="logout" text="Logout" onPress={handleLogout} />

      <View style={styles.menuDivider} />

      <View style={styles.menuFooter}>
        <Text style={styles.footerText}>App Version 1.0.0</Text>
        <Text style={styles.footerText}>© 2023 TaxiApp Inc.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    width: '75%',
    height: '100%',
    backgroundColor: '#FFFFFF',
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
    color: '#D3D3D3',
    marginLeft: 20,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#D3D3D3',
    marginVertical: 15,
  },
  menuFooter: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#A9A9A9',
    marginTop: 5,
  },
});

export default Menu;
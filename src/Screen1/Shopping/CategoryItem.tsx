import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface CategoryItemProps {
  category: Category;
  getCategoryIcon: (categoryName: string) => string;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ category, getCategoryIcon }) => {
  return (
    <TouchableOpacity style={styles.categoryItem}>
      <View style={styles.categoryIcon}>
        <MaterialIcons name={getCategoryIcon(category.name)} size={24} color='#4caf50' />
      </View>
      <Text style={styles.categoryText}>{category.name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  categoryItem: { alignItems: 'center', marginRight: 20 },
  categoryIcon: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginBottom: 5,
  },
  categoryText: { fontSize: 14, color: '#A9A9A9', fontWeight: '500' },
});

export default CategoryItem;
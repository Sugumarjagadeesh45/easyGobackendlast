import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import ProductCard from './ProductCard';
import CategoryItem from './CategoryItem';

interface ShoppingContentProps {
  mockProducts: Product[];
  mockCategories: Category[];
  getCategoryIcon: (categoryName: string) => string;
}

const ShoppingContent: React.FC<ShoppingContentProps> = ({ mockProducts, mockCategories, getCategoryIcon }) => {
  return (
    <ScrollView style={styles.shoppingContainer}>
      <Text style={styles.sectionTitle}>Featured Products</Text>
      {mockProducts.map((product) => <ProductCard key={product.id} product={product} />)}

      <Text style={styles.sectionTitle}>Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
        {mockCategories.map((category) => <CategoryItem key={category.id} category={category} getCategoryIcon={getCategoryIcon} />)}
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  shoppingContainer: { flex: 1, padding: 20, backgroundColor: '#FFFFFF' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginVertical: 20, color: '#D3D3D3' },
  categoriesScroll: { paddingVertical: 10 },
});

export default ShoppingContent;
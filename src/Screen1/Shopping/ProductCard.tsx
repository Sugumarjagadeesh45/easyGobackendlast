import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <View style={styles.productCard}>
      <View style={styles.productImage}>
        <MaterialIcons name="image" size={80} color="#A9A9A9" />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productDescription}>{product.description}</Text>
        <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  productImage: {
    width: 100,
    height: 100,
    backgroundColor: '#D3D3D3',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginRight: 15,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: '#D3D3D3' },
  productDescription: { fontSize: 14, color: '#A9A9A9', marginTop: 5, lineHeight: 20 },
  productPrice: { fontSize: 16, fontWeight: '600', color: '#4caf50', marginTop: 10 },
});

export default ProductCard;
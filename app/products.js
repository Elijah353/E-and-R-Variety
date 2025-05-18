import React from 'react';
import { Text, StyleSheet, FlatList, View, Image, SafeAreaView } from 'react-native';
const products = [
  {
    id: 1, name: '"Atomic Habits" by James Clear ', price: 16.99, image:
      require('./assets/atomic_habits.jpg')
  },
  {
    id: 2, name: 'Bookmarks (Set of 5)', price: 2.49, image:
      require('./assets/bookmarks.jpg')
  },
  {
    id: 3, name: 'Tote Bags with Quotes', price: 12.99, image:
      require('./assets/tote_bags_with_quotes.jpg')
  },
  // Add more products here
];
const ProductListScreen = () => {
  const renderProduct = ({ item }) => (
    <View style={styles.productContainer}>
      <Image source={item.image} style={styles.productImage} />
      <View style={styles.productDetails}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price}</Text>
      </View>
    </View>
  );
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.container}
      />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  productContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  productDetails: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  productPrice: {
    fontSize: 16,
    color: 'green',
  },
});
export default ProductListScreen;

import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as SQLite from 'expo-sqlite';

const Welcome = () => {
  const router = useRouter();

  useEffect(() => {
    setupDatabase();
  }, []);

  const setupDatabase = async () => {
      const db = await SQLite.openDatabaseAsync("mobileApps.db");
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          username TEXT NOT NULL,
          email TEXT NOT NULL,
          password TEXT NOT NULL
        )
      `);
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          image TEXT
        )
      `);
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          username TEXT NOT NULL,
          email TEXT NOT NULL
        )
      `);
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          total_price REAL NOT NULL,
          order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers(id)
        )
      `);
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER DEFAULT 1,
          FOREIGN KEY (order_id) REFERENCES orders(id),
          FOREIGN KEY (product_id) REFERENCES products(id)
        )
      `);
    };

  return (
    <ImageBackground
      source={require('./assets/background2.jpg')}
      style={styles.background}
    >
      <View style={styles.overlay} />

      <View style={styles.container}>
        <Text style={styles.title}>Welcome to E&R Variety</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/register/register')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)', // dark translucent overlay
  },
  container: {
    padding: 30,
    alignItems: 'center',
    zIndex: 2,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 50,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  button: {
    backgroundColor: '#1C1C1C',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 30,
    shadowColor: '#ff6f61',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

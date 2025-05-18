import React from 'react';
import { StyleSheet, Text, View, ImageBackground, Button } from 'react-native';
import { useRouter } from 'expo-router';

const Welcome = () => {
  const router = useRouter();

  return (
    <ImageBackground
      source={require('./assets/background.jpg')}  // Adjust path if needed
      style={styles.background}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to E & R Varity</Text>

        <Button title="Register" onPress={() => router.push('/register/register')}/>
      </View>
    </ImageBackground>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#fff',
  },
});

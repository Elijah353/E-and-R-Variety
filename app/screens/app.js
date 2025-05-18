import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Welcome from './welcome';          
import index from './screens/index';    
import Products from './screens/products';
import customers from './screens/customers';
import PlaceOrder from './screens/place_an_order';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="Home" component={index} />
        <Stack.Screen name="Products" component={Products} />
        <Stack.Screen name="Customers" component={customers} />
        <Stack.Screen name="PlaceOrder" component={PlaceOrder} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

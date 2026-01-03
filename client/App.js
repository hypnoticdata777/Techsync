import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {StatusBar, ActivityIndicator, View, StyleSheet} from 'react-native';

import {AuthProvider, useAuth} from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import WorkOrdersListScreen from './src/screens/WorkOrdersListScreen';
import WorkOrderDetailsScreen from './src/screens/WorkOrderDetailsScreen';
import WorkOrderFormScreen from './src/screens/WorkOrderFormScreen';

const Stack = createNativeStackNavigator();

function Navigation() {
  const {isAuthenticated, loading} = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#050816',
          },
          headerTintColor: '#38bdf8',
          headerTitleStyle: {
            fontWeight: '700',
            color: '#f9fafb',
          },
          contentStyle: {
            backgroundColor: '#050816',
          },
        }}>
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                title: 'Create Account',
              }}
            />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen
              name="WorkOrdersList"
              component={WorkOrdersListScreen}
              options={{
                title: 'TechSync',
              }}
            />
            <Stack.Screen
              name="WorkOrderDetails"
              component={WorkOrderDetailsScreen}
              options={{
                title: 'Work Order Details',
              }}
            />
            <Stack.Screen
              name="WorkOrderForm"
              component={WorkOrderFormScreen}
              options={({route}) => ({
                title: route.params?.workOrder
                  ? 'Edit Work Order'
                  : 'New Work Order',
              })}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="light-content" backgroundColor="#050816" />
      <Navigation />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050816',
  },
});

export default App;

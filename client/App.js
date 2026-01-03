import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {StatusBar} from 'react-native';

import WorkOrdersListScreen from './src/screens/WorkOrdersListScreen';
import WorkOrderDetailsScreen from './src/screens/WorkOrderDetailsScreen';
import WorkOrderFormScreen from './src/screens/WorkOrderFormScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#050816" />
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
              title: route.params?.workOrder ? 'Edit Work Order' : 'New Work Order',
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default App;

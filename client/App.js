import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {StatusBar, ActivityIndicator, View, StyleSheet} from 'react-native';

import {AuthProvider, useAuth} from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AcceptInvitationScreen from './src/screens/AcceptInvitationScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import WorkOrdersListScreen from './src/screens/WorkOrdersListScreen';
import WorkOrderDetailsScreen from './src/screens/WorkOrderDetailsScreen';
import WorkOrderFormScreen from './src/screens/WorkOrderFormScreen';
import OperationsReportScreen from './src/screens/OperationsReportScreen';
import DispatchBoardScreen from './src/screens/DispatchBoardScreen';
import PmcDirectoryScreen from './src/screens/PmcDirectoryScreen';
import {canAccessMainRoute} from './src/utils/roleWorkflows';

const Stack = createNativeStackNavigator();

function Navigation() {
  const {isAuthenticated, loading, user} = useAuth();

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
              name="Onboarding"
              component={OnboardingScreen}
              options={{
                title: 'Create Organization',
              }}
            />
            <Stack.Screen
              name="AcceptInvitation"
              component={AcceptInvitationScreen}
              options={{
                title: 'Accept Invitation',
              }}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{
                title: 'Reset Password',
              }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{
                title: 'Set New Password',
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
            {canAccessMainRoute(user?.role, 'WorkOrderForm') ? (
              <Stack.Screen
                name="WorkOrderForm"
                component={WorkOrderFormScreen}
                options={({route}) => ({
                  title: route.params?.workOrder
                    ? 'Edit Work Order'
                    : 'New Work Order',
                })}
              />
            ) : null}
            {canAccessMainRoute(user?.role, 'OperationsReport') ? (
              <Stack.Screen
                name="OperationsReport"
                component={OperationsReportScreen}
                options={{
                  title: 'Operations Report',
                }}
              />
            ) : null}
            {canAccessMainRoute(user?.role, 'DispatchBoard') ? (
              <Stack.Screen
                name="DispatchBoard"
                component={DispatchBoardScreen}
                options={{
                  title: 'Dispatch Board',
                }}
              />
            ) : null}
            {canAccessMainRoute(user?.role, 'PmcDirectory') ? (
              <Stack.Screen
                name="PmcDirectory"
                component={PmcDirectoryScreen}
                options={{
                  title: 'PMC Directory',
                }}
              />
            ) : null}
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

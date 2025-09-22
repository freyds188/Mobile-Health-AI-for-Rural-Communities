import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CHWWorkflowScreen from '../screens/CHWWorkflowScreen';

const Stack = createStackNavigator();

const CHWStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CHWWorkflow"
        component={CHWWorkflowScreen}
        options={{ title: 'CHW Guided Workflow' }}
      />
    </Stack.Navigator>
  );
};

export default CHWStackNavigator;



import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { auth } from "../firebaseConfig"; // Adjust import path as needed

const LogoutScreen: React.FC = () => {
  const handleLogout = () => {
    auth.signOut().then(() => {
      console.log("User logged out");
    });
  };

  return (
    <View style={styles.container}>
      <Text>Logout Screen</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default LogoutScreen;

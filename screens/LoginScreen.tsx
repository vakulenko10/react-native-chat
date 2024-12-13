import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [isSigningUp, setIsSigningUp] = useState<boolean>(false); // Toggle between Login and Signup

  const handleLogin = async () => {
    try {
      let loginEmail = email;

      // If the input is a username, fetch the corresponding email from Firestore
      if (username && !email) {
        const usersQuery = query(
          collection(db, "users"),
          where("username", "==", username)
        );
        const querySnapshot = await getDocs(usersQuery);

        if (!querySnapshot.empty) {
          loginEmail = querySnapshot.docs[0].data().email;
        } else {
          throw new Error("Username not found");
        }
      }

      await signInWithEmailAndPassword(auth, loginEmail, password);
      // The onAuthStateChanged listener in the BottomTabNavigator will handle navigation
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSignUp = async () => {
    try {
      if (!email || !password || !username) {
        alert("All fields are required for Signup");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Save the username and email in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email,
        username,
      });

      alert("User registered successfully!");
      setIsSigningUp(false); // Switch to Login mode after successful signup
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSigningUp ? "Sign Up" : "Login"}</Text>

      {/* Username Input for Signup or Login */}
      {isSigningUp && (
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
      )}

      {!isSigningUp && (
        <TextInput
          style={styles.input}
          placeholder="Username or Email"
          value={email || username}
          onChangeText={(text) => {
            setEmail("");
            setUsername(text);
          }}
        />
      )}

      {/* Email Input for Signup */}
      {isSigningUp && (
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      )}

      {/* Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Button for Login or Signup */}
      <Button
        title={isSigningUp ? "Sign Up" : "Login"}
        onPress={isSigningUp ? handleSignUp : handleLogin}
      />

      {/* Toggle between Login and Signup */}
      <TouchableOpacity
        onPress={() => setIsSigningUp(!isSigningUp)}
        style={styles.toggleButton}
      >
        <Text style={styles.toggleText}>
          {isSigningUp
            ? "Already have an account? Login"
            : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginVertical: 8,
    borderRadius: 4,
  },
  toggleButton: {
    marginTop: 16,
    alignItems: "center",
  },
  toggleText: {
    color: "#007bff",
    fontWeight: "bold",
  },
});

export default LoginScreen;

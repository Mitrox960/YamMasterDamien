import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const GameSummaryScreen = ({ route, navigation }) => {
  const {
    winner,
    isWinner,
    playerScore,
    opponentScore,
    playerTokens,
    opponentTokens,
  } = route.params || {};

  const displayWinner = () => {
    if (winner === 'draw') return 'Égalité';
    return isWinner ? 'Toi' : 'Adversaire';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Résumé de la partie</Text>
      <Text style={styles.text}>Vainqueur : {displayWinner()}</Text>
      <Text style={styles.text}>Ton score : {playerScore}</Text>
      <Text style={styles.text}>Score adversaire : {opponentScore}</Text>
      <Text style={styles.text}>Tes pions restants : {playerTokens}</Text>
      <Text style={styles.text}>Pions adverses restants : {opponentTokens}</Text>
      <Button title="RETOUR AU MENU" onPress={() => navigation.navigate('HomeScreen')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold'
  },
  text: {
    fontSize: 18,
    marginBottom: 10
  }
});

export default GameSummaryScreen;

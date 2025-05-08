import React, { useContext, useEffect } from "react";
import { View, Text, StyleSheet } from 'react-native';
import PlayerTimer from './timers/player-timer.component';
import OpponentTimer from './timers/opponent-timer.component';
import PlayerDeck from "./decks/player-deck.component";
import OpponentDeck from "./decks/opponent-deck.component";
import PlayerScore from "./scores/player-score.component";
import OpponentScore from "./scores/opponent-score.component";
import PlayerTokens from "./tokens/player-tokens.component";
import OpponentTokens from "./tokens/opponent-tokens.component";
import Choices from "./choices/choices.component";
import Grid from "./grid/grid.component";
import { useNavigation } from '@react-navigation/native';
import { SocketContext } from '../../contexts/socket.context';

const OpponentInfos = () => (
  <View style={styles.opponentInfosContainer}>
    <Text>Opponent infos</Text>
  </View>
);

const PlayerInfos = () => (
  <View style={styles.playerInfosContainer}>
    <Text>Player Infos</Text>
  </View>
);

const Board = () => {
  const navigation = useNavigation();
  const socket = useContext(SocketContext);

  useEffect(() => {
    const handleEnd = (data) => {
      navigation.navigate('GameSummaryScreen', {
        winner: data.winner,
        playerScore: data.playerScore,
        opponentScore: data.opponentScore,
        playerTokens: data.playerTokens,
        opponentTokens: data.opponentTokens,
        idPlayer: socket.id,
      });
    };

    socket.on('game.end', handleEnd);

    return () => {
      socket.off('game.end', handleEnd);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.row, { height: '5%' }]}>
        <OpponentInfos />
        <View style={styles.opponentTimerScoreContainer}>
          <OpponentTimer />
          <OpponentScore />
          <OpponentTokens />
        </View>
      </View>

      <View style={[styles.row, { height: '25%' }]}>
        <OpponentDeck />
      </View>

      <View style={[styles.row, { height: '40%' }]}>
        <Grid />
        <Choices />
      </View>

      <View style={[styles.row, { height: '25%' }]}>
        <PlayerDeck />
      </View>

      <View style={[styles.row, { height: '5%' }]}>
        <PlayerInfos />
        <View style={styles.playerTimerScoreContainer}>
          <PlayerTimer />
          <PlayerScore />
          <PlayerTokens />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    borderBottomWidth: 1,
    borderColor: 'black',
  },
  opponentInfosContainer: {
    flex: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: 'black',
    backgroundColor: "lightgrey"
  },
  opponentTimerScoreContainer: {
    flex: 3,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "lightgrey"
  },
  playerInfosContainer: {
    flex: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: 'black',
    backgroundColor: "lightgrey"
  },
  playerTimerScoreContainer: {
    flex: 3,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "lightgrey"
  },
});

export default Board;

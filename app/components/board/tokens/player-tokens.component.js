// app/components/board/scores/player-tokens.component.js

import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SocketContext } from "../../../contexts/socket.context";

const PlayerTokens = () => {
  const socket = useContext(SocketContext);
  const [tokens, setTokens] = useState(12); // 12 par défaut

  useEffect(() => {
    socket.on("game.tokens", (data) => {
      setTokens(data.playerTokens);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text>Pions restants : {tokens}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 5,
  },
});

export default PlayerTokens;

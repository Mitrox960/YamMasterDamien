import React, { useEffect, useState, useContext } from "react";
import { View, Text, StyleSheet } from 'react-native';
import { SocketContext } from '../../../contexts/socket.context';

const PlayerScore = () => {

    const socket = useContext(SocketContext);
    const [playerScore, setPlayerScore] = useState(0);

    useEffect(() => {

        socket.on("game.score", (data) => {
            setPlayerScore(data['playerScore'])
        });

    }, []);

    return (

        <View style={styles.playerScoreContainer}>
            <Text>Score : {playerScore}</Text>
        </View>
        
    );
};

const styles = StyleSheet.create({
    playerScoreContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default PlayerScore;

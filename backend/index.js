const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
var uniqid = require('uniqid');
const GameService = require('./services/game.service');

// ---------------------------------------------------
// -------- CONSTANTS AND GLOBAL VARIABLES -----------
// ---------------------------------------------------
let games = [];
let queue = [];

// ------------------------------------
// -------- EMITTER METHODS -----------
// ------------------------------------

const updateClientsViewTimers = (game) => {
  game.player1Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:1', game.gameState));
  game.player2Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:2', game.gameState));
};

const updateClientsViewScores = (game) => {
  game.player1Socket.emit('game.score', GameService.send.forPlayer.gameScore('player:1', game.gameState));
  game.player2Socket.emit('game.score', GameService.send.forPlayer.gameScore('player:2', game.gameState));
};

const updateClientsViewDecks = (game) => {
  setTimeout(() => {
    game.player1Socket.emit('game.deck.view-state', GameService.send.forPlayer.deckViewState('player:1', game.gameState));
    game.player2Socket.emit('game.deck.view-state', GameService.send.forPlayer.deckViewState('player:2', game.gameState));
  }, 200);
};

const updateClientsViewChoices = (game) => {
  setTimeout(() => {
    game.player1Socket.emit('game.choices.view-state', GameService.send.forPlayer.choicesViewState('player:1', game.gameState));
    game.player2Socket.emit('game.choices.view-state', GameService.send.forPlayer.choicesViewState('player:2', game.gameState));
  }, 200);
}

const updateClientsViewGrid = (game) => {
  setTimeout(() => {
    game.player1Socket.emit('game.grid.view-state', GameService.send.forPlayer.gridViewState('player:1', game.gameState));
    game.player2Socket.emit('game.grid.view-state', GameService.send.forPlayer.gridViewState('player:2', game.gameState));
  }, 200)
}

// ---------------------------------
// -------- GAME METHODS -----------
// ---------------------------------

const createGame = (player1Socket, player2Socket) => {
  // init objet (game) with this first level of structure:
  // - gameState : { .. evolutive object .. }
  // - idGame : just in case ;)
  // - player1Socket: socket instance key "joueur:1"
  // - player2Socket: socket instance key "joueur:2"
  const newGame = GameService.init.gameState();
  newGame['idGame'] = uniqid();
  newGame['player1Socket'] = player1Socket;
  newGame['player2Socket'] = player2Socket;
  for (let i = 0; i < 5; i++) {
    newGame.gameState.grid[0][i].owner = 'player:1';
  }
  newGame.gameState.player1Tokens -= 5;
  
  // push game into 'games' global array
  games.push(newGame);

  const gameIndex = GameService.utils.findGameIndexById(games, newGame.idGame);

  // just notifying screens that game is starting
  games[gameIndex].player1Socket.emit('game.start', GameService.send.forPlayer.viewGameState('player:1', games[gameIndex]));
  games[gameIndex].player2Socket.emit('game.start', GameService.send.forPlayer.viewGameState('player:2', games[gameIndex]));

  // we update views
  updateClientsViewTimers(games[gameIndex]);
  updateClientsViewScores(games[gameIndex]);
  updateClientsViewDecks(games[gameIndex]);
  updateClientsViewGrid(games[gameIndex]);

  // timer every second
  const gameInterval = setInterval(() => {

    // timer variable decreased
    games[gameIndex].gameState.timer--;

    // emit timer to both clients every seconds
    updateClientsViewTimers(games[gameIndex]);
    updateClientsViewScores(games[gameIndex]);

    // if timer is down to 0, we end turn
    if (games[gameIndex].gameState.timer === 0) {

      // switch currentTurn variable
      games[gameIndex].gameState.currentTurn = games[gameIndex].gameState.currentTurn === 'player:1' ? 'player:2' : 'player:1';

      // reset timer
      games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();

      // reset deck / choices / grid states
      games[gameIndex].gameState.deck = GameService.init.deck();
      games[gameIndex].gameState.choices = GameService.init.choices();
      games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);

      // reset views also
      updateClientsViewTimers(games[gameIndex]);
      updateClientsViewDecks(games[gameIndex]);
      updateClientsViewChoices(games[gameIndex]);
      updateClientsViewGrid(games[gameIndex]);
    }

  }, 1000);

  // remove intervals at deconnection
  player1Socket.on('disconnect', () => {
    clearInterval(gameInterval);
  });

  player2Socket.on('disconnect', () => {
    clearInterval(gameInterval);
  });

};

const newPlayerInQueue = (socket) => {

  queue.push(socket);

  // 'queue' management
  if (queue.length >= 2) {
    const player1Socket = queue.shift();
    const player2Socket = queue.shift();
    createGame(player1Socket, player2Socket);
  }
  else {
    socket.emit('queue.added', GameService.send.forPlayer.viewQueueState());
  }
};

// ---------------------------------------
// -------- SOCKETS MANAGEMENT -----------
// ---------------------------------------

io.on('connection', socket => {

  console.log(`[${socket.id}] socket connected`);

  socket.on('queue.join', () => {
    console.log(`[${socket.id}] new player in queue `)
    newPlayerInQueue(socket);
  });

  socket.on('game.dices.roll', () => {
    const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);

    if (games[gameIndex].gameState.deck.rollsCounter < games[gameIndex].gameState.deck.rollsMaximum) {
      // si ce n'est pas le dernier lancé

      // gestion des dés 
      games[gameIndex].gameState.deck.dices = GameService.dices.roll(games[gameIndex].gameState.deck.dices);
      games[gameIndex].gameState.deck.rollsCounter++;

      // gestion des combinaisons
      const dices = games[gameIndex].gameState.deck.dices;
      const isDefi = false;
      const isSec = games[gameIndex].gameState.deck.rollsCounter === 2;

      const combinations = GameService.choices.findCombinations(dices, isDefi, isSec);
      games[gameIndex].gameState.choices.availableChoices = combinations;

      // gestion des vues
      updateClientsViewDecks(games[gameIndex]);
      updateClientsViewChoices(games[gameIndex]);

    } else {
      // si c'est le dernier lancer

      // gestion des dés 
      games[gameIndex].gameState.deck.dices = GameService.dices.roll(games[gameIndex].gameState.deck.dices);
      games[gameIndex].gameState.deck.rollsCounter++;
      games[gameIndex].gameState.deck.dices = GameService.dices.lockEveryDice(games[gameIndex].gameState.deck.dices);

      // gestion des combinaisons
      const dices = games[gameIndex].gameState.deck.dices;
      const isDefi = Math.random() < 0.15;
      const isSec = false;

      // gestion des choix
      const combinations = GameService.choices.findCombinations(dices, isDefi, isSec);
      games[gameIndex].gameState.choices.availableChoices = combinations;

      // check de la grille si des cases sont disponibles
      const isAnyCombinationAvailableOnGridForPlayer = GameService.grid.isAnyCombinationAvailableOnGridForPlayer(games[gameIndex].gameState);
      // Si aucune combinaison n'est disponible après le dernier lancer OU si des combinaisons sont disponibles avec les dés mais aucune sur la grille
      if (combinations.length === 0) {
        games[gameIndex].gameState.timer = 5;

        games[gameIndex].player1Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:1', games[gameIndex].gameState));
        games[gameIndex].player2Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:2', games[gameIndex].gameState));
      }

      updateClientsViewDecks(games[gameIndex]);
      updateClientsViewChoices(games[gameIndex]);
    }
  });

  socket.on('game.dices.lock', (idDice) => {

    const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);
    const indexDice = GameService.utils.findDiceIndexByDiceId(games[gameIndex].gameState.deck.dices, idDice);

    // reverse flag 'locked'
    games[gameIndex].gameState.deck.dices[indexDice].locked = !games[gameIndex].gameState.deck.dices[indexDice].locked;

    updateClientsViewDecks(games[gameIndex]);
  });
  
  socket.on('game.choices.selected', (data) => {
    // gestion des choix
    const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);
    const game = games[gameIndex];
    game.gameState.choices.idSelectedChoice = data.choiceId;
  
    // gestion de la grille
    game.gameState.grid = GameService.grid.resetcanBeCheckedCells(game.gameState.grid);
    game.gameState.grid = GameService.grid.updateGridAfterSelectingChoice(data.choiceId, game.gameState.grid);

  
    updateClientsViewScores(game); // Pour mettre à jour les scores côté client
    updateClientsViewChoices(game);
    updateClientsViewGrid(game);
  });
  socket.on('game.grid.selected', (data) => {
    const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);
    const game = games[gameIndex];
    const currentPlayer = game.gameState.currentTurn;
  
    // Sélection de la cellule
    game.gameState.grid = GameService.grid.resetcanBeCheckedCells(game.gameState.grid);
    game.gameState.grid = GameService.grid.selectCell(
      data.cellId,
      data.rowIndex,
      data.cellIndex,
      currentPlayer,
      game.gameState.grid
    );
  
    // Vérifie que le joueur a encore des pions
    if (
      (currentPlayer === 'player:1' && game.gameState.player1Tokens <= 0) ||
      (currentPlayer === 'player:2' && game.gameState.player2Tokens <= 0)
    ) {
      return; // Stoppe tout si pas de pion dispo
    }
  
    // Décrémenter le pion après validation
    if (currentPlayer === 'player:1') {
      game.gameState.player1Tokens -= 1;
    } else {
      game.gameState.player2Tokens -= 1;
    }
  
    // Vérifie les alignements (3, 4 ou 5)
    const result = GameService.grid.checkAlignmentsAndScore(game.gameState.grid, currentPlayer);
  
    // Si victoire instantanée (alignement de 5)
    if (result.won) {
      const winner = currentPlayer;
  
      io.to(game.player1Socket.id).emit('game.end', {
        winner,
        isWinner: winner === 'player:1',
        playerScore: game.gameState.player1Score,
        opponentScore: game.gameState.player2Score,
        playerTokens: game.gameState.player1Tokens,
        opponentTokens: game.gameState.player2Tokens
      });
  
      io.to(game.player2Socket.id).emit('game.end', {
        winner,
        isWinner: winner === 'player:2',
        playerScore: game.gameState.player2Score,
        opponentScore: game.gameState.player1Score,
        playerTokens: game.gameState.player2Tokens,
        opponentTokens: game.gameState.player1Tokens
      });
  
      return;
    }
  
    // Ajout de points (3 ou 4 alignés)
    if (result.points > 0) {
      GameService.addPointToPlayer(game.gameState, currentPlayer, result.points);
      updateClientsViewScores(game);
    }
  
    // Mise à jour des tokens restants
    game.player1Socket.emit('game.tokens', {
      playerTokens: game.gameState.player1Tokens,
      opponentTokens: game.gameState.player2Tokens
    });
    game.player2Socket.emit('game.tokens', {
      playerTokens: game.gameState.player2Tokens,
      opponentTokens: game.gameState.player1Tokens
    });
  
    // Fin de partie si un joueur n’a plus de pions
    if (game.gameState.player1Tokens === 0 || game.gameState.player2Tokens === 0) {
      const winner = currentPlayer;

      game.player1Socket.emit('game.end', {
        winner,
        isWinner: winner === 'player:1',
        playerScore: game.gameState.player1Score,
        opponentScore: game.gameState.player2Score,
        playerTokens: game.gameState.player1Tokens,
        opponentTokens: game.gameState.player2Tokens
      });
      
      game.player2Socket.emit('game.end', {
        winner,
        isWinner: winner === 'player:2',
        playerScore: game.gameState.player2Score,
        opponentScore: game.gameState.player1Score,
        playerTokens: game.gameState.player2Tokens,
        opponentTokens: game.gameState.player1Tokens
      });
      
      return;
    }
  
    // Fin du tour
    game.gameState.currentTurn = currentPlayer === 'player:1' ? 'player:2' : 'player:1';
    game.gameState.timer = GameService.timer.getTurnDuration();
    game.gameState.deck = GameService.init.deck();
    game.gameState.choices = GameService.init.choices();
  
    game.player1Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:1', game.gameState));
    game.player2Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:2', game.gameState));
  
    updateClientsViewDecks(game);
    updateClientsViewChoices(game);
    updateClientsViewGrid(game);
  });
  
  
  
  socket.on('disconnect', reason => {
    console.log(`[${socket.id}] socket disconnected - ${reason}`);
  });
});

// -----------------------------------
// -------- SERVER METHODS -----------
// -----------------------------------

app.get('/', (req, res) => res.sendFile('index.html'));

http.listen(3000, function () {
  console.log('listening on *:3000');
});

import React, {Component} from 'react';
import '../index.css';
import initChessBoard from '../helpers/helper';
import EvolvePicker from '../helpers/evolve-picker';
import FallenSoldierBlock from './fallen-soldier-block';
import Board from './board';
import King from '../pieces/king';
import Rook from '../pieces/rook';
import Pawn from '../pieces/pawn';
import Queen from '../pieces/queen';
import Knight from '../pieces/knight';
import Bishop from '../pieces/bishop';

export default class Game extends Component {
    constructor(props) {
        super(props);
        const squares = initChessBoard();
        const [whitePieces, blackPieces] = this.populatePieces(squares);
        this.state = {
            history: [{
                squares: squares,
                whiteFallenSoldiers: [],
                blackFallenSoldiers: [],
                whitePieces: whitePieces,
                blackPieces: blackPieces,
                whiteKingPos: [7, 4],
                blackKingPos: [0, 4],
                checkMater: null,
                curPlayer: 'white',
                evolvePawnRow: -1,
                evolvePawnCol: -1,
                lastMove: null,
            }],
            status: '',
            sourceRow: -1,
            sourceCol: -1,
            stepNumber: 0,
        };
        this.handleClick = this.handleClick.bind(this);
        this.handleEvolve = this.handleEvolve.bind(this);
        this.handleStartOver = this.handleStartOver.bind(this);
        this.handleUndo = this.handleUndo.bind(this);
        this.handleRedo = this.handleRedo.bind(this);
    }

    populatePieces(squares) {
        let whitePieces = new Set();
        let blackPieces = new Set();
        for (let r = 0; r <= 7; r++) {
            for (let c = 0; c <= 7; c++) {
                if (squares[r][c]) {
                    if (squares[r][c].player === 'white') {
                        whitePieces.add(squares[r][c]);
                    } else {
                        blackPieces.add(squares[r][c]);
                    }
                }
            }
        }
        return [whitePieces, blackPieces];
    }

    handleClick(i, j) {
        const history = this.state.history.slice(0, this.state.stepNumber + 1); //create a new copy of only until stepNumber
        const current = history[history.length - 1];

        if (this.determineWinner(current)) {
            return;
        }

        const squares = this.cloneSquares(current.squares);
        const curPlayer = current.curPlayer;
        let sourceRow = this.state.sourceRow;
        let sourceCol = this.state.sourceCol;
        if (sourceRow === -1 && sourceCol === -1) {
            if (current.evolvePawnRow !== -1 && current.evolvePawnCol !== -1) {
                //there's a pawn waiting to be evolved
                this.setState({
                    status: 'Please select one of the drop down type to evolve',
                })
            }
            //no piece has been selected yet. you have to select your own piece and non-null piece
            else if (!squares[i][j] || squares[i][j].player !== curPlayer) {
                this.setState({
                    status: 'Invalid selection. Can\'t select empty or not your own piece',
                });
            } else {
                //have to modify current because we don't want to concat another history for this middle step
                this.highlight(current.squares[i][j], true);
                this.setState({
                    status: 'Choose destination for the selected piece',
                    sourceRow: i,
                    sourceCol: j,
                });
            }
        } else { //another piece has been selected before
            //because we highlight current we need to remove from current
            this.highlight(current.squares[sourceRow][sourceCol], false);
            if (squares[i][j] && squares[i][j].player === curPlayer) {
                this.setState({
                    status: 'Wrong selection. Select empty or opponent\'s space. Choose again',
                    sourceRow: -1,
                    sourceCol: -1,
                })
            } else {
                const isDestEnemyOccupied = squares[i][j] ? true : false;
                let isDestPawnCaptured;
                if (current.lastMove) {
                    const source = current.lastMove[0];
                    const dest = current.lastMove[1];
                    const lastPiece = squares[dest[0]][dest[1]];
                    isDestPawnCaptured = squares[sourceRow][sourceCol] instanceof Pawn
                        && lastPiece instanceof Pawn && dest[0] === sourceRow
                        && (curPlayer === 'white' ? sourceRow ===3 : sourceRow ===4)
                        && (lastPiece.player === 'white' ? source[0] ===6 : source[0]===1)
                        && j === dest[1];
                }
                else {
                    isDestPawnCaptured = false;
                }
                const isMovePossible = squares[sourceRow][sourceCol].isMovePossible([i, j], isDestEnemyOccupied,isDestPawnCaptured);
                const isPathEmpty = this.isPathEmpty(squares, squares[sourceRow][sourceCol], [i, j]);
                const kingInDanger = this.kingInDanger(current, [sourceRow, sourceCol], [i, j]);
                if (!isMovePossible) {
                    this.setState({
                        status: 'Move is not possible. Please select again',
                        sourceRow: -1,
                        sourceCol: -1,
                    });
                } else if (!isPathEmpty) {
                    this.setState({
                        status: 'Path from source to dest is not empty. Please select again',
                        sourceRow: -1,
                        sourceCol: -1,
                    });
                } else if (kingInDanger) {
                    this.setState({
                        status: 'The move place king under checkmate position. Please select again',
                        sourceRow: -1,
                        sourceCol: -1,
                    });
                } else {
                    if (squares[sourceRow][sourceCol] instanceof King && Math.abs(j - sourceCol) === 2) {
                        /* king wants to enter castle
                         * note that when checking for if move is possible or not for king
                         * we already check that it has not been moved if |j-sourceCol|===2 */
                        this.handleEnterCastle(history, sourceRow, sourceCol, j);
                    } else { //normal move
                        this.movePiece(history, sourceRow, sourceCol, i, j, isDestEnemyOccupied, isDestPawnCaptured);
                    }
                }
            }
        }
    }

    movePiece(history, srcRow, srcCol, destRow, destCol, isDestEnemyOccupied, isDestPawnCaptured) {
        const current = history[history.length - 1];
        const squares = this.cloneSquares(current.squares);
        const [whitePieces, blackPieces] = this.populatePieces(squares);
        const whiteFallenSoldiers = current.whiteFallenSoldiers.slice();
        const blackFallenSoldiers = current.blackFallenSoldiers.slice();

        let curPlayer = current.curPlayer;
        let whiteKingPos = current.whiteKingPos;
        let blackKingPos = current.blackKingPos;

        if (isDestEnemyOccupied) {
            if (curPlayer === 'white') {
                blackPieces.delete(squares[destRow][destCol]);
                blackFallenSoldiers.push(squares[destRow][destCol]);
            } else {
                whitePieces.delete(squares[destRow][destCol]);
                whiteFallenSoldiers.push(squares[destRow][destCol]);
            }
        }
        else if (isDestPawnCaptured) {
            const dest = current.lastMove[1];
            const lastPiece = squares[dest[0]][dest[1]];
            if (curPlayer === 'white') {
                blackPieces.delete(lastPiece);
                blackFallenSoldiers.push(lastPiece);
            } else {
                whitePieces.delete(lastPiece);
                whiteFallenSoldiers.push(lastPiece);
            }
            squares[dest[0]][dest[1]] = null;
        }
        squares[destRow][destCol] = squares[srcRow][srcCol];
        squares[destRow][destCol].currentPos = [destRow, destCol];
        if (!squares[destRow][destCol].hasMoved) {
            squares[destRow][destCol].hasMoved = true;
        }
        squares[srcRow][srcCol] = null;

        if (squares[destRow][destCol] instanceof King) {
            if (curPlayer === 'white') {
                whiteKingPos = [destRow, destCol];
            } else {
                blackKingPos = [destRow, destCol];
            }
        }

        if (this.isEvolvablePawn(squares, curPlayer, [destRow, destCol])) {
            this.highlight(squares[destRow][destCol], true);
            this.setState({
                history: history.concat([{
                    squares: squares,
                    whiteFallenSoldiers: whiteFallenSoldiers,
                    blackFallenSoldiers: blackFallenSoldiers,
                    whitePieces: whitePieces,
                    blackPieces: blackPieces,
                    whiteKingPos: whiteKingPos,
                    blackKingPos: blackKingPos,
                    checkMater: null,
                    curPlayer: curPlayer, //player not change, because we have to wait for pawn evolving
                    evolvePawnRow: destRow,
                    evolvePawnCol: destCol,
                    lastMove: [[srcRow,srcCol],[destRow,destCol]],
                }]),
                status: 'Please select one of the drop down type to evolve',
                stepNumber: this.state.stepNumber + 1,
                sourceRow: -1,
                sourceCol: -1,
            })
        } else {
            //after moving, see if any piece checkmate the opponent king
            //we can't use the state's black or white pieces here because it is outdated
            let pieces = (curPlayer === 'white' ? whitePieces : blackPieces);
            let checkMater = this.kingCheckMated(current, pieces);
            let status = checkMater ? 'Checkmated. Please resolve' : '';

            this.setState({
                history: history.concat([{
                    squares: squares,
                    whiteFallenSoldiers: whiteFallenSoldiers,
                    blackFallenSoldiers: blackFallenSoldiers,
                    whitePieces: whitePieces,
                    blackPieces: blackPieces,
                    whiteKingPos: whiteKingPos,
                    blackKingPos: blackKingPos,
                    checkMater: checkMater,
                    curPlayer: curPlayer === 'white' ? 'black' : 'white',
                    evolvePawnRow: -1,
                    evolvePawnCol: -1,
                    lastMove: [[srcRow,srcCol],[destRow,destCol]]
                }]),
                status: status,
                stepNumber: this.state.stepNumber + 1,
                sourceRow: -1,
                sourceCol: -1,
            });
        }
    }

    /*
    * Check if the king is currently checkmated or the path is endangered
    * Then check if the other piece is a rook, has never moved and path is empty
    */
    handleEnterCastle(history, sourceRow, sourceCol, destCol) {
        const current = history[history.length - 1];
        const squares = this.cloneSquares(current.squares);
        const [whitePieces, blackPieces] = this.populatePieces(squares);
        const middleSpace = squares[sourceRow][sourceCol].getPathToDest([sourceRow, destCol])[0];
        if (squares[sourceRow][sourceCol] instanceof King) { //just to be sure it's a king
            if (squares[sourceRow][sourceCol].hasMoved) {
                this.setState({
                    status: 'Cannot enter castle because king has been moved before. Select again',
                    sourceRow: -1,
                    sourceCol: -1,
                });
            } else if (current.checkMater) {
                this.setState({
                    status: 'Cannot enter castle because king is being checkmated. Select again',
                    sourceRow: -1,
                    sourceCol: -1,
                });
            } else if (this.kingInDanger(current, [sourceRow, sourceCol], middleSpace)) {
                this.setState({
                    status: 'Cannot enter castle because the middle space is endangered. Select again',
                    sourceRow: -1,
                    sourceCol: -1,
                });
            } else {
                let curPlayer = current.curPlayer;
                let whiteKingPos = current.whiteKingPos;
                let blackKingPos = current.blackKingPos;
                let rookSourceCol, rookDestCol;

                if (destCol > sourceCol) {
                    rookSourceCol = destCol + 1;
                    rookDestCol = destCol - 1;
                } else {
                    rookSourceCol = destCol - 2;
                    rookDestCol = destCol + 1;
                }
                let piece = squares[sourceRow][rookSourceCol];
                if (piece instanceof Rook) {
                    if (!piece.hasMoved) {
                        if (this.isPathEmpty(squares, piece, [sourceRow, rookDestCol])) {
                            //move the king
                            squares[sourceRow][destCol] = squares[sourceRow][sourceCol];
                            squares[sourceRow][destCol].currentPos = [sourceRow, destCol];
                            squares[sourceRow][destCol].hasMoved = true;
                            squares[sourceRow][sourceCol] = null;
                            curPlayer === 'white' ?
                                whiteKingPos = [sourceRow, destCol] : blackKingPos = [sourceRow, destCol];

                            //move the rook
                            squares[sourceRow][rookDestCol] = piece;
                            piece.currentPos = [sourceRow, rookDestCol];
                            piece.hasMoved = true;
                            squares[sourceRow][rookSourceCol] = null;

                            //check if any piece checkmate opponent king. For this case, we can safely use the state's
                            //black or white pieces because no pieces are added or deleted from the set by enter castle
                            let pieces = (curPlayer === 'white' ? current.whitePieces : current.blackPieces);
                            let checkMater = this.kingCheckMated(current, pieces);
                            let status = checkMater ? 'Checkmated. Please resolve' : '';

                            this.setState({
                                history: history.concat({
                                    squares: squares,
                                    whiteFallenSoldiers: current.whiteFallenSoldiers.slice(),
                                    blackFallenSoldiers: current.blackFallenSoldiers.slice(),
                                    whitePieces: whitePieces,
                                    blackPieces: blackPieces,
                                    whiteKingPos: whiteKingPos,
                                    blackKingPos: blackKingPos,
                                    checkMater: checkMater,
                                    curPlayer: curPlayer === 'white' ? 'black' : 'white',
                                    evolvePawnRow: -1,
                                    evolvePawnCol: -1,
                                    lastMove: [[sourceRow,sourceCol],[sourceRow,destCol]],
                                }),
                                status: status,
                                sourceRow: -1,
                                sourceCol: -1,
                                stepNumber: this.state.stepNumber + 1,
                            });
                        } else {
                            this.setState({
                                status: 'Cannot enter castle because rook src->dest is not empty. Select again',
                                sourceRow: -1,
                                sourceCol: -1,
                            });
                        }
                    } else {
                        this.setState({
                            status: 'Cannot enter castle because rook has been moved before. Select again',
                            sourceRow: -1,
                            sourceCol: -1,
                        });
                    }
                } else {
                    this.setState({
                        status: 'The corresponding piece is not a rook. Select again',
                        sourceRow: -1,
                        sourceCol: -1,
                    });
                }
            }
        }
    }

    /*
     * after user selects a type, evolve the pawn into that type, and check
     * if the just evolved piece checkmate opponent's king
     */
    handleEvolve(type) {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = this.cloneSquares(current.squares);
        const [whitePieces, blackPieces] = this.populatePieces(squares);
        const whiteFallenSoldiers = current.whiteFallenSoldiers.slice();
        const blackFallenSoldiers = current.blackFallenSoldiers.slice();

        let curPlayer = current.curPlayer;
        let evolvePawnRow = current.evolvePawnRow;
        let evolvePawnCol = current.evolvePawnCol;
        if (evolvePawnRow !== -1 && evolvePawnCol !== -1) {
            if (curPlayer === 'white') {
                whitePieces.delete(squares[evolvePawnRow][evolvePawnCol]);
                whiteFallenSoldiers.push(squares[evolvePawnRow][evolvePawnCol]);
            } else {
                blackPieces.delete(squares[evolvePawnRow][evolvePawnCol]);
                blackFallenSoldiers.push(squares[evolvePawnRow][evolvePawnCol]);
            }
            switch (type) {
                case 'queen':
                    squares[evolvePawnRow][evolvePawnCol] = new Queen(curPlayer, [evolvePawnRow, evolvePawnCol]);
                    break;
                case 'rook':
                    squares[evolvePawnRow][evolvePawnCol] = new Rook(curPlayer, [evolvePawnRow, evolvePawnCol], false);
                    break;
                case 'knight':
                    squares[evolvePawnRow][evolvePawnCol] = new Knight(curPlayer, [evolvePawnRow, evolvePawnCol]);
                    break;
                case 'bishop':
                    squares[evolvePawnRow][evolvePawnCol] = new Bishop(curPlayer, [evolvePawnRow, evolvePawnCol]);
                    break;
                default:
                    break;
            }
            curPlayer === 'white' ? whitePieces.add(squares[evolvePawnRow][evolvePawnCol]) :
                blackPieces.add(squares[evolvePawnRow][evolvePawnCol]);

            //check if the just evolved piece check mate the opponent's king
            let pieces = (curPlayer === 'white' ? whitePieces : blackPieces);
            let checkMater = this.kingCheckMated(current, pieces);
            let status = checkMater ? 'Checkmated. Please resolve' : '';
            this.setState({
                history: history.concat([{
                    squares: squares,
                    whiteFallenSoldiers: whiteFallenSoldiers,
                    blackFallenSoldiers: blackFallenSoldiers,
                    whitePieces: whitePieces,
                    blackPieces: blackPieces,
                    whiteKingPos: current.whiteKingPos,
                    blackKingPos: current.blackKingPos,
                    checkMater: checkMater,
                    curPlayer: curPlayer === 'white' ? 'black' : 'white',
                    evolvePawnRow: -1,
                    evolvePawnCol: -1,
                    lastMove: current.lastMove.slice(), //because last move is the same as previous move
                }]),
                status: status,
                sourceRow: -1,
                sourceCol: -1,
                stepNumber: this.state.stepNumber + 1,
            })
        } else {
            this.setState({
                status: 'Not the time to evolve right now',
            })
        }
    }

    /*
       return true if opponent king is checkmated by piece, otherwise false
    */
    kingCheckMated(current, pieces) {
        const curPlayer = current.curPlayer;
        const oppKingPos = (curPlayer === 'white' ? current.blackKingPos : current.whiteKingPos);
        for (let piece of pieces) {
            if (piece.isMovePossible(oppKingPos, true) && this.isPathEmpty(current.squares, piece, oppKingPos)) {
                return piece;
            }
        }
        return null;
    }

    /*
     * check if the piece from [srcRow,srcCol]
     * is moved to destRow, destCol, will it cause a problem for the king
     * The piece can be the king, or something else
     */
    kingInDanger(current, [srcRow, srcCol], [destRow, destCol]) {
        const curPlayer = current.curPlayer;
        const piece = current.squares[srcRow][srcCol];
        const enemies = curPlayer === 'white' ? current.blackPieces : current.whitePieces;
        const checkMater = current.checkMater; //may or may not be null
        if (piece instanceof King) {
            for (let enemy of enemies) {
                if (enemy.isMovePossible([destRow, destCol], true)) {
                    //isDestEnemyOccupied = true because after the king moves there, it becomes true.
                    if (checkMater && enemy === checkMater) {
                        return true;
                    } else if (this.isPathEmpty(current.squares, enemy, [destRow, destCol])) {
                        return true;
                    }
                }
            }
            return false;
        } else {
            const kingPos = curPlayer === 'white' ? current.whiteKingPos : current.blackKingPos;
            if (checkMater) { //king is being checkmated, so we need to put something in the check path or eat the checkmater
                const path = checkMater.getPathToDest(kingPos);
                path.push(checkMater.currentPos);
                for (let space of path) {
                    if (destRow === space[0] && destCol === space[1]) { //the piece blocks the path or eat the checkmater
                        return false;
                    }
                }
                return true;
            } else { //king is not currently checkmated
                const squares = current.squares;
                for (let enemy of enemies) {
                    if (!(enemy instanceof King) && enemy.isMovePossible(kingPos, true)) { //enemy cannot be pawn and knight, because if move is possible, they are already checkmaters (no piece can block their paths)
                        let blockers = [];
                        let [enemyRow, enemyCol] = enemy.currentPos;
                        let checkPath = enemy.getPathToDest(kingPos); //checkPath can never be of length 0, otherwise enemy is already a checkmater
                        let moveOnToCheckPath = false;
                        for (let [row, col] of checkPath) {
                            if (destRow === row && destCol === col) { //means piece is going to move onto the checkpath
                                moveOnToCheckPath = true;
                            }
                            if (squares[row][col]) {
                                blockers.push(squares[row][col]);
                            }
                        }
                        //if there's only one blocker on checkpath
                        //and it's the piece being moved: piece
                        //and it does not eat the potential checkmater
                        //and its next move is not another space on the checkpath
                        //then king is in danger
                        if (blockers.length === 1 && blockers[0] === piece && (destRow !== enemyRow || destCol !== enemyCol) && !moveOnToCheckPath) {
                            return true;
                        }
                    }
                }
                return false;
            }
        }
    }

    /*
     * Check if the piece at [row,col] is an evolvable pawn or not
     */
    isEvolvablePawn(squares, curPlayer, [row, col]) {
        return (row !== -1 && col !== -1 && squares[row][col] instanceof Pawn
            && row === (curPlayer === 'white' ? 0 : 7));
    }

    /*
     * Check if the path from source to destination does not contain any piece
     */
    isPathEmpty(squares, piece, [destRow, destCol]) {
        let path = piece.getPathToDest([destRow, destCol]);
        for (let space of path) {
            if (squares[space[0]][space[1]]) {
                return false;
            }
        }
        return true;
    }

    highlight(piece, shouldHighlight) {
        if (shouldHighlight) {
            piece.className = "selected";
        } else {
            piece.className = null;
        }
    }

    cloneSquares(squares) {
        const clone = Array(8).fill(null).map(() => Array(8).fill(null));
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (squares[i][j]) {
                    if (squares[i][j] instanceof King) {
                        clone[i][j] = new King(squares[i][j].player, [i, j], squares[i][j].hasMoved);
                    } else if (squares[i][j] instanceof Knight) {
                        clone[i][j] = new Knight(squares[i][j].player, [i, j]);
                    } else if (squares[i][j] instanceof Pawn) {
                        clone[i][j] = new Pawn(squares[i][j].player, [i, j]);
                    } else if (squares[i][j] instanceof Queen) {
                        clone[i][j] = new Queen(squares[i][j].player, [i, j]);
                    } else if (squares[i][j] instanceof Rook) {
                        clone[i][j] = new Rook(squares[i][j].player, [i, j], squares[i][j].hasMoved);
                    } else if (squares[i][j] instanceof Bishop) {
                        clone[i][j] = new Bishop(squares[i][j].player, [i, j]);
                    }
                }
            }
        }
        return clone;
    }

    render() {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        let winner = this.determineWinner(current);
        let status = this.state.status;
        if (current.checkMater) {
            status = 'Checkmated. Please resolve';
        }
        if (current.evolvePawnRow !== -1 && current.evolvePawnCol !== -1) {
            status = 'Please select one of the drop down type to evolve'
        }
        if (winner) {
            status = 'Winner: ' + winner;
            if (winner === 'Draw') {
                status = 'The game is draw';
            }
        }
        return (
            <React.Fragment>
                <h1><strong>A GAME OF CHESS BY KEVIN</strong></h1>
                <div className="game">
                    <Board squares={current.squares}
                           onClick={(i, j) => this.handleClick(i, j)}/>
                    <div className="game-info">
                        <h3>Turn</h3>
                        <div id="player-turn-box"
                             style={{
                                 backgroundColor:
                                     current.curPlayer === 'white' ? "#fff" : "#000"
                             }}/>
                        <EvolvePicker onSubmit={(type) => this.handleEvolve(type)}/>
                        <div className="status">{status}</div>
                        <FallenSoldierBlock whiteFallenSoldiers={current.whiteFallenSoldiers}
                                            blackFallenSoldiers={current.blackFallenSoldiers}/>
                    </div>
                </div>
                <div className="action-buttons">
                    <button onClick={this.handleUndo}>Undo</button>
                    <button onClick={this.handleRedo}>Redo</button>
                    <button onClick={this.handleStartOver}>Start Over</button>
                </div>
            </React.Fragment>
        )
    }

    determineWinner(current) {
        let winner = null;
        const curPlayer = current.curPlayer;
        const checkMater = current.checkMater;
        let kingCanMove = this.kingCanStillMove(current);
        if (!kingCanMove) {
            if (checkMater) {
                if (!this.kingHaveBlockers(current)) {
                    winner = (curPlayer === 'white' ? 'black' : 'white');
                }
            } else {
                if (!this.anotherMovePossible(current)) {
                    winner = 'Draw';
                }
            }
        }
        return winner;
    }

    kingCanStillMove(current) {
        const curPlayer = current.curPlayer;
        const squares = current.squares;
        const [kingRow, kingCol] = (curPlayer === 'white' ? current.whiteKingPos : current.blackKingPos);
        const king = squares[kingRow][kingCol];
        for (let [row, col] of king.getPossibleMoves()) {
            if (!(squares[row][col] && squares[row][col].player === curPlayer)
                && !this.kingInDanger(current, [kingRow, kingCol], [row, col])) {
                return true;
            }
        }
        return false;
    }

    /*this method is only called when checkMater!==null
    * return whether exist a piece that can block the check path for king (king is currently checkmated)
    * and include the position of the checkmater as well, in case a piece can eat the checkmater
    * */
    kingHaveBlockers(current) {
        const curPlayer = current.curPlayer;
        const pieces = curPlayer === 'white' ? current.whitePieces : current.blackPieces;
        const [kingRow, kingCol] = (curPlayer === 'white' ? current.whiteKingPos : current.blackKingPos);
        const checkMater = current.checkMater;
        let path = checkMater.getPathToDest([kingRow, kingCol]);
        let [checkRow, checkCol] = checkMater.currentPos;
        for (let piece of pieces) { //iterate over all of current player's piece and possible moves
            if ((piece instanceof King) === false) { //we only iterate the pieces that are not king
                if (piece.isMovePossible([checkRow, checkCol], true) &&
                    this.isPathEmpty(current.squares, piece, [checkRow, checkCol])) {
                    return true;
                } else {
                    for (let space of path) {
                        if (piece.isMovePossible(space, false)
                            && this.isPathEmpty(current.squares, piece, space)) { //false because no space on check path contains any piece
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    //call when king is not checkmated
    anotherMovePossible(current) {
        const curPlayer = current.curPlayer;
        const pieces = (curPlayer === 'white' ? current.whitePieces : current.blackPieces);
        const squares = current.squares;
        for (let piece of pieces) {
            if (!(piece instanceof King)) {
                for (let [possRow, possCol] of piece.getPossibleMoves()) {
                    if (!(squares[possRow][possCol] && squares[possRow][possCol].player === curPlayer)
                        && this.isPathEmpty(squares, piece, [possRow, possCol])) {
                        return true;
                    }
                }
                if (piece instanceof Pawn) {
                    for (let [tarRow, tarCol] of piece.getPossibleTargets()) {
                        if (squares[tarRow][tarCol] && squares[tarRow][tarCol].player !== curPlayer
                            && this.isPathEmpty(squares, piece, [tarRow, tarCol])) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    //handle start over action button
    handleStartOver() {
        const squares = initChessBoard();
        const [whitePieces, blackPieces] = this.populatePieces(squares);
        this.setState({
            history: [{
                squares: squares,
                whiteFallenSoldiers: [],
                blackFallenSoldiers: [],
                whitePieces: whitePieces,
                blackPieces: blackPieces,
                whiteKingPos: [7, 4],
                blackKingPos: [0, 4],
                checkMater: null,
                curPlayer: 'white',
                evolvePawnRow: -1,
                evolvePawnCol: -1,
                lastMove: null,
            }],
            status: '',
            sourceRow: -1,
            sourceCol: -1,
            stepNumber: 0,
        })
    }

    //handle undo action button
    handleUndo() {
        let moveComplete = this.state.sourceRow === -1 && this.state.sourceCol === -1;
        let lastStep = Math.max(this.state.stepNumber - 1, 0);
        if (moveComplete) { //undo is only possible if a move is complete
            this.setState({
                stepNumber: lastStep,
                status: '',
            })
        }
    }

    //handleRedo action button
    handleRedo() {
        let moveComplete = this.state.sourceRow === -1 && this.state.sourceCol === -1;
        let nextStep = Math.min(this.state.history.length - 1, this.state.stepNumber + 1);
        if (moveComplete) { //redo is only possible if a move is complete
            this.setState({
                stepNumber: nextStep,
                status: '',
            })
        }
    }
}

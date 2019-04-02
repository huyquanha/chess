import React, {Component} from 'react';
import '../index.css';
import initChessBoard from '../helpers/helper';
import FallenSoldierBlock from './fallen-soldier-block';
import Board from './board';
import King from '../pieces/king';
import Rook from '../pieces/rook';
import Pawn from '../pieces/pawn';
import Queen from '../pieces/queen';
import Knight from '../pieces/knight';
import Bishop from '../pieces/bishop';
import EvolvePicker from '../helpers/evolve-picker';

export default class Game extends Component {
    constructor(props) {
        super(props);
        const squares = initChessBoard();
        const [whitePieces, blackPieces] = this.populatePieces(squares);
        this.state = {
            squares: squares,
            curPlayer: 'white',
            sourceRow: -1,
            sourceCol: -1,
            status: '',
            whiteFallenSoldiers: [],
            blackFallenSoldiers: [],
            whitePieces: whitePieces,
            blackPieces: blackPieces,
            whiteKingPos: [7, 4],
            blackKingPos: [0, 4],
            checkMater: null,
        };
        this.handleClick = this.handleClick.bind(this);
        this.handleEvolve = this.handleEvolve.bind(this);
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
        return [whitePieces,blackPieces];
    }

    handleClick(i, j) {
        if (this.determineWinner()) {
            return;
        }
        const squares = this.state.squares.slice(); //make a copy
        let curPlayer = this.state.curPlayer;
        let sourceRow = this.state.sourceRow;
        let sourceCol = this.state.sourceCol;
        if (sourceRow === -1 && sourceCol === -1) {
            //no piece has been selected yet. you have to select your own piece and non-null piece
            if (!squares[i][j] || squares[i][j].player !== curPlayer) {
                this.setState({
                    status: 'Invalid selection. Can\'t select empty or not your own piece'
                });
            } else {
                this.highlight(squares[i][j], true);
                this.setState({
                    squares: squares,
                    sourceRow: i,
                    sourceCol: j,
                    status: 'Choose destination for the selected piece'
                })
            }
        } else { //another piece has been selected before
            if (this.isEvolvablePawn([sourceRow, sourceCol])) {
                //if the current selection is a pawn at the other end, it must be evolved
                this.setState({
                    status: 'Please select one of the drop down type to evolve',
                })
            } else {
                this.highlight(squares[sourceRow][sourceCol], false);
                if (squares[i][j] && squares[i][j].player === curPlayer) {
                    this.setState({
                        status: 'Wrong selection. Select empty or opponent\'s space. Choose again',
                        sourceRow: -1,
                        sourceCol: -1,
                    })
                } else {
                    const isDestEnemyOccupied = squares[i][j] ? true : false;
                    const isMovePossible = squares[sourceRow][sourceCol].isMovePossible([i, j], isDestEnemyOccupied);
                    const isPathEmpty = this.isPathEmpty(squares[sourceRow][sourceCol], [i, j]);
                    const kingInDanger = this.kingInDanger(squares[sourceRow][sourceCol],[i, j]);
                    if(!isMovePossible) {
                        this.setState({
                            status: 'Move is not possible. Please select again',
                            sourceRow: -1,
                            sourceCol: -1,
                        });
                    }
                    else if (!isPathEmpty) {
                        this.setState({
                            status: 'Path from source to dest is not empty. Please select again',
                            sourceRow: -1,
                            sourceCol: -1,
                        });
                    }
                    else if (kingInDanger) {
                        this.setState({
                            status: 'The move place king under checkmate position. Please select again',
                            sourceRow: -1,
                            sourceCol: -1,
                        });
                    }
                    else {
                        if (squares[sourceRow][sourceCol] instanceof King) {
                            if (Math.abs(j - sourceCol) === 2) {
                                /* king wants to enter castle
                                 * note that when checking for if move is possible or not for king
                                 * we already check that it has not been moved if |j-sourceCol|===2 */
                                this.handleEnterCastle(sourceRow, sourceCol, j);
                            } else { //normal move
                                this.movePiece(sourceRow, sourceCol, i, j, isDestEnemyOccupied);
                            }
                        } else { //other than king, other pieces move normally
                            this.movePiece(sourceRow, sourceCol, i, j, isDestEnemyOccupied);
                        }
                    }
                }
            }
        }
    }

    movePiece(srcRow, srcCol, destRow, destCol, isDestEnemyOccupied) {
        const squares = this.state.squares.slice();
        const whiteFallenSoldiers = this.state.whiteFallenSoldiers.slice();
        const blackFallenSoldiers = this.state.blackFallenSoldiers.slice();
        let curPlayer = this.state.curPlayer;
        const whitePieces = new Set(this.state.whitePieces);
        const blackPieces = new Set(this.state.blackPieces);
        let whiteKingPos = this.state.whiteKingPos;
        let blackKingPos = this.state.blackKingPos;
        if (isDestEnemyOccupied) {
            squares[destRow][destCol].clearMoves();
            if (curPlayer === 'white') {
                blackPieces.delete(squares[destRow][destCol]);
                blackFallenSoldiers.push(squares[destRow][destCol]);
            } else {
                whitePieces.delete(squares[destRow][destCol]);
                whiteFallenSoldiers.push(squares[destRow][destCol]);
            }
        }
        squares[destRow][destCol] = squares[srcRow][srcCol];
        squares[destRow][destCol].addMove([destRow, destCol]);
        squares[srcRow][srcCol] = null;

        if (squares[destRow][destCol] instanceof King) {
            if (curPlayer === 'white') {
                whiteKingPos = [destRow, destCol];
            } else {
                blackKingPos = [destRow, destCol];
            }
        }

        if (this.isEvolvablePawn([destRow, destCol])) {
            this.highlight(squares[destRow][destCol], true);
            this.setState({
                squares: squares,
                blackFallenSoldiers: blackFallenSoldiers,
                whiteFallenSoldiers: whiteFallenSoldiers,
                whitePieces: whitePieces,
                blackPieces: blackPieces,
                sourceRow: destRow,
                sourceCol: destCol,
                status: 'Please select one of the drop down type to evolve'
            })
        } else {
            //after moving, see if any piece checkmate the opponent king
            //we can't use the state's black or white pieces here because it is outdated
            let pieces = (curPlayer==='white' ? whitePieces : blackPieces);
            let checkMater = this.kingCheckMated(pieces);
            let status = checkMater ? 'Checkmated. Please resolve' : '';

            this.setState({
                squares: squares,
                blackFallenSoldiers: blackFallenSoldiers,
                whiteFallenSoldiers: whiteFallenSoldiers,
                whitePieces: whitePieces,
                blackPieces: blackPieces,
                whiteKingPos: whiteKingPos,
                blackKingPos: blackKingPos,
                sourceRow: -1,
                sourceCol: -1,
                status: status,
                curPlayer: curPlayer === 'white' ? 'black' : 'white',
                checkMater: checkMater,
            })
        }
    }

    /*
    * Check if the king is currently checkmated or the path is endangered
    * Then check if the other piece is a rook, has never moved and path is empty
    */
    handleEnterCastle(sourceRow, sourceCol, destCol) {
        const squares = this.state.squares.slice();
        const middleSpace = squares[sourceRow][sourceCol].getPathToDest([sourceRow, destCol])[0];
        if (squares[sourceRow][sourceCol] instanceof King) { //just to be sure
            if (squares[sourceRow][sourceCol].hasMoved()) {
                this.setState({
                    status: 'Cannot enter castle because king has been moved before. Select again',
                    sourceRow: -1,
                    sourceCol: -1,
                });
            }
            else if (this.state.checkMater) {
                this.setState({
                    status: 'Cannot enter castle because king is being checkmated. Select again',
                    sourceRow: -1,
                    sourceCol: -1,
                });
            }
            else if (this.kingInDanger(squares[sourceRow][sourceCol],middleSpace)) {
                this.setState({
                    status: 'Cannot enter castle because the middle space is endangered. Select again',
                    sourceRow: -1,
                    sourceCol: -1,
                });
            }
            else {
                const curPlayer = this.state.curPlayer;
                let whiteKingPos = this.state.whiteKingPos;
                let blackKingPos = this.state.blackKingPos;
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
                    if (!piece.hasMoved()) {
                        if (this.isPathEmpty(piece, [sourceRow, rookDestCol])) {
                            //move the king
                            squares[sourceRow][destCol] = squares[sourceRow][sourceCol];
                            squares[sourceRow][destCol].addMove([sourceRow, destCol]);
                            squares[sourceRow][sourceCol] = null;
                            curPlayer === 'white' ? whiteKingPos = [sourceRow, destCol] : blackKingPos = [sourceRow, destCol];

                            //move the rook
                            piece.addMove([sourceRow, rookDestCol]);
                            squares[sourceRow][rookDestCol] = piece;
                            squares[sourceRow][rookSourceCol] = null;

                            //check if any piece checkmate opponent king. For this case, we can safely use the state's
                            //black or white pieces because no pieces are added or deleted from the set by enter castle
                            let pieces = (curPlayer==='white' ? this.state.whitePieces : this.state.blackPieces);
                            let checkMater = this.kingCheckMated(pieces);
                            let status = checkMater ? 'Checkmated. Please resolve' : '';

                            this.setState({
                                squares: squares,
                                sourceRow: -1,
                                sourceCol: -1,
                                status: status,
                                whiteKingPos: whiteKingPos,
                                blackKingPos: blackKingPos,
                                curPlayer: curPlayer === 'white' ? 'black' : 'white',
                                checkMater: checkMater,
                            });
                        }
                        else {
                            this.setState({
                                status: 'Cannot enter castle because rook src->dest is not empty. Select again',
                                sourceRow: -1,
                                sourceCol: -1,
                            });
                        }
                    }
                    else {
                        this.setState({
                            status: 'Cannot enter castle because rook has been moved before. Select again',
                            sourceRow: -1,
                            sourceCol: -1,
                        });
                    }
                }
                else {
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
        const squares = this.state.squares.slice();
        let curPlayer = this.state.curPlayer;
        const whiteFallenSoldiers = this.state.whiteFallenSoldiers.slice();
        const blackFallenSoldiers = this.state.blackFallenSoldiers.slice();
        let sourceRow = this.state.sourceRow;
        let sourceCol = this.state.sourceCol;
        const whitePieces = new Set(this.state.whitePieces);
        const blackPieces = new Set(this.state.blackPieces);
        if (this.isEvolvablePawn([sourceRow, sourceCol])) {
            this.highlight(squares[sourceRow][sourceCol], false);
            squares[sourceRow][sourceCol].clearMoves();
            if (curPlayer === 'white') {
                whitePieces.delete(squares[sourceRow][sourceCol]);
                whiteFallenSoldiers.push(squares[sourceRow][sourceCol]);
            } else {
                blackPieces.delete(squares[sourceRow][sourceCol]);
                blackFallenSoldiers.push(squares[sourceRow][sourceCol]);
            }
            switch (type) {
                case 'queen':
                    squares[sourceRow][sourceCol] = new Queen(curPlayer, [sourceRow, sourceCol]);
                    break;
                case 'rook':
                    squares[sourceRow][sourceCol] = new Rook(curPlayer, [sourceRow, sourceCol]);
                    break;
                case 'knight':
                    squares[sourceRow][sourceCol] = new Knight(curPlayer, [sourceRow, sourceCol]);
                    break;
                case 'bishop':
                    squares[sourceRow][sourceCol] = new Bishop(curPlayer, [sourceRow, sourceCol]);
                    break;
                default:
                    break;
            }
            curPlayer==='white' ? whitePieces.add(squares[sourceRow][sourceCol]) :
                blackPieces.add(squares[sourceRow][sourceCol]);
            //check if the just evolved piece check mate the opponent's king
            let pieces = (curPlayer==='white' ? whitePieces : blackPieces);
            let checkMater = this.kingCheckMated(pieces);
            let status = checkMater ? 'Checkmated. Please resolve' : '';
            this.setState({
                squares: squares,
                whiteFallenSoldiers: whiteFallenSoldiers,
                blackFallenSoldiers: blackFallenSoldiers,
                whitePieces: whitePieces,
                blackPieces: blackPieces,
                sourceRow: -1,
                sourceCol: -1,
                status: status,
                curPlayer: curPlayer === 'white' ? 'black' : 'white',
                checkMater: checkMater,
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
    kingCheckMated(pieces) {
        const curPlayer = this.state.curPlayer;
        const oppKingPos = (curPlayer === 'white' ? this.state.blackKingPos : this.state.whiteKingPos);
        //const pieces = (curPlayer==='white' ? this.state.whitePieces : this.state.blackPieces);
        for (let piece of pieces) {
            if (piece.isMovePossible(oppKingPos,true) && this.isPathEmpty(piece,oppKingPos)) {
                return piece;
            }
        }
        return null;
    }

    /*
     * check if the piece is moved to destRow, destCol, will it cause a problem for the king
     * The piece can be the king, or something else
     */
    kingInDanger(piece,[destRow, destCol]) {
        const curPlayer = this.state.curPlayer;
        const enemies = curPlayer === 'white' ? this.state.blackPieces : this.state.whitePieces;
        const checkMater = this.state.checkMater; //may or may not be null
        if (piece instanceof King) {
            for (let enemy of enemies) {
                if (enemy.isMovePossible([destRow,destCol],true)) {
                    //isDestEnemyOccupied = true because after the king moves there, it becomes true.
                    if (checkMater && enemy===checkMater) {
                        return true;
                    }
                    else if (this.isPathEmpty(enemy,[destRow,destCol])) {
                        return true;
                    }
                }
            }
            return false;
        }
        else {
            const kingPos = curPlayer === 'white' ? this.state.whiteKingPos : this.state.blackKingPos;
            if (checkMater) { //king is being checkmated, so we need to put something in the check path or eat the checkmater
                const path = checkMater.getPathToDest(kingPos);
                path.push(checkMater.getCurrentPos());
                for (let space of path) {
                    if (destRow === space[0] && destCol === space[1]) { //the piece blocks the path or eat the checkmater
                        return false;
                    }
                }
                return true;
            }
            else {
                const squares = this.state.squares;
                for (let enemy of enemies) {
                    if (enemy.isMovePossible(kingPos,true)) {
                        let blockers=[];
                        let [enemyRow,enemyCol] = enemy.getCurrentPos();
                        for (let [row,col] of enemy.getPathToDest(kingPos)) {
                            if (squares[row][col]) {
                                blockers.push(squares[row][col]);
                            }
                        }
                        if (blockers.length===1 && blockers[0]===piece &&
                            !(enemyRow === destRow && enemyCol===destCol)) {
                            //only one blocker, it's the piece being moved, and does not eat the enemy
                            return true; //because then king is in danger
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
    isEvolvablePawn([row, col]) {
        const squares = this.state.squares.slice();
        const curPlayer = this.state.curPlayer;
        return (row !== -1 && col !== -1 && squares[row][col] instanceof Pawn
            && row === (curPlayer === 'white' ? 0 : 7));
    }

    /*
     * Check if the path from source to destination does not contain any piece
     */
    isPathEmpty(piece, [destRow, destCol]) {
        let path = piece.getPathToDest([destRow, destCol]);
        for (let space of path) {
            if (this.state.squares[space[0]][space[1]]) {
                return false;
            }
        }
        return true;
    }

    highlight(piece, shouldHighlight) {
        if (shouldHighlight) {
            piece.style = {...piece.style, backgroundColor: "RGB(111,143,114)"};
        } else {
            piece.style = {...piece.style, backgroundColor: ""};
        }
    }

    render() {
        let winner = this.determineWinner();
        let status = this.state.status;
        if (winner) {
            status='Winner: ' + winner;
            if (winner === 'Draw') {
                status = 'The game is draw';
            }
        }
        return (
            <div className="game">
                <Board squares={this.state.squares}
                       onClick={(i, j) => this.handleClick(i, j)}/>
                <div className="game-info">
                    <h3>Turn</h3>
                    <div id="player-turn-box"
                         style={{
                             backgroundColor:
                                 this.state.curPlayer === 'white' ? "#fff" : "#000"
                         }}/>
                    <EvolvePicker onSubmit={(type) => this.handleEvolve(type)}/>
                    <br/>
                    <div className="status">{status}</div>
                    <FallenSoldierBlock whiteFallenSoldiers={this.state.whiteFallenSoldiers}
                                        blackFallenSoldiers={this.state.blackFallenSoldiers}/>
                </div>
            </div>
        )
    }

    determineWinner() {
        let winner=null;
        const curPlayer = this.state.curPlayer;
        const checkMater = this.state.checkMater;
        let kingCanMove = this.kingCanStillMove();
        if (!kingCanMove) {
            if (checkMater) {
                if (!this.kingHaveBlockers()) {
                    winner = (curPlayer==='white' ? 'black' : 'white');
                }
            }
            else {
                if (!this.anotherMovePossible()) {
                    winner = 'Draw';
                }
            }
        }
        return winner;
    }

    kingCanStillMove() {
        const curPlayer = this.state.curPlayer;
        const squares = this.state.squares;
        const [kingRow,kingCol] = (curPlayer === 'white' ? this.state.whiteKingPos : this.state.blackKingPos);
        const king = squares[kingRow][kingCol];
        for (let [row,col] of king.getPossibleMoves()) {
            if (!(squares[row][col] && squares[row][col].player===curPlayer)
                && !this.kingInDanger(king,[row,col])) {
                return true;
            }
        }
        return false;
    }

    /*this method is only called when checkMater!==null
    * return whether exist a piece that can block the check path for king (king is currently checkmated)
    * and include the position of the checkmater as well, in case a piece can eat the checkmater
    * */
    kingHaveBlockers() {
        const curPlayer = this.state.curPlayer;
        const pieces = curPlayer==='white' ? this.state.whitePieces : this.state.blackPieces;
        const [kingRow,kingCol] = (curPlayer === 'white' ? this.state.whiteKingPos : this.state.blackKingPos);
        const checkMater = this.state.checkMater;
        let path = checkMater.getPathToDest([kingRow,kingCol]);
        let [checkRow,checkCol] = checkMater.getCurrentPos();
        for (let piece of pieces) { //iterate over all of current player's piece and possible moves
            if ((piece instanceof King) === false) { //we only iterate the pieces that are not king
                if (piece.isMovePossible([checkRow,checkCol],true) && this.isPathEmpty(piece,[checkRow,checkCol])) {
                    return true;
                }
                else {
                    for (let space of path) {
                        if (piece.isMovePossible(space,false)) { //false because no space on check path contains any piece
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    //call when king is not checkmated
    anotherMovePossible() {
        const curPlayer = this.state.curPlayer;
        const pieces = (curPlayer==='white' ? this.state.whitePieces : this.state.blackPieces);
        const squares = this.state.squares;
        for (let piece of pieces) {
            if (!(piece instanceof King)) {
                for (let [possRow,possCol] of piece.getPossibleMoves()) {
                    if (!(squares[possRow][possCol] && squares[possRow][possCol].player===curPlayer)
                        && this.isPathEmpty(piece,[possRow,possCol])) {
                        return true;
                    }
                }
                if (piece instanceof Pawn) {
                    for (let [tarRow,tarCol] of piece.getPossibleTargets()) {
                        if (squares[tarRow][tarCol] && squares[tarRow][tarCol].player !== curPlayer
                            && this.isPathEmpty(piece,[tarRow,tarCol])) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
}

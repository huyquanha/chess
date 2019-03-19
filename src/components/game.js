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
        this.state={
            squares: initChessBoard(),
            curPlayer:'white',
            sourceRow: -1,
            sourceCol: -1,
            status:'',
            whiteFallenSoldiers:[],
            blackFallenSoldiers:[],
        }
        this.handleClick=this.handleClick.bind(this);
        this.handleEvolve = this.handleEvolve.bind(this);
    }

    handleClick(i,j) {
        const squares = this.state.squares.slice(); //make a copy
        let curPlayer = this.state.curPlayer;
        let sourceRow=this.state.sourceRow;
        let sourceCol=this.state.sourceCol;
        if (sourceRow===-1 && sourceCol===-1) { //no piece has been selected yet. you have to select your own piece and non-null piece
            if (!squares[i][j] || squares[i][j].player !== curPlayer) {
                this.setState({
                    status:'Invalid selection. Can\'t select empty or not your own piece'
                });
            }
            else {
                this.highlight(squares[i][j],true);
                this.setState({
                    squares: squares,
                    sourceRow: i,
                    sourceCol: j,
                    status: 'Choose destination for the selected piece'
                })
            }
        }
        else { //another piece has been selected before
            if (this.isEvolvablePawn(sourceRow,sourceCol)) {
                //if the current selection is a pawn at the other end, it must be evolved
                this.setState({
                    status: 'Please select one of the drop down type to evolve',
                })
            }
            else {
                this.highlight(squares[sourceRow][sourceCol],false);
                if (squares[i][j] && squares[i][j].player===curPlayer) {
                    this.setState({
                        status: 'Wrong selection. Select source and destination again',
                        sourceRow: -1,
                        sourceCol: -1,
                    })
                }
                else {
                    const isDestEnemyOccupied=squares[i][j] ? true : false;
                    const isMovePossible = squares[sourceRow][sourceCol].isMovePossible([sourceRow,sourceCol],[i,j],
                        isDestEnemyOccupied);
                    const isPathEmpty = this.isPathEmpty([sourceRow,sourceCol],[i,j]);
                    if (isMovePossible && isPathEmpty) {
                        //king wants to enter castle and its move is possible
                        if (squares[sourceRow][sourceCol] instanceof King && Math.abs(j-sourceCol)===2) {
                            this.handleEnterCastle(sourceRow,sourceCol,j);
                        }
                        else {
                            const whiteFallenSoldiers = this.state.whiteFallenSoldiers.slice();
                            const blackFallenSoldiers = this.state.blackFallenSoldiers.slice();
                            if (isDestEnemyOccupied) {
                                squares[i][j].clearMoves();
                                if (curPlayer==='white') {
                                    blackFallenSoldiers.push(squares[i][j]);
                                }
                                else {
                                    whiteFallenSoldiers.push(squares[i][j]);
                                }
                            }
                            squares[i][j]=squares[sourceRow][sourceCol];
                            squares[i][j].addMove([i,j]);
                            squares[sourceRow][sourceCol]=null;
                            if (this.isEvolvablePawn(i,j)) {
                                this.highlight(squares[i][j],true);
                                this.setState({
                                    squares: squares,
                                    blackFallenSoldiers: blackFallenSoldiers,
                                    whiteFallenSoldiers: whiteFallenSoldiers,
                                    sourceRow:i,
                                    sourceCol:j,
                                    status: 'Please select one of the drop down type to evolve'
                                })
                            }
                            else {
                                this.setState({
                                    squares: squares,
                                    blackFallenSoldiers: blackFallenSoldiers,
                                    whiteFallenSoldiers: whiteFallenSoldiers,
                                    sourceRow:-1,
                                    sourceCol:-1,
                                    status:'',
                                    curPlayer: this.state.curPlayer==='white' ? 'black':'white'
                                })
                            }
                        }
                    }
                    else {
                        this.setState({
                            status: 'Invalid move. either move not possible or path not empty. Please select again',
                            sourceRow: -1,
                            sourceCol: -1
                        })
                    }
                }
            }
        }
    }

    handleEnterCastle(sourceRow, sourceCol,destCol) {
        const squares = this.state.squares.slice();
        let rookSourceCol,rookDestCol;
        if (destCol > sourceCol) {
            rookSourceCol = destCol+1;
            rookDestCol = destCol-1;
        }
        else {
            rookSourceCol = destCol -2;
            rookDestCol = destCol +1;
        }
        let piece = squares[sourceRow][rookSourceCol];
        if (piece instanceof Rook && !piece.hasMoved() &&
            this.isPathEmpty([sourceRow,rookSourceCol],[sourceRow,rookDestCol])) {
            //move the king
            squares[sourceRow][destCol]=squares[sourceRow][sourceCol];
            squares[sourceRow][destCol].addMove([sourceRow,destCol]);
            squares[sourceRow][sourceCol]=null;

            //move the rook
            piece.addMove([sourceRow,rookDestCol]);
            squares[sourceRow][rookDestCol]=piece;
            squares[sourceRow][rookSourceCol]=null;
            this.setState({
                squares: squares,
                sourceRow:-1,
                sourceCol:-1,
                status:'',
                curPlayer: this.state.curPlayer==='white' ? 'black':'white'
            })
        }
        else {
            this.setState({
                status: 'Enter castle is not possible. Select again',
                sourceRow: -1,
                sourceCol: -1,
            })
        }
    }

    isEvolvablePawn(row,col) {
        const squares = this.state.squares.slice();
        const curPlayer = this.state.curPlayer;
        if (row !== -1 && col !== -1 && squares[row][col] instanceof Pawn
            && row === (curPlayer === 'white' ? 0 : 7)) {
            return true;
        }
        return false;
    }

    handleEvolve(type) {
        const squares = this.state.squares.slice();
        let curPlayer = this.state.curPlayer;
        const whiteFallenSoldiers = this.state.whiteFallenSoldiers.slice();
        const blackFallenSoldiers = this.state.blackFallenSoldiers.slice();
        let sourceRow = this.state.sourceRow;
        let sourceCol = this.state.sourceCol;
        if (this.isEvolvablePawn(sourceRow,sourceCol)) {
            this.highlight(squares[sourceRow][sourceCol],false);
            squares[sourceRow][sourceCol].clearMoves();
            if (curPlayer==='white') {
                whiteFallenSoldiers.push(squares[sourceRow][sourceCol]);
            }
            else {
                blackFallenSoldiers.push(squares[sourceRow][sourceCol]);
            }
            switch(type) {
                case 'queen':
                    squares[sourceRow][sourceCol]=new Queen(curPlayer);
                    break;
                case 'rook':
                    squares[sourceRow][sourceCol]=new Rook(curPlayer);
                    break;
                case 'knight':
                    squares[sourceRow][sourceCol]=new Knight(curPlayer);
                    break;
                case 'bishop':
                    squares[sourceRow][sourceCol]=new Bishop(curPlayer);
                    break;
                default:
                    break;
            }
            this.setState({
                squares: squares,
                whiteFallenSoldiers: whiteFallenSoldiers,
                blackFallenSoldiers: blackFallenSoldiers,
                sourceRow:-1,
                sourceCol:-1,
                status:'',
                curPlayer: curPlayer==='white' ? 'black' : 'white',
            })
        }
        else {
            this.setState({
                status: 'Not the time to evolve right now',
            })
        }
    }

    isPathEmpty([sourceRow,sourceCol],[destRow,destCol]) {
        let piece=this.state.squares[sourceRow][sourceCol];
        let path = piece.getSrcToDestPath([sourceRow,sourceCol],[destRow,destCol]);
        for (let space of path) {
            if (this.state.squares[space[0]][space[1]]) {
                return false;
            }
        }
        return true;
    }

    highlight(piece,shouldHighlight) {
        if (shouldHighlight) {
            piece.style = {...piece.style,backgroundColor: "RGB(111,143,114)"};
        }
        else {
            piece.style = {...piece.style,backgroundColor: ""};
        }
    }

    render() {
        return (
            <div className="game">
                <Board squares={this.state.squares}
                       onClick={(i,j) => this.handleClick(i,j)}/>
                <div className="game-info">
                    <h3>Turn</h3>
                    <div id="player-turn-box"
                          style={{backgroundColor :
                              this.state.curPlayer==='white' ? "#fff" : "#000"
                          }}/>
                    <EvolvePicker onSubmit={(type) => this.handleEvolve(type)}/>
                    <br/>
                    <div className="status">{this.state.status}</div>
                    <FallenSoldierBlock whiteFallenSoldiers={this.state.whiteFallenSoldiers}
                                        blackFallenSoldiers={this.state.blackFallenSoldiers}/>
                </div>
            </div>
        )
    }
}

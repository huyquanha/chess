import React, {Component} from 'react';
import '../index.css';
import initChessBoard from '../helpers/helper';
import FallenSoldierBlock from './fallen-soldier-block';
import Board from './board';

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
                squares[i][j].style={...squares[i][j].style, backgroundColor: "RGB(111,143,114)"}; //change background of the selected piece
                this.setState({
                    squares: squares,
                    sourceRow: i,
                    sourceCol: j,
                    status: 'Choose destination for the selected piece'
                })
            }
        }
        else { //another piece has been selected before
            squares[sourceRow][sourceCol].style={...squares[sourceRow][sourceCol].style,backgroundColor:""};
            if (squares[i][j] && squares[i][j].player===curPlayer) {
                this.setState({
                    status: 'Wrong selection. Select source and destination again',
                    sourceRow: -1,
                    sourceCol: -1,
                })
            }
            else {
                const isDestEnemyOccupied=squares[i][j] ? true : false;
                const isMovePossible = squares[sourceRow][sourceCol].isMovePossible([sourceRow,sourceCol],[i,j],isDestEnemyOccupied);
                const isPathEmpty = this.isPathEmpty([sourceRow,sourceCol],[i,j]);
                console.log(isMovePossible);
                console.log(isPathEmpty);
                if (isMovePossible && isPathEmpty) {
                    const whiteFallenSoldiers = this.state.whiteFallenSoldiers.slice();
                    const blackFallenSoldiers = this.state.blackFallenSoldiers.slice();
                    if (isDestEnemyOccupied) {
                        if (curPlayer==='white') {
                            blackFallenSoldiers.push(squares[i][j]);
                        }
                        else {
                            whiteFallenSoldiers.push(squares[i][j]);
                        }
                    }
                    squares[i][j]=squares[sourceRow][sourceCol];
                    squares[sourceRow][sourceCol]=null;
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
                    <div className="status">{this.state.status}</div>
                    <FallenSoldierBlock whiteFallenSoldiers={this.state.whiteFallenSoldiers}
                                        blackFallenSoldiers={this.state.blackFallenSoldiers}/>
                </div>
            </div>
        )
    }
}

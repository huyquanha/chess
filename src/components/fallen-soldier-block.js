import React from 'react';
import '../index.css';
import Square from './square';

export default function FallenSoldierBlock(props) {
    let whiteFallenSoldiers = props.whiteFallenSoldiers;
    let blackFallenSoldiers = props.blackFallenSoldiers;

    return (
        <div className="fallen-soldier-block">
            <div className="board-row">
                {whiteFallenSoldiers.map((soldier,index)=> {
                    return <Square key={index} style={soldier.style}></Square>
                })}
            </div>
            <div className="board-row">
                {blackFallenSoldiers.map((soldier,index) => {
                    return <Square key={index} style={soldier.style}></Square>
                })}
            </div>
        </div>
    )
}
import React from 'react';

export default function MenuItem({ item, onClick, onDragStart }) {
  return (
    <button
      className="menu-item"
      onClick={onClick}
      draggable={!!onDragStart}
      onDragStart={onDragStart ? (e) => { e.dataTransfer.effectAllowed = 'copy'; onDragStart(item); } : undefined}
    >
      <span className="menu-item-name">{item.name}</span>
      <span className="menu-item-price">${item.price.toFixed(2)}</span>
    </button>
  );
}

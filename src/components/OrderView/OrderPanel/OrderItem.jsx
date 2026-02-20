import React from 'react';

export default function OrderItem({ item, onItemClick, onDragStart }) {
  return (
    <div
      className={`order-item ${item.status}`}
      draggable={!!onDragStart}
      onDragStart={onDragStart ? () => onDragStart(item) : undefined}
      onClick={(e) => { e.stopPropagation(); onItemClick(item); }}
    >
      <span className="item-name">{item.name}</span>
      {item.mods?.length > 0 && <span className="item-mods">{item.mods.join(', ')}</span>}
      {item.isComped && <span className="item-badge comp">COMP</span>}
      {item.selectedAddOns?.length > 0 ? (
        <div className="item-price-breakdown">
          <span className="addon-base-price">${item.basePrice.toFixed(2)}</span>
          {item.selectedAddOns.map(ao => (
            <span key={ao.name} className="addon-line">+ {ao.name} ${ao.price.toFixed(2)}</span>
          ))}
          <span className="item-price total-price">
            {item.isComped ? '$0.00' : `$${item.price.toFixed(2)}`}
          </span>
        </div>
      ) : (
        <span className="item-price">{item.isComped ? '$0.00' : `$${item.price.toFixed(2)}`}</span>
      )}
    </div>
  );
}

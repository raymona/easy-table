import React, { useState } from 'react';
import { groupItemsByCourse } from '../../../utils/orderHelpers';
import OrderItem from './OrderItem';

export default function SeatSection({ seatNum, items, activeSeat, onSeatClick, onDrop, onItemClick, onDragStart }) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={`seat-section ${activeSeat === seatNum ? 'active' : ''} ${isDragOver ? 'drop-target' : ''}`}
      onClick={onSeatClick}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { setIsDragOver(false); onDrop(e); }}
    >
      <div className="seat-header">Seat {seatNum}</div>
      {groupItemsByCourse(items).map(([course, courseItems]) => (
        <div key={course || 'none'} className="course-group">
          <div className="course-label">{course || 'No Course'}</div>
          {courseItems.map(item => (
            <OrderItem
              key={item.id}
              item={item}
              onItemClick={(item) => onItemClick(item, seatNum)}
              onDragStart={(item) => onDragStart(item, seatNum)}
            />
          ))}
        </div>
      ))}
      {items.length === 0 && <div className="empty-seat">Drop item here</div>}
    </div>
  );
}

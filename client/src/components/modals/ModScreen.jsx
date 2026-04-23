import React from 'react';
import { COOK_TEMPS, COURSES } from '../../data/menu';
import { usePOS, useUI, POS_ACTIONS } from '../../context';
import { generateId } from '../../utils/idGenerator';

const STATUS_NEW = 'new';
const MOD_PREFIXES = ['no', 'side', 'sub', 'extra', 'light'];

export default function ModScreen() {
  const { dispatch } = usePOS();
  const {
    showModScreen, setShowModScreen,
    pendingItem, setPendingItem,
    editingItem, setEditingItem,
    itemQuantity, setItemQuantity,
    itemCookTemp, setItemCookTemp,
    itemCourse, setItemCourse,
    itemAddOns, setItemAddOns,
    itemModLines, setItemModLines,
    itemAllergyLines, setItemAllergyLines,
    itemNoteLines, setItemNoteLines,
    itemTiming, setItemTiming,
    activeTable, activeTab, activeSeat,
  } = useUI();

  if (!showModScreen || !pendingItem) return null;

  const close = () => { setShowModScreen(false); setEditingItem(null); };

  const confirmModScreen = () => {
    const mods = [];
    if (itemCookTemp) mods.push(itemCookTemp);
    if (itemAddOns.length) mods.push(...itemAddOns.map(a => a.name));
    const addOnPrice = itemAddOns.reduce((sum, a) => sum + a.price, 0);
    itemModLines.forEach(line => {
      if (line.prefix && line.value.trim()) mods.push(`${line.prefix} ${line.value.trim()}`);
    });
    const allergies = itemAllergyLines.filter(a => a.trim()).join(', ');
    if (allergies) mods.push(`ALLERGY: ${allergies}`);
    if (itemTiming) mods.push(itemTiming.toUpperCase());
    const notes = itemNoteLines.filter(n => n.trim()).join('; ');
    if (notes) mods.push(`Note: ${notes}`);

    const finalPrice = pendingItem.price + addOnPrice;

    if (editingItem) {
      const { item: oldItem, seatNum } = editingItem;
      const updatedItem = {
        ...pendingItem,
        id: oldItem.id,
        price: finalPrice,
        basePrice: pendingItem.price,
        selectedAddOns: itemAddOns,
        quantity: 1,
        mods,
        course: itemCourse,
        status: oldItem.status,
        addedAt: oldItem.addedAt,
      };
      const extraItems = [];
      for (let i = 1; i < itemQuantity; i++) {
        extraItems.push({ ...pendingItem, id: generateId(), price: finalPrice, basePrice: pendingItem.price, selectedAddOns: itemAddOns, quantity: 1, mods, course: itemCourse, status: oldItem.status, addedAt: Date.now() });
      }
      dispatch({ type: POS_ACTIONS.UPDATE_ITEM, tableId: activeTable, tabId: activeTab, seatNum, itemId: oldItem.id, updatedItem, extraItems });
      setEditingItem(null);
    } else {
      for (let i = 0; i < itemQuantity; i++) {
        dispatch({
          type: POS_ACTIONS.ADD_ITEM,
          tableId: activeTable,
          tabId: activeTab,
          seatNum: activeSeat,
          item: { ...pendingItem, id: generateId(), price: finalPrice, basePrice: pendingItem.price, selectedAddOns: itemAddOns, quantity: 1, mods, course: itemCourse, status: STATUS_NEW, addedAt: Date.now() },
        });
      }
    }
    setShowModScreen(false);
    setPendingItem(null);
  };

  const confirmLabel = editingItem
    ? (itemQuantity > 1 ? `Save + Add ${itemQuantity - 1} more` : 'Save')
    : (itemQuantity > 1 ? `Add (${itemQuantity})` : 'Add');

  return (
    <div className="modal-overlay">
      <div className="modal mod-screen-modal wide">
        <button className="modal-close" onClick={close}>×</button>
        <h2>{pendingItem.name}</h2>
        <div className="mod-screen-content">
          <div className="mod-section">
            <label>Quantity</label>
            <div className="quantity-picker">
              <button onClick={() => setItemQuantity(q => Math.max(1, q - 1))}>−</button>
              <input
                type="number"
                className="quantity-input"
                value={itemQuantity}
                onChange={e => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
              />
              <button onClick={() => setItemQuantity(q => q + 1)}>+</button>
            </div>
          </div>

          {pendingItem.hasCookTemp && (
            <div className="mod-section">
              <label>Temperature</label>
              <div className="temp-options">
                {COOK_TEMPS.map(temp => (
                  <button key={temp} className={itemCookTemp === temp ? 'active' : ''} onClick={() => setItemCookTemp(temp)}>{temp}</button>
                ))}
              </div>
            </div>
          )}

          <div className="mod-section">
            <label>Course</label>
            <div className="course-options">
              {COURSES.map(course => (
                <button key={course || 'none'} className={itemCourse === course ? 'active' : ''} onClick={() => setItemCourse(course)}>
                  {course || 'No Course'}
                </button>
              ))}
            </div>
          </div>

          {pendingItem.addOns?.length > 0 && (
            <div className="mod-section">
              <label>Add-ons</label>
              <div className="addon-options">
                {pendingItem.addOns.map(addon => {
                  const selected = itemAddOns.some(a => a.name === addon.name);
                  return (
                    <button
                      key={addon.name}
                      className={selected ? 'active' : ''}
                      onClick={() => setItemAddOns(prev =>
                        selected ? prev.filter(a => a.name !== addon.name) : [...prev, addon]
                      )}
                    >
                      {addon.name}
                      {addon.price > 0 && <span className="addon-price"> +${addon.price.toFixed(2)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mod-section">
            <label>Timing</label>
            <div className="timing-options">
              <button className={itemTiming === '' ? 'active' : ''} onClick={() => setItemTiming('')}>Normal</button>
              <button className={itemTiming === 'hold' ? 'active' : ''} onClick={() => setItemTiming('hold')}>Hold</button>
              <button className={itemTiming === 'rush' ? 'active' : ''} onClick={() => setItemTiming('rush')}>Rush</button>
            </div>
          </div>

          <div className="mod-section">
            <label>
              Modifications{' '}
              <button className="add-line-btn" onClick={() => setItemModLines(prev => [...prev, { prefix: '', value: '' }])}>+ Add</button>
            </label>
            {itemModLines.map((line, idx) => (
              <div key={idx} className="mod-line">
                <select
                  value={line.prefix}
                  onChange={e => setItemModLines(prev => prev.map((l, i) => i === idx ? { ...l, prefix: e.target.value } : l))}
                >
                  <option value="">Select...</option>
                  {MOD_PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="e.g., onions, fries..."
                  value={line.value}
                  onChange={e => setItemModLines(prev => prev.map((l, i) => i === idx ? { ...l, value: e.target.value } : l))}
                />
                {itemModLines.length > 1 && (
                  <button className="remove-line-btn" onClick={() => setItemModLines(prev => prev.filter((_, i) => i !== idx))}>×</button>
                )}
              </div>
            ))}
          </div>

          <div className="mod-section">
            <label>
              Allergies{' '}
              <button className="add-line-btn" onClick={() => setItemAllergyLines(prev => [...prev, ''])}>+ Add</button>
            </label>
            {itemAllergyLines.map((allergy, idx) => (
              <div key={idx} className="allergy-line">
                <input
                  type="text"
                  placeholder="e.g., gluten, dairy, nuts..."
                  value={allergy}
                  onChange={e => setItemAllergyLines(prev => prev.map((a, i) => i === idx ? e.target.value : a))}
                />
                {itemAllergyLines.length > 1 && (
                  <button className="remove-line-btn" onClick={() => setItemAllergyLines(prev => prev.filter((_, i) => i !== idx))}>×</button>
                )}
              </div>
            ))}
          </div>

          <div className="mod-section">
            <label>
              Kitchen Note{' '}
              <button className="add-line-btn" onClick={() => setItemNoteLines(prev => [...prev, ''])}>+ Add</button>
            </label>
            {itemNoteLines.map((note, idx) => (
              <div key={idx} className="note-line">
                <input
                  type="text"
                  placeholder="Note for kitchen..."
                  value={note}
                  onChange={e => setItemNoteLines(prev => prev.map((n, i) => i === idx ? e.target.value : n))}
                />
                {itemNoteLines.length > 1 && (
                  <button className="remove-line-btn" onClick={() => setItemNoteLines(prev => prev.filter((_, i) => i !== idx))}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={close}>Cancel</button>
          <button className="confirm-btn" onClick={confirmModScreen}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

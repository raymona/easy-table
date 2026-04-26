import React, { useState } from 'react';
import { MENU } from '../../../data/menu';
import { usePOS, useUI } from '../../../context';
import { usePOSActions } from '../../../hooks/usePOSActions';

/** Convert static MENU to flat category array for the editor */
function staticMenuToCategories() {
  const cats = [];
  for (const [daypart, dpCats] of Object.entries(MENU)) {
    for (const [key, cat] of Object.entries(dpCats)) {
      cats.push({
        id: `static-${key}-${daypart}`,
        key,
        label: cat.label,
        daypart,
        items: cat.items.map((item, idx) => ({
          id: `static-${item.id}-${daypart}`,
          name: item.name,
          price: item.price,
          needsModScreen: item.needsModScreen || false,
          hasCookTemp: item.hasCookTemp || false,
          addOns: item.addOns ? item.addOns.map(a => ({ ...a })) : [],
          sortOrder: idx,
        })),
      });
    }
  }
  // Sort: lunch first, then dinner, alphabetically by key within each
  cats.sort((a, b) => a.daypart.localeCompare(b.daypart) || a.key.localeCompare(b.key));
  return cats;
}

function generateKey(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'new';
}

export default function MenuSection() {
  const { state } = usePOS();
  const actions = usePOSActions();
  const { showToast } = useUI();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState(() => {
    if (state.menu && state.menu.length > 0) {
      return JSON.parse(JSON.stringify(state.menu));
    }
    return staticMenuToCategories();
  });
  const [selectedCatIdx, setSelectedCatIdx] = useState(0);
  const [expandedItem, setExpandedItem] = useState(null);

  // ── Category CRUD ───────────────────────────────────────────────────────
  const addCategory = () => {
    setCategories(prev => [...prev, {
      id: `new-${Date.now()}`,
      key: '',
      label: '',
      daypart: 'all',
      items: [],
    }]);
    setSelectedCatIdx(categories.length);
  };

  const updateCategory = (idx, field, value) => {
    setCategories(prev => prev.map((cat, i) => {
      if (i !== idx) return cat;
      const updated = { ...cat, [field]: value };
      if (field === 'label') updated.key = generateKey(value);
      return updated;
    }));
  };

  const deleteCategory = (idx) => {
    setCategories(prev => prev.filter((_, i) => i !== idx));
    if (selectedCatIdx >= categories.length - 1) {
      setSelectedCatIdx(Math.max(0, categories.length - 2));
    }
  };

  // ── Item CRUD ──────────────────────────────────────────────────────────
  const addItem = () => {
    setCategories(prev => prev.map((cat, i) => {
      if (i !== selectedCatIdx) return cat;
      return {
        ...cat,
        items: [...cat.items, {
          id: `new-${Date.now()}`,
          name: '',
          price: 0,
          needsModScreen: false,
          hasCookTemp: false,
          addOns: [],
          sortOrder: cat.items.length,
        }],
      };
    }));
  };

  const updateItem = (catIdx, itemIdx, field, value) => {
    setCategories(prev => prev.map((cat, ci) => {
      if (ci !== catIdx) return cat;
      return {
        ...cat,
        items: cat.items.map((item, ii) =>
          ii === itemIdx ? { ...item, [field]: value } : item
        ),
      };
    }));
  };

  const deleteItem = (catIdx, itemIdx) => {
    setCategories(prev => prev.map((cat, ci) => {
      if (ci !== catIdx) return cat;
      return { ...cat, items: cat.items.filter((_, ii) => ii !== itemIdx) };
    }));
    setExpandedItem(null);
  };

  // ── Add-on CRUD ────────────────────────────────────────────────────────
  const addAddOn = (catIdx, itemIdx) => {
    setCategories(prev => prev.map((cat, ci) => {
      if (ci !== catIdx) return cat;
      return {
        ...cat,
        items: cat.items.map((item, ii) => {
          if (ii !== itemIdx) return item;
          return { ...item, addOns: [...(item.addOns || []), { name: '', price: 0 }] };
        }),
      };
    }));
  };

  const updateAddOn = (catIdx, itemIdx, addOnIdx, field, value) => {
    setCategories(prev => prev.map((cat, ci) => {
      if (ci !== catIdx) return cat;
      return {
        ...cat,
        items: cat.items.map((item, ii) => {
          if (ii !== itemIdx) return item;
          return {
            ...item,
            addOns: item.addOns.map((a, ai) =>
              ai === addOnIdx ? { ...a, [field]: value } : a
            ),
          };
        }),
      };
    }));
  };

  const deleteAddOn = (catIdx, itemIdx, addOnIdx) => {
    setCategories(prev => prev.map((cat, ci) => {
      if (ci !== catIdx) return cat;
      return {
        ...cat,
        items: cat.items.map((item, ii) => {
          if (ii !== itemIdx) return item;
          return { ...item, addOns: item.addOns.filter((_, ai) => ai !== addOnIdx) };
        }),
      };
    }));
  };

  // ── Save ────────────────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true);
    try {
      await actions.syncMenu(categories);
      showToast('Menu saved', 'success');
    } catch (err) {
      showToast(err.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedCat = categories[selectedCatIdx];

  const daypartLabel = (dp) =>
    dp === 'all' ? 'All' : dp === 'lunch' ? 'L' : 'D';

  return (
    <div className="menu-editor">
      <h3>Menu Editor</h3>
      <div className="menu-editor-layout">
        {/* ── Category list ── */}
        <div className="menu-editor-cats">
          {categories.map((cat, idx) => (
            <div
              key={cat.id || idx}
              className={`menu-editor-cat-row${idx === selectedCatIdx ? ' selected' : ''}`}
              onClick={() => setSelectedCatIdx(idx)}
            >
              <input
                type="text"
                placeholder="Category name"
                value={cat.label}
                onChange={e => { e.stopPropagation(); updateCategory(idx, 'label', e.target.value); }}
                onClick={e => e.stopPropagation()}
              />
              <select
                value={cat.daypart}
                onChange={e => { e.stopPropagation(); updateCategory(idx, 'daypart', e.target.value); }}
                onClick={e => e.stopPropagation()}
              >
                <option value="all">All</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
              <span className="menu-editor-cat-count" title="Items">{(cat.items || []).length}</span>
              <button
                className="menu-editor-delete-btn"
                onClick={e => { e.stopPropagation(); deleteCategory(idx); }}
                title="Delete category"
              >&times;</button>
            </div>
          ))}
          <button className="menu-editor-add-btn" onClick={addCategory}>+ Add Category</button>
        </div>

        {/* ── Item editor ── */}
        <div className="menu-editor-items">
          {selectedCat ? (
            <>
              <h4>{selectedCat.label || 'Untitled Category'} <span className="menu-editor-daypart-badge">{daypartLabel(selectedCat.daypart)}</span></h4>
              <div className="menu-editor-items-list">
                {(selectedCat.items || []).map((item, itemIdx) => {
                  const itemKey = `${selectedCatIdx}-${itemIdx}`;
                  return (
                    <div key={item.id || itemIdx} className="menu-editor-item-row">
                      <div className="menu-editor-item-main">
                        <input
                          type="text"
                          placeholder="Item name"
                          value={item.name}
                          onChange={e => updateItem(selectedCatIdx, itemIdx, 'name', e.target.value)}
                          className="menu-editor-item-name"
                        />
                        <span className="menu-editor-price-wrapper">
                          $<input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price}
                            onChange={e => updateItem(selectedCatIdx, itemIdx, 'price', parseFloat(e.target.value) || 0)}
                            className="menu-editor-item-price"
                          />
                        </span>
                        <label className="menu-editor-toggle" title="Opens modification screen">
                          <input
                            type="checkbox"
                            checked={item.needsModScreen}
                            onChange={e => updateItem(selectedCatIdx, itemIdx, 'needsModScreen', e.target.checked)}
                          /> Mods
                        </label>
                        <label className="menu-editor-toggle" title="Cook temperature selector">
                          <input
                            type="checkbox"
                            checked={item.hasCookTemp}
                            onChange={e => updateItem(selectedCatIdx, itemIdx, 'hasCookTemp', e.target.checked)}
                          /> Temp
                        </label>
                        <button
                          className={`menu-editor-addons-toggle${(item.addOns || []).length ? ' has-addons' : ''}`}
                          onClick={() => setExpandedItem(expandedItem === itemKey ? null : itemKey)}
                          title="Edit add-ons"
                        >
                          Add-ons ({(item.addOns || []).length})
                        </button>
                        <button
                          className="menu-editor-delete-btn"
                          onClick={() => deleteItem(selectedCatIdx, itemIdx)}
                          title="Delete item"
                        >&times;</button>
                      </div>
                      {expandedItem === itemKey && (
                        <div className="menu-editor-addons">
                          {(item.addOns || []).map((addOn, aIdx) => (
                            <div key={aIdx} className="menu-editor-addon-row">
                              <input
                                type="text"
                                placeholder="Add-on name"
                                value={addOn.name}
                                onChange={e => updateAddOn(selectedCatIdx, itemIdx, aIdx, 'name', e.target.value)}
                              />
                              <span className="menu-editor-price-wrapper">
                                $<input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={addOn.price}
                                  onChange={e => updateAddOn(selectedCatIdx, itemIdx, aIdx, 'price', parseFloat(e.target.value) || 0)}
                                  className="menu-editor-addon-price"
                                />
                              </span>
                              <button
                                className="menu-editor-delete-btn"
                                onClick={() => deleteAddOn(selectedCatIdx, itemIdx, aIdx)}
                              >&times;</button>
                            </div>
                          ))}
                          <button className="menu-editor-add-btn small" onClick={() => addAddOn(selectedCatIdx, itemIdx)}>+ Add-on</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button className="menu-editor-add-btn" onClick={addItem}>+ Add Item</button>
            </>
          ) : (
            <p style={{ color: 'var(--text-dim)' }}>Select or create a category to edit items.</p>
          )}
        </div>
      </div>
      <div className="modal-actions">
        <button className="confirm-btn" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Menu'}
        </button>
      </div>
    </div>
  );
}

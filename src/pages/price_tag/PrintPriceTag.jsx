import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Printer,
  CheckSquare,
  Square,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const PrintPriceTag = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [printList, setPrintList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const data = await apiFetch('/api/products');

      if (Array.isArray(data)) {
        setAllProducts(data);
      } else {
        setAllProducts([]);
        toast.error("Mahsulotlar formati noto'g'ri keldi");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Server bilan aloqa yo'q!");
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [fetchData]);

  const handleSearchChange = (type, value) => {
    if (type === 'id') {
      setSearchId(value);
      setSearchName('');

      const cleanValue = value.trim();

      if (cleanValue) {
        setFilteredSuggestions(
          allProducts.filter(
            (p) => p.customId != null && String(p.customId).includes(cleanValue)
          )
        );
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setSearchName(value);
      setSearchId('');

      const cleanValue = value.trim().toLowerCase();

      if (cleanValue) {
        setFilteredSuggestions(
          allProducts.filter((p) => (p.name || '').toLowerCase().includes(cleanValue))
        );
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }
  };

  const handleSelectProduct = (product) => {
    if (printList.some((item) => item.id === product.id)) {
      toast.error("Bu tovar ro'yxatga allaqachon qo'shilgan!");
      setShowSuggestions(false);
      setSearchId('');
      setSearchName('');
      return;
    }

    const newItem = {
      ...product,
      discountPrice: Number(product.salePrice) || 0,
      copies: 1,
      isChecked: true
    };

    setPrintList((prev) => [...prev, newItem]);
    setSearchId('');
    setSearchName('');
    setShowSuggestions(false);
    toast.success("Ro'yxatga qo'shildi!");
  };

  const handleAddEnter = () => {
    if (filteredSuggestions.length === 1) {
      handleSelectProduct(filteredSuggestions[0]);
    } else if (filteredSuggestions.length > 1) {
      toast.error("Bir nechta tovar topildi. Iltimos, ro'yxatdan kerakligini tanlang.");
    } else {
      toast.error("Tovar topilmadi!");
    }
  };

  const updateItem = (id, field, value) => {
    setPrintList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const toggleCheck = (id) => {
    setPrintList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  };

  const toggleAll = () => {
    const allChecked = printList.length > 0 && printList.every((item) => item.isChecked);
    setPrintList((prev) => prev.map((item) => ({ ...item, isChecked: !allChecked })));
  };

  const removeChecked = () => {
    setPrintList((prev) => prev.filter((item) => !item.isChecked));
  };

  const clearAll = () => {
    setPrintList([]);
  };

  const handlePrint = () => {
    const itemsToPrint = printList.filter((i) => i.isChecked);

    if (itemsToPrint.length === 0) {
      return toast.error("Chop etish uchun tovar tanlanmagan!");
    }

    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      return toast.error(
        "Brauzer yangi oyna ochishga ruxsat bermadi. Iltimos, popup'larni yoqing!"
      );
    }

    const content = itemsToPrint
      .map((item) => {
        let itemsHtml = '';

        for (let i = 0; i < (Number(item.copies) || 1); i++) {
          const safeName = String(item.name || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

          itemsHtml += `
            <div class="label-card">
              <div class="brand">IPHONE HOUSE</div>

              <div class="product-name">
                ${safeName}
              </div>

              <div class="divider"></div>

              <div class="price-block">
                <div class="price-label">Narxi:</div>
                <div class="price-value">${Number(item.discountPrice || 0).toLocaleString('uz-UZ')} so'm</div>
              </div>
            </div>
          `;
        }

        return itemsHtml;
      })
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Narx Yorliqlari</title>
          <style>
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            html, body {
              margin: 0;
              padding: 0;
              background: #fff;
              font-family: Arial, Helvetica, sans-serif;
            }

            @page {
              size: 58mm 40mm;
              margin: 0;
            }

            body {
              width: 58mm;
              min-height: 40mm;
              padding: 2mm;
              display: flex;
              flex-wrap: wrap;
              gap: 0;
            }

            .label-card {
              width: 54mm;
              height: 36mm;
              border: 1px solid #cfcfcf;
              border-radius: 3.2mm;
              background: #fff;
              padding: 2.4mm 2.8mm 2.4mm 2.8mm;
              overflow: hidden;
              page-break-inside: avoid;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
            }

            .brand {
              text-align: center;
              font-size: 3.8mm;
              line-height: 1;
              font-weight: 900;
              letter-spacing: 0.15mm;
              color: #111827;
              text-transform: uppercase;
              margin-bottom: 1.5mm;
            }

            .product-name {
              text-align: center;
              font-size: 2.2mm;
              line-height: 1.18;
              font-weight: 700;
              color: #374151;
              min-height: 8.5mm;
              max-height: 8.5mm;
              overflow: hidden;
              word-break: break-word;
              display: flex;
              align-items: center;
              justify-content: center;
              text-transform: uppercase;
              padding: 0 1mm;
            }

            .divider {
              width: 100%;
              height: 0;
              border-top: 0.4mm solid #8f8f8f;
              margin: 1.4mm 0 1.8mm 0;
            }

            .price-block {
              text-align: center;
              margin-top: 0.3mm;
              display: flex;
              flex-direction: column;
              justify-content: center;
              flex: 1;
            }

            .price-label {
              font-size: 2.3mm;
              line-height: 1;
              font-weight: 700;
              color: #6b7280;
              margin-bottom: 1mm;
            }

            .price-value {
              font-size: 3.9mm;
              line-height: 1.08;
              font-weight: 900;
              color: #111827;
              word-break: break-word;
              padding: 0 1mm;
            }

            @media screen {
              body {
                background: #f3f4f6;
                min-height: 100vh;
                align-items: flex-start;
                justify-content: flex-start;
                padding: 10mm;
                gap: 4mm;
              }

              .label-card {
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
              }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const checkedCount = printList.filter((i) => i.isChecked).length;

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col relative animate-in fade-in duration-300">
      <h1 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">
        Narx yorlig'ini chop etish
      </h1>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-4 search-container relative z-40">
        <div className="flex gap-4 items-end">
          <div className="w-48 relative">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Tovar ID
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                disabled={loading}
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-slate-700 disabled:opacity-50"
                value={searchId}
                onChange={(e) => handleSearchChange('id', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddEnter()}
                placeholder="Kodni yozing..."
              />
            </div>
          </div>

          <div className="flex-1 relative">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Tovar nomi
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                disabled={loading}
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-slate-700 disabled:opacity-50"
                value={searchName}
                onChange={(e) => handleSearchChange('name', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddEnter()}
                placeholder="Nomini kiriting..."
              />
            </div>
          </div>

          <button
            disabled={loading}
            onClick={handleAddEnter}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50"
          >
            <Plus size={18} strokeWidth={3} /> Qo'shish
          </button>
        </div>

        {showSuggestions && filteredSuggestions.length > 0 && (
          <ul className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50 divide-y divide-slate-50 custom-scrollbar">
            {filteredSuggestions.map((p) => (
              <li
                key={p.id}
                onClick={() => handleSelectProduct(p)}
                className="p-4 hover:bg-blue-50/50 cursor-pointer flex justify-between items-center transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-100 px-3 py-1 rounded-lg tracking-widest">
                    #{p.customId ?? '-'}
                  </span>
                  <span className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                    {p.name}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-black text-emerald-600 block text-base">
                    {Number(p.salePrice || 0).toLocaleString()}&nbsp;
                    <span className="text-[10px]">{p.saleCurrency || 'UZS'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Omborda: {Number(p.quantity || 0)} {p.unit}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {showSuggestions &&
          filteredSuggestions.length === 0 &&
          searchName.trim().length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-6 text-center text-slate-400 font-bold z-50">
              Bunday tovar topilmadi.
            </div>
          )}
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col z-10 min-h-0">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest sticky top-0 z-10 border-b border-slate-100">
              <tr>
                <th
                  className="p-4 w-12 text-center cursor-pointer hover:text-blue-500 transition-colors"
                  onClick={toggleAll}
                >
                  {printList.length > 0 && printList.every((i) => i.isChecked) ? (
                    <CheckSquare size={18} className="text-blue-600 mx-auto" />
                  ) : (
                    <Square size={18} className="mx-auto" />
                  )}
                </th>
                <th className="p-4 w-24 text-center">ID</th>
                <th className="p-4">Nomi</th>
                <th className="p-4 w-44 text-right">Narxi</th>
                <th className="p-4 w-28 text-center">Nusxa</th>
                <th className="p-4 text-center w-16">Amal</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center text-slate-400">
                    <Loader2 className="animate-spin mx-auto" size={32} />
                  </td>
                </tr>
              ) : printList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center text-slate-400">
                    <Printer size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium text-sm">
                      Ro'yxat bo'sh. Qidiruv orqali tovar qo'shing.
                    </p>
                  </td>
                </tr>
              ) : (
                printList.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      item.isChecked ? 'bg-blue-50/30' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td
                      className="p-4 text-center cursor-pointer"
                      onClick={() => toggleCheck(item.id)}
                    >
                      {item.isChecked ? (
                        <CheckSquare size={18} className="text-blue-600 mx-auto" />
                      ) : (
                        <Square size={18} className="text-slate-300 mx-auto" />
                      )}
                    </td>

                    <td className="p-4 text-center font-mono text-slate-400">
                      #{item.customId ?? '-'}
                    </td>

                    <td className="p-4 text-slate-800 whitespace-normal break-words max-w-[320px]">
                      {item.name}
                    </td>

                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-right font-black outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                        value={item.discountPrice}
                        onChange={(e) =>
                          updateItem(item.id, 'discountPrice', Number(e.target.value))
                        }
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-center font-black outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                        value={item.copies}
                        onChange={(e) =>
                          updateItem(item.id, 'copies', Number(e.target.value))
                        }
                      />
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() =>
                          setPrintList(printList.filter((i) => i.id !== item.id))
                        }
                        className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50/80 flex justify-between items-center z-20">
          <div className="flex gap-3">
            <button
              disabled={checkedCount === 0}
              onClick={removeChecked}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              O'chirish ({checkedCount})
            </button>

            <button
              disabled={printList.length === 0}
              onClick={clearAll}
              className="px-6 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold hover:bg-rose-50 transition-colors disabled:opacity-50"
            >
              Barchasini tozalash
            </button>
          </div>

          <div className="flex gap-4 items-center">
            <button
              onClick={handlePrint}
              disabled={checkedCount === 0}
              className={`px-8 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg transition-all ${
                checkedCount > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Printer size={20} strokeWidth={2.5} /> Chop etish ({checkedCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPriceTag;
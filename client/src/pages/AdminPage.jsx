import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataGrid, renderTextEditor } from 'react-data-grid';
import axios from 'axios';
import { Plus, Trash2, Download, Upload, Search, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import 'react-data-grid/lib/styles.css';

export default function AdminPage() {
    const [rows, setRows] = useState([]);
    const [filters, setFilters] = useState({ item: '', brand: '' });
    const [status, setStatus] = useState({ type: '', message: '' });
    const navigate = useNavigate();

    const fetchRows = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/prices');
            setRows(res.data);
        } catch (error) {
            console.error("Failed to fetch rows", error);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) navigate('/login');
        fetchRows();
    }, [navigate]);

    const showStatus = (type, message) => {
        setStatus({ type, message });
        setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    };

    const handleRowsChange = async (newRows, { indexes, column }) => {
        for (const index of indexes) {
            const row = newRows[index];
            try {
                if (row.id) {
                    await axios.post('http://localhost:3000/api/update', {
                        id: row.id,
                        item_name: row.item_name,
                        brand_name: row.brand_name,
                        price: Number(row.price)
                    });
                }
            } catch (err) {
                if (err.response && err.response.status === 409) {
                    showStatus('error', 'Item & Brand must be unique');
                    fetchRows(); // Reset grid
                    return;
                }
                showStatus('error', 'Update failed');
            }
        }
        setRows(newRows);
        showStatus('success', 'Changes saved');
    };

    const addRow = async () => {
        const newItem = { item_name: 'New Item name', brand_name: 'New Brand', price: 0 };
        try {
            const res = await axios.post('http://localhost:3000/api/products', newItem);
            setRows([...rows, res.data]);
            showStatus('success', 'Row added. Click cells to edit.');
        } catch (err) {
            showStatus('error', 'Add row failed');
        }
    };

    const deleteRow = async (id) => {
        if (!confirm('Delete this row?')) return;
        try {
            await axios.delete(`http://localhost:3000/api/products/${id}`);
            setRows(rows.filter(r => r.id !== id));
            showStatus('success', 'Deleted');
        } catch (err) {
            showStatus('error', 'Delete failed');
        }
    };

    const exportCSV = () => {
        const headers = 'Item,Brand,Price\n';
        const content = rows.map(r => `${r.item_name},${r.brand_name},${r.price}`).join('\n');
        const blob = new Blob([headers + content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prices_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleBulkPaste = async () => {
        const text = await navigator.clipboard.readText();
        const lines = text.split('\n').filter(l => l.trim());
        const data = lines.map(line => {
            const [item_name, brand_name, price] = line.split(/[,\t]/).map(s => s?.trim());
            if (!item_name || !brand_name || isNaN(Number(price))) return null;
            return { item_name, brand_name, price: Number(price) };
        }).filter(Boolean);

        if (data.length === 0) return alert('Invalid clipboard data');

        try {
            await axios.post('http://localhost:3000/api/products/bulk', data);
            fetchRows();
            showStatus('success', `Imported ${data.length} rows`);
        } catch (err) {
            showStatus('error', 'Bulk import failed');
        }
    };

    const filteredRows = useMemo(() => {
        return rows.filter(r =>
            r.item_name.toLowerCase().includes(filters.item.toLowerCase()) &&
            r.brand_name.toLowerCase().includes(filters.brand.toLowerCase())
        );
    }, [rows, filters]);

    const columns = [
        {
            key: 'item_name',
            name: 'ITEM NAME',
            width: 250,
            renderEditCell: renderTextEditor,
            editable: true
        },
        {
            key: 'brand_name',
            name: 'BRAND',
            width: 200,
            renderEditCell: renderTextEditor,
            editable: true
        },
        {
            key: 'price',
            name: 'PRICE (₹)',
            width: 150,
            renderEditCell: renderTextEditor,
            editable: true,
            formatter: ({ row }) => <span className="font-medium">₹{row.price}</span>
        },
        {
            key: 'actions',
            name: '',
            width: 60,
            renderCell: ({ row }) => (
                <button onClick={() => deleteRow(row.id)} className="text-[#a0a0a0] hover:text-red-500 p-2 transition-colors">
                    <Trash2 size={16} />
                </button>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-white text-[#1a1a1a]">
            {/* Minimal Header */}
            <header className="border-b border-[#efefef] px-8 py-4 flex items-center justify-between sticky top-0 bg-white z-50">
                <div className="flex items-center gap-6">
                    <h2 className="text-[17px] font-bold tracking-tight">Management Dashboard</h2>
                    <div className="h-4 w-px bg-[#efefef]"></div>
                    <nav className="flex gap-4">
                        <li className="list-none text-[13px] font-medium text-[#2383e2] cursor-default bg-[#2383e20d] px-2.5 py-1 rounded">Products</li>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { localStorage.removeItem('auth_token'); navigate('/login'); }}
                        className="flex items-center gap-2 text-[13px] font-medium text-[#666] hover:text-[#111] transition-colors"
                    >
                        <LogOut size={16} />
                        Sign out
                    </button>
                </div>
            </header>

            <main className="p-8 max-w-screen-2xl mx-auto">
                {/* Control Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a0a0a0]" />
                            <input
                                type="text"
                                placeholder="Filter by item..."
                                className="pl-9 pr-4 py-2 bg-[#f7f7f7] border border-[#efefef] rounded-lg text-[13px] outline-none focus:bg-white focus:border-[#2383e2] transition-all w-48"
                                value={filters.item}
                                onChange={e => setFilters({ ...filters, item: e.target.value })}
                            />
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a0a0a0]" />
                            <input
                                type="text"
                                placeholder="Filter by brand..."
                                className="pl-9 pr-4 py-2 bg-[#f7f7f7] border border-[#efefef] rounded-lg text-[13px] outline-none focus:bg-white focus:border-[#2383e2] transition-all w-48"
                                value={filters.brand}
                                onChange={e => setFilters({ ...filters, brand: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={handleBulkPaste} className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-[#444] hover:bg-[#fafafa] border border-[#efefef] rounded-lg transition-colors">
                            <Upload size={16} />
                            Bulk Paste
                        </button>
                        <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-[#444] hover:bg-[#fafafa] border border-[#efefef] rounded-lg transition-colors">
                            <Download size={16} />
                            Export CSV
                        </button>
                        <div className="w-px h-6 bg-[#efefef] mx-2"></div>
                        <button onClick={addRow} className="flex items-center gap-2 px-4 py-2 text-[13px] font-bold text-white bg-[#2383e2] hover:bg-[#1a6dbd] rounded-lg shadow-[0_1px_2px_rgba(35,131,226,0.3)] transition-all">
                            <Plus size={16} />
                            Add Item
                        </button>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="h-6 mb-2">
                    {status.message && (
                        <div className={`flex items-center gap-2 text-[12px] font-semibold tracking-wide uppercase ${status.type === 'success' ? 'text-green-600' : 'text-red-500'} animate-in fade-in slide-in-from-top-2 duration-300`}>
                            {status.type === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                            {status.message}
                        </div>
                    )}
                </div>

                {/* Grid Container */}
                <div className="bg-white rounded-xl overflow-hidden border border-[#efefef]">
                    <DataGrid
                        columns={columns}
                        rows={filteredRows}
                        onRowsChange={handleRowsChange}
                        className="rdg-light"
                        style={{ height: 'calc(100vh - 350px)', minHeight: '500px' }}
                        rowKeyGetter={row => row.id}
                    />
                </div>

                <div className="mt-6 flex justify-between items-center px-2">
                    <p className="text-[12px] text-[#8c8c8c] font-medium">Rows are auto-saved on edit. Click price cells to change values.</p>
                    <p className="text-[12px] text-[#8c8c8c] font-bold">{filteredRows.length} total items</p>
                </div>
            </main>
        </div>
    );
}

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, ChevronUp, ChevronDown, Loader2, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublicPage() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchPrices = async () => {
        try {
            const res = await axios.get('https://grocery-priceing-production.up.railway.app/api/prices');
            setProducts(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch prices", error);
        }
    };

    useEffect(() => {
        fetchPrices();
        const interval = setInterval(fetchPrices, 10000);
        return () => clearInterval(interval);
    }, []);

    const groupedProducts = useMemo(() => {
        const filtered = products.filter(p =>
            p.item_name.toLowerCase().includes(search.toLowerCase()) ||
            p.brand_name.toLowerCase().includes(search.toLowerCase())
        );

        const groups = {};
        filtered.forEach(p => {
            if (!groups[p.item_name]) groups[p.item_name] = [];
            groups[p.item_name].push(p);
        });
        return groups;
    }, [products, search]);

    return (
        <div className="min-h-screen bg-[#fcfcfc] text-[#1a1a1a] selection:bg-[#10b98120] font-sans pb-20">
            {/* Minimal Centered Search */}
            <header className="max-w-screen-md mx-auto px-6 pt-20 pb-12">
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#aaa] group-focus-within:text-[#10b981] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search for items or brands..."
                        className="w-full bg-white border-0 py-6 pl-14 pr-8 rounded-[2rem] text-[16px] outline-none shadow-[0_10px_40px_rgba(0,0,0,0.04)] focus:shadow-[0_15px_50px_rgba(0,0,0,0.08)] transition-all placeholder:text-[#ccc]"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            <main className="max-w-screen-xl mx-auto px-6">
                {loading ? (
                    <div className="flex justify-center py-20 opacity-20">
                        <Loader2 className="animate-spin h-8 w-8 text-[#10b981]" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 max-w-screen-lg mx-auto">
                        <AnimatePresence mode="popLayout">
                            {Object.entries(groupedProducts).map(([item, brands]) => (
                                <motion.div
                                    layout
                                    initial="initial"
                                    whileHover="hover"
                                    animate="animate"
                                    exit="exit"
                                    variants={{
                                        initial: { opacity: 0, y: 20 },
                                        animate: { opacity: 1, y: 0 },
                                        exit: { opacity: 0, scale: 0.98 }
                                    }}
                                    key={item}
                                    className="group bg-white rounded-[2.5rem] shadow-[0_4px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] transition-all duration-500 overflow-hidden cursor-default border border-white hover:border-[#f0f0f0]"
                                >
                                    <div className="px-10 py-8 flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            {/* Tag Icon with green background */}
                                            <div className="h-16 w-16 rounded-3xl bg-[#10b98110] flex items-center justify-center text-[#10b981]">
                                                <Tag size={28} />
                                            </div>

                                            <div>
                                                <h2 className="text-[22px] font-extrabold text-[#111] leading-tight tracking-tight mb-1">{item}</h2>
                                                <p className="text-[15px] text-[#888] font-medium">
                                                    Starts from <span className="text-[#10b981] font-bold">₹{Math.min(...brands.map(b => b.price)).toLocaleString('en-IN')}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {/* Brand count pill */}
                                            <div className="border border-[#10b98140] rounded-full px-5 py-2 text-[14px] font-bold text-[#10b981] bg-[#10b98105]">
                                                {brands.length} Brands
                                            </div>
                                            <ChevronDown className="text-[#888] group-hover:text-[#111] transition-transform duration-500 group-hover:rotate-180" size={24} />
                                        </div>
                                    </div>

                                    {/* Brand detail list on hover */}
                                    <motion.div
                                        variants={{
                                            initial: { height: 0, opacity: 0 },
                                            hover: { height: 'auto', opacity: 1 }
                                        }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                        className="overflow-hidden bg-[#fcfcfc]/50 px-10"
                                    >
                                        <div className="pb-10 pt-4 flex flex-col gap-2">
                                            <div className="h-px bg-[#f0f0f0] mb-4"></div>
                                            {brands.map((brand) => (
                                                <div key={brand.id} className="flex items-center justify-between py-3 px-6 rounded-2xl hover:bg-white transition-colors">
                                                    <span className="text-[15px] text-[#555] font-semibold">
                                                        {brand.brand_name}
                                                    </span>
                                                    <div className="flex items-center gap-4">
                                                        {brand.price !== brand.prev_price && (
                                                            <span className={brand.price > brand.prev_price ? 'text-green-500' : 'text-red-400'}>
                                                                {brand.price > brand.prev_price ? (
                                                                    <ChevronUp size={18} strokeWidth={3} />
                                                                ) : (
                                                                    <ChevronDown size={18} strokeWidth={3} />
                                                                )}
                                                            </span>
                                                        )}
                                                        <span className="text-[17px] font-black text-[#111] min-w-[100px] text-right">
                                                            ₹{brand.price.toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {!loading && Object.keys(groupedProducts).length === 0 && (
                    <div className="text-center py-24">
                        <p className="text-[#ccc] text-lg font-bold">No items found matching your search</p>
                    </div>
                )}
            </main>

            <footer className="max-w-screen-xl mx-auto px-6 pt-20 flex flex-col items-center gap-6 opacity-40">
                <div className="h-px w-20 bg-[#f0f0f0]"></div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#aaa]">
                    © {new Date().getFullYear()} Pulses Trading Dashboard • <a href="/login" className="hover:text-[#111]">Admin</a>
                </p>
            </footer>
        </div>
    );
}

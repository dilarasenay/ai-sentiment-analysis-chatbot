"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, Activity, Info, TrendingUp, TrendingDown, Minus, PieChart as PieChartIcon, MessageSquare, ClipboardList, BarChart3, ShieldCheck, Search, Star, StarHalf, Apple, Grape, Citrus as CitrusIcon, Cherry } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

type BreakdownItem = {
    token: string;
    contribution: number;
    type: "positive" | "negative" | "neutral" | "multiplier" | "rule";
    rule?: string;
};

type Message = {
    id: string;
    text: string;
    sender: "user" | "bot";
    sentiment?: "positive" | "negative" | "neutral";
    score?: number;
    breakdown?: BreakdownItem[];
};

const THEMES: Record<string, any> = {
    apple: {
        primary: "244, 63, 94", // rose-500
        dark: "225, 29, 72", // rose-600
        bg: "255, 241, 242", // rose-50
        soft: "255, 228, 230", // rose-100
        shadow: "251, 113, 133", // rose-400
        icon: Apple
    },
    grape: {
        primary: "147, 51, 234", // purple-600
        dark: "126, 34, 206", // purple-700
        bg: "250, 245, 255", // purple-50
        soft: "243, 232, 255", // purple-100
        shadow: "192, 132, 252", // purple-400
        icon: Grape
    },
    citrus: {
        primary: "245, 158, 11", // amber-500
        dark: "217, 119, 6", // amber-600
        bg: "255, 251, 235", // amber-50
        soft: "254, 243, 199", // amber-100
        shadow: "251, 191, 36", // amber-400
        icon: CitrusIcon
    },
    pink: {
        primary: "236, 72, 153", // pink-600
        dark: "190, 24, 93", // pink-700
        bg: "255, 245, 250", // pink-50
        soft: "253, 242, 248", // pink-100
        shadow: "251, 207, 232", // pink-200
        icon: Sparkles
    }
};

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            text: "Merhaba! 👋 Ben SentimentPulse AI asistanınım. Müşteri yorumlarını analiz ederek duygu tonlarını ve kelime etkilerini raporlarım. Analiz detaylarını görmek için bir yoruma tıklayabilirsin. ✨",
            sender: "bot",
            sentiment: "neutral",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAnalysis, setSelectedAnalysis] = useState<Message | null>(null);
    const [themeSpread, setThemeSpread] = useState<{ x: number, y: number, color: string } | null>(null);
    const [activeThemeKey, setActiveThemeKey] = useState("pink");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleThemeChange = (themeKey: string, e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const theme = THEMES[themeKey];

        setThemeSpread({ x, y, color: `rgb(${theme.primary})` });
        setActiveThemeKey(themeKey);

        // Apply CSS variables after a tiny delay for the animation to start
        setTimeout(() => {
            document.documentElement.style.setProperty('--primary-theme', theme.primary);
            document.documentElement.style.setProperty('--primary-theme-dark', theme.dark);
            document.documentElement.style.setProperty('--theme-bg', theme.bg);
            document.documentElement.style.setProperty('--theme-soft', theme.soft);
            document.documentElement.style.setProperty('--theme-shadow', theme.shadow);
        }, 50);

        // Clear spread animation
        setTimeout(() => setThemeSpread(null), 1200);
    };

    const sentimentStats = [
        {
            name: "Pozitif",
            value: messages.filter(m => m.sentiment === "positive").reduce((acc, m) => acc + (m.score || 0), 0),
            color: "#82f566ff",
            icon: <TrendingUp size={14} className="text-pink-500" />
        },
        {
            name: "Negatif",
            value: messages.filter(m => m.sentiment === "negative").reduce((acc, m) => acc + Math.abs(m.score || 0), 0),
            color: "#f43f5e",
            icon: <TrendingDown size={14} className="text-rose-500" />
        },
        {
            name: "Nötr",
            value: messages.filter(m => m.sentiment === "neutral").length,
            color: "#94a3b8",
            icon: <Minus size={14} className="text-slate-400" />
        },
    ].filter(s => s.value > 0);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: input,
            sender: "user",
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:5000/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: input }),
            });

            if (!response.ok) throw new Error("API hatası");

            const data = await response.json();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: `Analiz Tamamlandı: Bu yorum ${getSentimentText(data.sentiment)} eğilimlidir.`,
                sender: "bot",
                sentiment: data.sentiment,
                score: data.score,
                breakdown: data.breakdown,
            };

            setMessages((prev) => [...prev, botMessage]);
            setSelectedAnalysis(botMessage);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "Üzgünüm, bir hata oluştu. Lütfen backend servisinin çalıştığından emin ol.",
                sender: "bot",
                sentiment: "neutral",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const getSentimentIcon = (sentiment: string) => {
        switch (sentiment) {
            case "positive": return <Star size={18} className="text-green-600 fill-green-600" />;
            case "negative": return <Star size={18} className="text-red-600 fill-red-600" />;
            case "neutral": return <Star size={18} className="text-slate-400" />;
            default: return null;
        }
    };

    const getSentimentText = (sentiment: string) => {
        switch (sentiment) {
            case "positive": return "POZİTİF";
            case "negative": return "NEGATİF";
            default: return "NÖTR";
        }
    };

    const getSentimentColor = (sentiment?: string) => {
        switch (sentiment) {
            case "positive": return "sentiment-positive text-green-900";
            case "negative": return "sentiment-negative text-red-900";
            case "neutral": return "sentiment-neutral text-slate-800";
            default: return "bg-white/80 text-slate-400 border border-white shadow-sm";
        }
    };



    return (
        <div className="flex h-screen bg-transparent text-slate-900 overflow-hidden font-sans">

            {/* Theme Transition Overlay */}
            {themeSpread && (
                <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
                    <div
                        className="absolute rounded-full animate-theme-spread"
                        style={{
                            left: themeSpread.x,
                            top: themeSpread.y,
                            width: '100px',
                            height: '100px',
                            marginLeft: '-50px',
                            marginTop: '-50px',
                            backgroundColor: themeSpread.color,
                            boxShadow: `0 0 100px 50px ${themeSpread.color}`
                        }}
                    />
                </div>
            )}

            {/* Main Chat Section */}
            <main className="flex-1 flex flex-col p-4 md:p-6 border-r border-slate-200/50 relative z-10">
                {/* Distributed Background Watermark Pattern */}
                <div className="absolute inset-0 pointer-events-none flex flex-wrap items-center justify-around opacity-[0.05] overflow-hidden z-0 p-12">
                    {(() => {
                        const Icon = THEMES[activeThemeKey].icon;
                        return Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="p-8">
                                <Icon size={120} style={{ color: 'rgb(var(--primary-theme))' }} className={`${i % 2 === 0 ? 'rotate-12' : '-rotate-12'} scale-110 translate-y-${(i % 3) * 4}`} />
                            </div>
                        ));
                    })()}
                </div>
                <header className="flex items-center justify-between mb-8 animate-fade-in relative z-10">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center rotate-3 hover:rotate-0 transition-all cursor-pointer group"
                            style={{
                                backgroundColor: 'rgb(var(--primary-theme))',
                                boxShadow: '0 20px 25px -5px rgba(var(--primary-theme), 0.3)'
                            }}
                            onClick={(e) => handleThemeChange('pink', e)}
                        >
                            <Sparkles size={32} className="text-white group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-black tracking-tight text-slate-800">
                                    SentimentPulse <span style={{ color: 'rgb(var(--primary-theme))' }}>AI</span>
                                </h1>
                                <div
                                    className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider"
                                    style={{
                                        backgroundColor: 'rgb(var(--theme-bg))',
                                        color: 'rgb(var(--primary-theme))'
                                    }}
                                >v2.0</div>
                            </div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">Müşteri Görüşü & Duygu Analizi</p>
                        </div>
                    </div>
                    <div className="hidden md:flex gap-3">
                        <button
                            onClick={(e) => handleThemeChange('apple', e)}
                            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-rose-400 border border-slate-100 shadow-sm transition-all hover:scale-110 active:scale-95"
                        >
                            <Apple size={20} />
                        </button>
                        <button
                            onClick={(e) => handleThemeChange('grape', e)}
                            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-purple-400 border border-slate-100 shadow-sm transition-all hover:scale-110 active:scale-95"
                        >
                            <Grape size={20} />
                        </button>
                        <button
                            onClick={(e) => handleThemeChange('citrus', e)}
                            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-400 border border-slate-100 shadow-sm transition-all hover:scale-110 active:scale-95"
                        >
                            <CitrusIcon size={20} />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                            onClick={() => msg.breakdown && setSelectedAnalysis(msg)}
                        >
                            <div className={`flex gap-3 max-w-[85%] cursor-pointer ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md border border-white transition-transform hover:scale-110 ${msg.sender === "user" ? "bg-slate-700 text-white" : "text-white"
                                    }`}
                                    style={msg.sender === "bot" ? { backgroundColor: 'rgb(var(--primary-theme))' } : {}}
                                >
                                    {msg.sender === "user" ? <User size={20} /> : <Bot size={20} />}
                                </div>
                                <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all hover:bg-white/90 ${msg.sender === "user"
                                    ? "bg-white text-slate-700 rounded-tr-none border border-slate-100"
                                    : `${getSentimentColor(msg.sentiment)} rounded-tl-none border border-white/20`
                                    }`}>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="font-semibold">{msg.text}</span>
                                            {msg.sender === "bot" && msg.sentiment && (
                                                <div className="bg-white/40 p-1 rounded-lg">
                                                    {getSentimentIcon(msg.sentiment)}
                                                </div>
                                            )}
                                        </div>
                                        {msg.sender === "bot" && msg.score !== undefined && (
                                            <div className="mt-1 pt-2 border-t border-black/5 flex items-center justify-between">
                                                <span className="text-[10px] uppercase font-bold opacity-60">Duygu Skoru</span>
                                                <span className="text-xs font-bold opacity-80">{msg.score.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start animate-fade-in pl-12">
                            <div
                                className="flex gap-3 items-center font-bold text-sm bg-white/80 px-5 py-2.5 rounded-full border shadow-sm animate-analyze"
                                style={{
                                    color: 'rgb(var(--primary-theme))',
                                    borderColor: 'rgb(var(--theme-soft))'
                                }}
                            >
                                <Loader2 size={16} className="animate-spin" />
                                <span>Yorum analiz ediliyor...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="relative mt-auto animate-fade-in group pb-2">
                    <div
                        className="glass rounded-2xl p-2 flex items-center gap-2 transition-all focus-within:ring-4"
                        style={{ '--tw-ring-color': 'rgba(var(--primary-theme), 0.1)' } as any}
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Müşteri yorumunu buraya girin... ✨"
                            className="flex-1 bg-transparent border-none focus:outline-none px-4 py-4 text-sm text-slate-700 placeholder:text-slate-300 font-medium"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="w-12 h-12 rounded-xl text-white hover:scale-105 active:scale-95 flex items-center justify-center transition-all disabled:opacity-30 shadow-lg"
                            style={{
                                backgroundColor: 'rgb(var(--primary-theme))',
                                boxShadow: '0 10px 15px -3px rgba(var(--primary-theme), 0.3)'
                            }}
                        >
                            <Send size={20} className="text-white" />
                        </button>
                    </div>
                </div>
            </main>

            {/* Sentiment Dashboard Section */}
            <aside className="hidden lg:flex flex-col w-[380px] bg-white/10 p-6 overflow-y-auto relative backdrop-blur-xl border-l border-white/20">
                <div className="flex items-center gap-2 mb-8 text-slate-800 relative z-10">
                    <BarChart3 size={20} style={{ color: 'rgb(var(--primary-theme))' }} />
                    <h2 className="font-bold uppercase tracking-widest text-xs">Analiz Paneli</h2>
                </div>

                {/* Sentiment Distribution Pie Chart */}
                <div className="glass rounded-2xl p-5 mb-8 animate-fade-in">
                    <div className="flex items-center gap-2 mb-6 text-slate-500">
                        <PieChartIcon size={16} />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest">Duygu Dağılımı</h3>
                    </div>
                    <div className="h-[200px] w-full">
                        {sentimentStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sentimentStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={75}
                                        paddingAngle={8}
                                        dataKey="value"
                                        animationBegin={0}
                                        animationDuration={800}
                                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                    >
                                        {sentimentStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => {
                                            const totalWeight = sentimentStats.reduce((acc, s) => acc + s.value, 0);
                                            return [`%${((value / totalWeight) * 100).toFixed(1)}`, "Etki Oranı"];
                                        }}
                                        contentStyle={{
                                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                                            border: "none",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        align="center"
                                        content={(props) => {
                                            const { payload } = props;
                                            const totalWeight = sentimentStats.reduce((acc, s) => acc + s.value, 0);
                                            return (
                                                <div className="flex justify-center gap-4 mt-6">
                                                    {payload?.map((entry: any, index: number) => {
                                                        const stat = sentimentStats.find(s => s.name === entry.value);
                                                        const percentage = stat ? ((stat.value / totalWeight) * 100).toFixed(0) : 0;
                                                        return (
                                                            <div key={`item-${index}`} className="flex items-center gap-1.5">
                                                                {stat?.icon}
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                                    {entry.value} (%{percentage})
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest text-center px-4">
                                Veri bekleniyor...
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-px bg-slate-200/50 mb-8" />

                {
                    selectedAnalysis ? (
                        <div className="space-y-8 animate-fade-in">
                            {/* Summary Card */}
                            <div className="glass rounded-2xl p-5 space-y-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Duygu Puanı</span>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-4xl font-black ${selectedAnalysis.score! > 0 ? "text-green-600" : selectedAnalysis.score! < 0 ? "text-red-600" : "text-slate-600"
                                            }`}>
                                            {selectedAnalysis.score?.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ease-out ${selectedAnalysis.sentiment === "positive" ? "bg-green-500" : selectedAnalysis.sentiment === "negative" ? "bg-red-500" : "bg-slate-400"
                                            }`}
                                        style={{ width: `${Math.min(100, Math.abs((selectedAnalysis.score || 0) * 10))}%` }}
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                    <Info size={14} style={{ color: 'rgb(var(--primary-theme))' }} />
                                    <span>Normalize edilmiş duygu yoğunluğu.</span>
                                </div>
                            </div>

                            {/* Breakdown List */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-[0.2em] flex items-center gap-2">
                                    <MessageSquare size={12} style={{ color: 'rgb(var(--primary-theme))' }} />
                                    Kelime Etki Analizi
                                </h3>
                                <div className="space-y-2">
                                    {selectedAnalysis.breakdown?.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="group glass p-3.5 rounded-xl border-l-4 border-l-transparent transition-all hover:border-l-current bg-white/50"
                                            style={{ borderLeftColor: 'rgb(var(--primary-theme))' }}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-slate-700 text-xs">{item.token}</span>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${item.contribution > 0 ? "bg-green-50 text-green-600" :
                                                    item.contribution < 0 ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-400"
                                                    }`}>
                                                    {item.contribution > 0 ? "+" : ""}{item.contribution}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {item.contribution > 0 ? <TrendingUp size={10} className="text-green-500" /> :
                                                    item.contribution < 0 ? <TrendingDown size={10} className="text-red-500" /> : <Minus size={10} className="text-slate-400" />}
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                    {item.rule || (item.contribution !== 0 ? "Sözlük Kaydı" : "Etkisiz")}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <Activity size={32} className="text-slate-400" />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Detaylar için bir yoruma tıklayın</p>
                        </div>
                    )
                }
            </aside >
        </div >
    );
}

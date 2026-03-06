"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, Activity, Info, TrendingUp, TrendingDown, Minus } from "lucide-react";

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

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            text: "Merhaba! Ben senin duygu analizi asistanınım. Yazdığın cümlelerin neden ve nasıl analiz edildiğini sağ taraftaki panelden görebilirsin.",
            sender: "bot",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAnalysis, setSelectedAnalysis] = useState<Message | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
                text: `Analiz Sonucu: Bu yorum ${getSentimentText(data.sentiment)} tondadır.`,
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
                text: "Üzgünüm, bir hata oluştu. Lütfen backend'in çalıştığından emin ol.",
                sender: "bot",
                sentiment: "neutral",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const getSentimentText = (sentiment: string) => {
        switch (sentiment) {
            case "positive": return "POZİTİF ✨";
            case "negative": return "NEGATİF ⚠️";
            default: return "NÖTR 😶";
        }
    };

    const getSentimentColor = (sentiment?: string) => {
        switch (sentiment) {
            case "positive": return "sentiment-positive text-white";
            case "negative": return "sentiment-negative text-white";
            case "neutral": return "sentiment-neutral text-white";
            default: return "bg-slate-800 text-slate-100";
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden">
            {/* Main Chat Section */}
            <main className="flex-1 flex flex-col p-4 md:p-6 border-r border-slate-800/50">
                <header className="flex items-center justify-between mb-8 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Sparkles className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                                Sentiment AI
                            </h1>
                            <p className="text-slate-400 text-xs font-medium">Chatbot & Analyzer</p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-6 scrollbar-thin scrollbar-thumb-slate-800">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                            onClick={() => msg.breakdown && setSelectedAnalysis(msg)}
                        >
                            <div className={`flex gap-3 max-w-[85%] cursor-pointer ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === "user" ? "bg-indigo-600" : "bg-slate-800 border border-slate-700"
                                    }`}>
                                    {msg.sender === "user" ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed transition-transform hover:scale-[1.02] ${msg.sender === "user"
                                    ? "bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10"
                                    : `${getSentimentColor(msg.sentiment)} rounded-tl-none shadow-lg`
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="flex gap-3 items-center text-slate-400 text-sm bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
                                <Loader2 size={16} className="animate-spin" />
                                <span>Analiz ediliyor...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="relative mt-auto animate-fade-in">
                    <div className="glass rounded-2xl p-2 flex items-center gap-2 transition-all focus-within:ring-2 focus-within:ring-indigo-500/40">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Analiz edilecek yorumu buraya yazın..."
                            className="flex-1 bg-transparent border-none focus:outline-none px-4 py-3 text-sm placeholder:text-slate-500"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center transition-all disabled:opacity-50"
                        >
                            <Send size={18} className="text-white" />
                        </button>
                    </div>
                </div>
            </main>

            {/* Sentiment Dashboard Section */}
            <aside className="hidden lg:flex flex-col w-[400px] bg-slate-900/30 p-6 overflow-y-auto">
                <div className="flex items-center gap-2 mb-8 text-slate-400">
                    <Activity size={20} className="text-indigo-400" />
                    <h2 className="font-bold uppercase tracking-wider text-sm">Analiz Dashboard</h2>
                </div>

                {selectedAnalysis ? (
                    <div className="space-y-8 animate-fade-in">
                        {/* Summary Card */}
                        <div className="glass rounded-2xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-sm">Toplam Skor</span>
                                <span className={`text-2xl font-black ${selectedAnalysis.score! > 0 ? "text-green-400" : selectedAnalysis.score! < 0 ? "text-red-400" : "text-slate-400"
                                    }`}>
                                    {selectedAnalysis.score?.toFixed(2)}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${selectedAnalysis.sentiment === "positive" ? "bg-green-500" : selectedAnalysis.sentiment === "negative" ? "bg-red-500" : "bg-slate-500"
                                        }`}
                                    style={{ width: `${Math.min(100, Math.abs((selectedAnalysis.score || 0) * 10))}%` }}
                                />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Info size={14} />
                                <span>Skor [-10, +10] aralığında normalize edilmiştir.</span>
                            </div>
                        </div>

                        {/* Breakdown List */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold uppercase text-slate-500 px-1 tracking-widest">Kelime Bazlı Detaylar</h3>
                            <div className="space-y-3">
                                {selectedAnalysis.breakdown?.map((item, idx) => (
                                    <div key={idx} className="group glass p-3 rounded-xl border-l-4 border-l-transparent transition-all hover:border-l-indigo-500/50">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-sm">{item.token}</span>
                                            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${item.contribution > 0 ? "bg-green-500/10 text-green-400" :
                                                item.contribution < 0 ? "bg-red-500/10 text-red-400" : "bg-slate-800 text-slate-500"
                                                }`}>
                                                {item.contribution > 0 ? "+" : ""}{item.contribution}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {item.contribution > 0 ? <TrendingUp size={12} className="text-green-500" /> :
                                                item.contribution < 0 ? <TrendingDown size={12} className="text-red-500" /> : <Minus size={12} className="text-slate-600" />}
                                            <span className="text-[11px] text-slate-500 lowercase">
                                                {item.rule || (item.contribution !== 0 ? "Leksikon Kaydı" : "Etkisiz Kelime")}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                        <Sparkles size={48} className="mb-4 text-slate-600" />
                        <p className="text-sm font-medium">Analiz detaylarını görmek için bir mesaja tıkla veya yeni bir tane gönder.</p>
                    </div>
                )}
            </aside>
        </div>
    );
}

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, Shield, ShieldAlert, Sparkles, TrendingDown, Search, Share2, 
  ExternalLink, Eye, MessageSquare, Flame, Check, AlertTriangle, 
  ChevronRight, RefreshCw, HelpCircle, Heart, User, Clock, 
  ThumbsUp, ThumbsDown, Coins, AlertCircle, Thermometer, ArrowUpRight, CheckCircle, Sparkles as SparklesIcon
} from "lucide-react";
import StatsDashboard from "./components/StatsDashboard";
import { Product, Message, ChannelPost, ValueForMoney } from "./types";
import PriceHistoryChart from "./components/PriceHistoryChart";

// Helper to parse unstructured Gemini bullet point summaries into visually perfect pros/cons panels
function parseBulletPoints(text: string): { pros: string[]; cons: string[]; mainVerdict: string } {
  const lines = text.split("\n");
  const pros: string[] = [];
  const cons: string[] = [];
  let mainVerdict = "";
  
  let currentSection: "verdict" | "pros" | "cons" | "none" = "none";
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect headers
    if (trimmed.includes("Вердикт большинства") || trimmed.includes("вердикт") || trimmed.includes("⚖️")) {
      currentSection = "verdict";
      continue;
    }
    if (trimmed.includes("Что хвалят") || trimmed.includes("хвалят") || trimmed.includes("✅")) {
      currentSection = "pros";
      continue;
    }
    if (trimmed.includes("косяки") || trimmed.includes("жалобы") || trimmed.includes("❌") || trimmed.includes("минусы") || trimmed.includes("косяк")) {
      currentSection = "cons";
      continue;
    }
    
    // Check for bullets
    if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*") || /^\d+[\.\)]/.test(trimmed)) {
      const cleanLine = trimmed.replace(/^[•\-\*\d\.\s\)\(✅❌⚖️]+/g, "").trim();
      if (currentSection === "pros") {
        pros.push(cleanLine);
      } else if (currentSection === "cons") {
        cons.push(cleanLine);
      } else if (currentSection === "verdict") {
        mainVerdict += cleanLine + " ";
      }
    } else {
      if (currentSection === "verdict" || currentSection === "none") {
        mainVerdict += trimmed + " ";
      }
    }
  }
  
  return { 
    pros: pros.length > 0 ? pros : ["Объективная эргономика", "Хорошие технические параметры"], 
    cons: cons.length > 0 ? cons : ["Наценка за эксклюзивный бренд", "Возможны недоработки прошивки"], 
    mainVerdict: mainVerdict.trim() 
  };
}

function reviewInsightLabel(item: { label: string; count: number }) {
  return item.count > 1 ? `${item.label} (${item.count} упом.)` : item.label;
}

function reviewEvidenceLine(product: Product) {
  const evidence = product.reviewEvidence;
  if (!evidence) return "Отзывы: детальная выборка не сохранена";
  const total = evidence.totalCount || evidence.processedCount;
  const pages = evidence.pagesAvailable ? `, страниц ${evidence.pagesProcessed}/${evidence.pagesAvailable}` : "";
  return `Отзывы: обработано ${evidence.processedCount} из ${total}${pages}`;
}

export default function App() {
  // Application Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    savedMoneyTotal: 0,
    impulsiveTriesBlocked: 0,
    activeUsersCount: 0,
    realDealsTracked: 0,
  });

  // Active Contexts
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [inputText, setInputText] = useState("");
  const [customLink, setCustomLink] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<"bot" | "channel">("bot");

  // Bot Chat States
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      sender: "bot",
      text: "🛡️ Приветствую! Я твой **ИИ-Адвокат Покупателя** для каталога Onliner.by.\n\nТеперь я сначала пробую live-данные Onliner: карточку товара, текущую цену, график минимальных цен, предложения и отзывы. История берется из каталожного JSON Onliner, а локальное хранилище только кэширует и дополняет снимки.\n\nПросто выбери демо-товар ниже, вставь ссылку из catalog.onliner.by или спроси о технологии.",
      timestamp: "12:00",
      actions: [
        { label: "🍎 iPhone 15 фейк-скидка", action: "test-product", payload: "iphone15" },
        { label: "📱 Redmi Note 13 реальная скидка", action: "test-product", payload: "redminote13" },
        { label: "💆 Dyson Airwrap накрутка!", action: "test-product", payload: "dyson" }
      ]
    }
  ]);

  // Anti-Impulsive shopping feature states
  const [isImpulsiveActive, setIsImpulsiveActive] = useState(false);
  const [daysTracked, setDaysTracked] = useState(1);
  const [userOldDevice, setUserOldDevice] = useState("");
  const [isComparing, setIsComparing] = useState(false);

  // Channel States
  const [channelPosts, setChannelPosts] = useState<ChannelPost[]>([]);
  const [selectedProductForPost, setSelectedProductForPost] = useState("");
  const [criticLevel, setCriticLevel] = useState<"mild" | "normal" | "roast">("normal");
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [adminToken, setAdminToken] = useState(() => (
    typeof window === "undefined" ? "" : localStorage.getItem("onliner_admin_token") || ""
  ));
  const [channelAdminMessage, setChannelAdminMessage] = useState("");
  const [isCheckingTelegram, setIsCheckingTelegram] = useState(false);
  const [isCheckingOnliner, setIsCheckingOnliner] = useState(false);

  // Chat container scroll ref
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    fetchProducts();
    fetchStats();
    loadDefaultChannelPosts();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cleanToken = adminToken.trim();
    if (cleanToken) {
      localStorage.setItem("onliner_admin_token", cleanToken);
    } else {
      localStorage.removeItem("onliner_admin_token");
    }
  }, [adminToken]);

  // Scroll to bottom on chats update
  useEffect(() => {
    const chatScroll = chatScrollRef.current;
    if (chatScroll) {
      chatScroll.scrollTop = chatScroll.scrollHeight;
    }
  }, [messages]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        if (data.length > 0) {
          setSelectedProductForPost(data[0].id);
        }
      }
    } catch (e) {
      console.error("Ошибка загрузки товаров", e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Ошибка статистики", e);
    }
  };

  const adminHeaders = () => {
    const cleanToken = adminToken.trim();
    return cleanToken ? { "x-admin-token": cleanToken } : {};
  };

  const loadDefaultChannelPosts = async () => {
    const defaults: ChannelPost[] = [
      {
        id: "post_default_dyson",
        productId: "dyson",
        title: "Стайлер Dyson Airwrap Multi-Styler Complete",
        category: "Фены и приборы для укладки",
        advertisedDiscount: 30,
        realDiscount: -3,
        honestyScore: 12,
        honestyVerdict: "ФЕЙКОВАЯ СКИДКА! ❌",
        currentPrice: 1650,
        regularPrice: 1600,
        pros: "Бережная укладка воздухом. Уникальный эффект Коанда.",
        cons: "Ценник безумно накручен. Не подходит для тяжелых жестких волос.",
        buyerAdvocateVerdict: "📢 **ОСТОРОЖНО: НАГРУЗКА НА КОШЕЛЕК И ФЕЙК КУПОНЫ!**\n\nПродавец пытается убедить, что вы экономите 30% от мифических 2350 BYN! На деле средняя цена за 3 месяца составляла 1600 BYN. Продавец просто надул ценник прямо перед акцией, чтобы нарисовать заманчивый дисконт. ИИ-патруль классифицирует сделку как наглый обман.\n\n🛡️ **ВЕРДИКТ АДВОКАТА:** Переплата за инстаграм-маркетинг составляет 60%. Воздержитесь от этой эмоциональной покупки!",
        timestamp: "11:15",
        views: 312,
        shares: 8,
        commentsCount: 2
      },
      {
        id: "post_default_redmi",
        productId: "redminote13",
        title: "Смартфон Xiaomi Redmi Note 13 Pro 8GB/256GB",
        category: "Мобильные телефоны",
        advertisedDiscount: 23,
        realDiscount: 20.5,
        honestyScore: 94,
        honestyVerdict: "РЕАЛЬНАЯ ВЫГОДА! ✅",
        currentPrice: 850,
        regularPrice: 1070,
        pros: "Экран 120 Гц AMOLED. Зарядка 67 Вт в комплекте. Камера 200 Мп.",
        cons: "Куча рекламы в прошивке. Пластиковый корпус, а не алюминиевый.",
        buyerAdvocateVerdict: "📢 **ОБНАРУЖЕН ЧЕСТНЫЙ ЦЕНОПАД!**\n\nНастоящая скидка зафиксирована математическим ботом. Розничная розница упала на 20.5% ниже сезонного медианного уровня. Продавцы действительно сливают партию остатков.\n\n🛡️ **ВЕРДИКТ АДВОКАТА:** Оптимальная точка входа. Если вы искали качественный аппарат среднего класса — это одобрено защитой прав покупателя!",
        timestamp: "10:30",
        views: 185,
        shares: 4,
        commentsCount: 0
      }
    ];
    try {
      const res = await fetch("/api/channel/posts?limit=25");
      if (res.ok) {
        const data = await res.json();
        const livePosts = Array.isArray(data.posts) ? data.posts as ChannelPost[] : [];
        const liveIds = new Set(livePosts.map((post) => post.id));
        setChannelPosts([...livePosts, ...defaults.filter((post) => !liveIds.has(post.id))]);
        return;
      }
    } catch (e) {
      console.error("Ошибка загрузки постов канала", e);
    }

    setChannelPosts(defaults);
  };

  // Bot handler: analyze manual URL or custom searches
  const handleAnalyzeLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customLink.trim()) return;

    setIsAnalyzing(true);
    // Add user message to chat simulation
    const userMsgId = "user-" + Date.now();
    const analyzeText = customLink.trim();
    const newUserMsg: Message = {
      id: userMsgId,
      sender: "user",
      text: `🔎 Анализ товара: ${analyzeText}`,
      timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setCustomLink("");

    try {
      const response = await fetch("/api/analyze-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkOrTitle: analyzeText })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.found && data.product) {
          const product: Product = data.product;
          setActiveProduct(product);
          
          // Generate customized bot analysis summary message
          const medianLabel = product.priceEvidence?.medianWindowLabel || "окно медианы не подтверждено";
          const sourceLabel = product.dataSource === "onliner_live"
            ? "live Onliner"
            : product.dataSource === "fallback"
              ? "stale runtime cache"
              : "fallback/demo";
          const evidenceWarnings = product.priceEvidence?.warnings?.length
            ? `\n⚠️ ${product.priceEvidence.warnings.slice(0, 2).join("\n⚠️ ")}`
            : "";
          const manipulationWarning = product.priceManipulationWarning
            ? `\n⚠️ ${product.priceManipulationWarning}`
            : "";
          const botResponseMsg: Message = {
            id: "bot-" + Date.now(),
            sender: "bot",
            text: `⚖️ **Адвокат проверил карточку Onliner.by!**\n\n📦 **Товар:** ${product.title}\n🏷️ **Категория:** ${product.category}\n🔎 **Источник:** ${sourceLabel}\n\n💲 **Финансовая экспертиза:**\n• Заявленная зачеркнутая цена: **${product.originalPrice} BYN**\n• Твоя текущая цена: **${product.currentPrice} BYN**\n• Медианный ориентир: **${product.medianPrice90Days} BYN**\n• Окно/доказательство: ${medianLabel}\n• ${reviewEvidenceLine(product)}${evidenceWarnings}${manipulationWarning}\n\n🎯 **Индекс честности скидки:** ${
              product.isFakeDiscount 
                ? "❌ **СКИДКА НЕ ПОДТВЕРЖДЕНА ИСТОРИЕЙ.** " + (product.priceManipulationWarning || ("Честная выгода по медиане: " + product.honestDiscountPercent + "%, заявленная скидка: " + (product.advertisedDiscountPercent || Math.round((product.originalPrice - product.currentPrice)/product.originalPrice * 100)) + "%."))
                : "✅ **СНИЖЕНИЕ ВЫГЛЯДИТ ЧЕСТНЫМ!** Математический контроль видит выгоду **" + product.honestDiscountPercent + "%** относительно текущего медианного ориентира."
            }\n\n🏆 **Рейтинг Value for money:** \`${product.valueForMoney}\`\n\nЧто мы делаем дальше? Жми кнопки ниже для глубокого расследования ИИ!`,
            timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
            productId: product.id,
            type: "product_card",
            actions: [
              { label: "⚖️ Сводка мнений владельцев", action: "summarize-reviews", payload: product.id },
              { label: "💸 Сравнить с моим гаджетом", action: "compare-old", payload: product.id },
              { label: "🛡️ Охладить импульсивную трату", action: "anti-impulsive", payload: product.id }
            ]
          };
          setMessages(prev => [...prev, botResponseMsg]);
        }
      } else {
        throw new Error("Не удалось получить экспертную оценку");
      }
    } catch (e) {
      const errorMsg: Message = {
        id: "error-" + Date.now(),
        sender: "system",
        text: "❌ Произошла ошибка связи с ИИ-адвокатом покупателя. Пожалуйста, попробуйте написать название товара текстом.",
        timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Process user typing in chat field
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText("");
    setIsSendingMessage(true);

    const userMsg: Message = {
      id: "chat-user-" + Date.now(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          activeProductId: activeProduct?.id || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botResponse: Message = {
          id: "chat-bot-" + Date.now(),
          sender: "bot",
          text: data.text,
          timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
          productId: activeProduct?.id
        };
        setMessages(prev => [...prev, botResponse]);
      } else {
        throw new Error("Ошибка чат-сервера");
      }
    } catch (e) {
      const errorMsg: Message = {
        id: "err-chat-" + Date.now(),
        sender: "bot",
        text: "🛡️ Адвокат временно недоступен в сети из-за помех в каталоге, но я на страже ваших интересов! Мой совет: никогда не торопитесь опустошать кошелек при крупных скидках. Дайте цене полежать 24 часа.",
        timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle interactive buttons clicked in Telegram dialogue
  const handleActionClick = async (action: string, payload: any) => {
    if (action === "test-product") {
      // Find mocked product
      const product = products.find(p => p.id === payload);
      if (product) {
        setActiveProduct(product);
        const userNotice: Message = {
          id: "notice-" + Date.now(),
          sender: "user",
          text: `🔍 Проверить ${product.title}`,
          timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
        };
        const botResponseMsg: Message = {
          id: "bot-" + Date.now(),
          sender: "bot",
          text: `⚖️ **Экспертиза адвоката покупателя:**\n\n📦 **Товар:** ${product.title}\n🏷️ **Категория:** ${product.category}\n🔎 **Источник:** ${product.dataSource === "onliner_live" ? "live Onliner" : "демо-товар"}\n\n💲 **Финансовая экспертиза:**\n• Заявленная зачеркнутая цена: **${product.originalPrice} BYN**\n• Заявленная скидка продавцом: **-${Math.round((product.originalPrice - product.currentPrice)/product.originalPrice * 100)}%**\n• Текущая цена: **${product.currentPrice} BYN**\n• Медианный ориентир: **${product.medianPrice90Days} BYN**\n• Окно/доказательство: ${product.priceEvidence?.medianWindowLabel || "демо-история"}\n• ${reviewEvidenceLine(product)}${product.priceManipulationWarning ? `\n⚠️ ${product.priceManipulationWarning}` : ""}\n\n🎯 **Индекс честности скидки:** ${
            product.isFakeDiscount 
              ? "❌ **СКИДКА НЕ ПОДТВЕРЖДЕНА ИСТОРИЕЙ.** " + (product.priceManipulationWarning || ("Честная выгода по медиане: **" + product.honestDiscountPercent + "%**."))
              : "✅ **СНИЖЕНИЕ ВЫГЛЯДИТ ЧЕСТНЫМ!** Цена ниже медианного ориентира на **" + product.honestDiscountPercent + "%**."
          }\n\n🏆 **Рейтинг ценности:** \`${product.valueForMoney}\`\n\nЖми кнопки ниже для глубокого анализа ИИ:`,
          timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
          productId: product.id,
          type: "product_card",
          actions: [
            { label: "⚖️ Сводка мнений владельцев", action: "summarize-reviews", payload: product.id },
            { label: "💸 Сравнить с моим гаджетом", action: "compare-old", payload: product.id },
            { label: "🛡️ Охладить импульсивную трату", action: "anti-impulsive", payload: product.id }
          ]
        };
        setMessages(prev => [...prev, userNotice, botResponseMsg]);
      }
    } 

    else if (action === "summarize-reviews") {
      setIsSendingMessage(true);
      const userText: Message = {
        id: "rev-user-" + Date.now(),
        sender: "user",
        text: "⚖️ Предоставить сводный анализ реальных отзывов покупателей",
        timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, userText]);

      try {
        const res = await fetch("/api/summarize-reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: payload })
        });
        if (res.ok) {
          const data = await res.json();
          const botText: Message = {
            id: "rev-bot-" + Date.now(),
            sender: "bot",
            text: data.summary,
            timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
            productId: payload,
            type: "rating_summary"
          };
          setMessages(prev => [...prev, botText]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSendingMessage(false);
      }
    }

    else if (action === "compare-old") {
      // Trigger modal focus or input state
      const target = products.find(p => p.id === payload);
      const promptText: Message = {
        id: "comp-prompt-" + Date.now(),
        sender: "bot",
        text: `💸 **Сравнение технологий на пальцах!**\n\nЯ помогу понять, стоит ли переплата в **${target?.currentPrice} BYN** перехода с твоего старого устройства.\n\n👇 **Напиши ниже модель твоего текущего гаджета** (например: *'iPhone 11'* или *'старый сяоми 2021'*), и я вынесу вердикт!`,
        timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        productId: payload
      };
      setMessages(prev => [...prev, promptText]);
      // Set indicator for comparison mode
      setIsComparing(true);
    }

    else if (action === "anti-impulsive") {
      setIsImpulsiveActive(true);
      setDaysTracked(1);
      const userActionNotice: Message = {
        id: "imp-notice-" + Date.now(),
        sender: "user",
        text: "🧘 Запустить режим охлаждения импульсивных трат",
        timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      };
      
      const target = products.find(p => p.id === payload);
      const botResponse: Message = {
        id: "imp-bot-" + Date.now(),
        sender: "bot",
        text: `🧘 **Режим охлаждения эмоций активирован!**\n\nТы следишь за **${target?.title}** ровно **1 день**. \n\n🛡️ **Рекомендация адвоката:**\nПокупка в 90% случаев совершается на эмоциях под влиянием яркого ценника. Давай заключим сделку: отложим покупку на **3 дня**. \n\nЕсли через 3 дня желание останется таким же сильным, и ты сможешь назвать 3 веские технические причины, почему твое старое устройство не справляется — мы оформим заказ. А пока я буду слать тебе предостерегающие уведомления и реальные минусы этой вещи!`,
        timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        productId: payload,
        type: "pulse_tracker"
      };
      setMessages(prev => [...prev, userActionNotice, botResponse]);
      
      // Update local statistics simulation
      setStats(prev => ({
        ...prev,
        impulsiveTriesBlocked: prev.impulsiveTriesBlocked + 1
      }));
    }
  };

  // Perform comparison execution
  const executeComparison = async () => {
    if (!userOldDevice.trim() || !activeProduct) return;
    setIsSendingMessage(true);

    const targetProduct = activeProduct;
    const oldName = userOldDevice;
    setUserOldDevice("");
    setIsComparing(false);

    const userText: Message = {
      id: "exec-comp-user-" + Date.now(),
      sender: "user",
      text: `⚖️ Сравни мой старый [${oldName}] с новым [${targetProduct.title}]`,
      timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    };
    setMessages(prev => [...prev, userText]);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetProductId: targetProduct.id,
          oldDeviceName: oldName
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botText: Message = {
          id: "exec-comp-bot-" + Date.now(),
          sender: "bot",
          text: data.comparison,
          timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
          productId: targetProduct.id,
          type: "comparison"
        };
        setMessages(prev => [...prev, botText]);
        
        // Simulating financial protection statistics update
        if (data.comparison.includes("ОТКАЗАТЬСЯ FROM") || data.comparison.includes("ОТКАЗАТЬСЯ ОТ ПОКУПКИ") || data.comparison.includes("НЕРАЦИОНАЛЬНО")) {
          setStats(prev => ({
            ...prev,
            savedMoneyTotal: prev.savedMoneyTotal + targetProduct.currentPrice
          }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Simulate passive simulator trigger: increase tracked days of budget cooler
  const handleIncreaseTrackedDays = () => {
    setDaysTracked(prev => {
      const next = prev + 1;
      let notificationText = "";
      if (next === 2) {
        notificationText = `🧘 **День 2: Охлаждение кошелька в процессе.**\nТы воздерживаешься уже 2 дня. За это время ты спас свой бюджет от траты в **${activeProduct?.currentPrice} BYN**. \n\nВспомни негативный отзыв реального покупателя: *"${activeProduct?.cons[0]}"*. Тебе точно нужна эта головная боль?`;
      } else if (next >= 3) {
        notificationText = `🎉 **День 3: Взвешенный Разум победил импульс!**\n\nПрошло 72 часа. Эмоциональный угар спал. Твой кошелек цел. Математика доказала, что ты сильнее уловок маркетологов!\n\nЕсли ты всё еще считаешь покупку обоснованной — перейди на [Catalog Onliner](${activeProduct?.url}), но ты уже делаешь это с трезвой головой!`;
      }

      setMessages(curr => [
        ...curr,
        {
          id: "imp-update-" + Date.now(),
          sender: "bot",
          text: notificationText,
          timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
          productId: activeProduct?.id || undefined
        }
      ]);
      return next;
    });
  };

  // Admin Panel: Generate the public telegram channel post using Express Gemini pipeline
  const handleGeneratePost = async () => {
    if (!selectedProductForPost) return;
    setIsGeneratingPost(true);
    setChannelAdminMessage("");

    try {
      const res = await fetch("/api/generate-channel-post", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders() },
        body: JSON.stringify({
          productId: selectedProductForPost,
          criticLevel
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newPost: ChannelPost = data.post;
        
        // Prepend new post
        setChannelPosts(prev => [newPost, ...prev]);
        setStats(prev => ({
          ...prev,
          realDealsTracked: newPost.realDiscount > 15 ? prev.realDealsTracked + 1 : prev.realDealsTracked
        }));
      } else {
        const errorData = await res.json().catch(() => ({}));
        setChannelAdminMessage(errorData.error || "Админское действие отклонено сервером.");
      }
    } catch (e) {
      console.error("Ошибка генерации поста", e);
      setChannelAdminMessage("Не удалось выполнить админское действие. Проверь сервер и токен.");
    } finally {
      setIsGeneratingPost(false);
    }
  };

  const handleTelegramDoctor = async () => {
    setIsCheckingTelegram(true);
    setChannelAdminMessage("");

    try {
      const res = await fetch("/api/telegram/doctor", {
        headers: { ...adminHeaders() },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setChannelAdminMessage(data.error || "Telegram doctor отклонен сервером.");
        return;
      }

      const readiness = data.readyForLiveDelivery ? "готов к live-отправке" : "еще не готов к live-отправке";
      const missing = Array.isArray(data.recommendations) && data.recommendations.length
        ? ` Что сделать: ${data.recommendations.slice(0, 2).join(" ")}`
        : "";
      setChannelAdminMessage(`Telegram: ${readiness}.${missing}`);
    } catch (e) {
      console.error("Ошибка Telegram doctor", e);
      setChannelAdminMessage("Не удалось проверить Telegram. Проверь сервер и admin token.");
    } finally {
      setIsCheckingTelegram(false);
    }
  };

  const handleOnlinerDoctor = async () => {
    setIsCheckingOnliner(true);
    setChannelAdminMessage("");

    try {
      const res = await fetch("/api/onliner/doctor?query=redmi%20note%2015%20pro", {
        headers: { ...adminHeaders() },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setChannelAdminMessage(data.error || "Onliner doctor отклонен сервером.");
        return;
      }

      if (data.readyForLiveSource) {
        setChannelAdminMessage(`Onliner live готов: ${data.liveProduct?.title || data.query}, замеров истории цены ${data.liveProduct?.historyPointsCount || 0}.`);
        return;
      }

      const cacheLine = data.cacheFallback
        ? ` Есть stale cache: ${data.cacheFallback.title}.`
        : " Stale cache нет.";
      const recommendation = Array.isArray(data.recommendations) && data.recommendations.length
        ? ` ${data.recommendations[0]}`
        : "";
      setChannelAdminMessage(`Onliner live не готов (${data.status}).${cacheLine}${recommendation}`);
    } catch (e) {
      console.error("Ошибка Onliner doctor", e);
      setChannelAdminMessage("Не удалось проверить Onliner. Проверь сервер, сеть и admin token.");
    } finally {
      setIsCheckingOnliner(false);
    }
  };

  // Channel helper counters
  const handleLikePost = (postId: string) => {
    setChannelPosts(prev => 
      prev.map(p => {
        if (p.id === postId) {
          const isLiked = p.views % 2 === 0; // simple toggler hack for demo UI
          return { ...p, views: p.views + (isLiked ? -1 : 1) };
        }
        return p;
      })
    );
  };

  const cleanChat = () => {
    setMessages([
      {
        id: "welcome-msg",
        sender: "bot",
        text: "🛡️ Приветствую! Я твой **ИИ-Адвокат Покупателя** для каталога Onliner.by.\n\nЯ сначала пробую live-данные Onliner и честно отделяю их от демо. Историю цен беру из графика минимальных цен Onliner, а не рисую ее из текущей скидки.\n\nВставь ссылку из catalog.onliner.by, напиши модель или выбери демо-товар ниже.",
        timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        actions: [
          { label: "🍎 iPhone 15 фейк-скидка", action: "test-product", payload: "iphone15" },
          { label: "📱 Redmi Note 13 реальная скидка", action: "test-product", payload: "redminote13" },
          { label: "💆 Dyson Airwrap накрутка!", action: "test-product", payload: "dyson" }
        ]
      }
    ]);
    setActiveProduct(null);
    setIsImpulsiveActive(false);
    setIsComparing(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Dynamic Upper Accent Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg ring-4 ring-indigo-500/10">
              <Shield className="w-6 h-6 text-slate-100" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                🛡️ Цифровой Адвокат Onliner
              </h1>
              <p className="text-xs text-slate-400 font-sans">
                Интеллектуальная защита покупателей и мониторинг честных цен
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              Live API готов
            </span>
            <button 
              onClick={cleanChat} 
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700/80 rounded-xl transition-all border border-slate-700/50 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Сбросить диалог
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-6">
        
        {/* Dynamic National Buyer Protection Stats Widget */}
        <StatsDashboard stats={stats} />

        {/* Dynamic Concept Explainer & Position Statement Card */}
        <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-indigo-200">Философия проекта «Цифровой Адвокат покупателя»</h3>
              <p className="text-xs text-slate-300 max-w-3xl mt-0.5 leading-relaxed">
                Мы принципиально <strong>НЕ хвалим</strong> плохие товары ради продаж или реферальных ссылок. Наша миссия — жесткий, беспристрастный анализ и сухая статистика. Live-режим использует текущие данные Onliner, график минимальных цен и явные источники без фейковых 90-дневных обещаний.
              </p>
            </div>
          </div>
          <div className="flex space-x-2 w-full md:w-auto shrink-0">
            <button 
              onClick={() => setActiveTab("bot")}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                activeTab === "bot" 
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/10" 
                  : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
              }`}
            >
              🤖 Чат-Бот
            </button>
            <button 
              onClick={() => setActiveTab("channel")}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                activeTab === "channel" 
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/10" 
                  : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
              }`}
            >
              📢 Телеграм-Канал
            </button>
          </div>
        </div>

        {/* Dual Pane Layout wrapper (Responsive tabs support for mobile view but full dual desktop visibility!) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT COLUMN: TELEGRAM CHAT BOT SIMULATOR */}
          <section className={`lg:col-span-7 flex flex-col bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden min-h-[620px] ${activeTab === "bot" ? "block" : "hidden lg:flex"}`}>
            
            {/* Bot Header bar mimicking Telegram Header */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-slate-100 shadow-inner">
                  🛡️
                </div>
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-1.5 text-slate-200">
                    Onliner Advocate Bot <span className="text-[10px] py-0.5 px-1.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">BOT</span>
                  </h4>
                  <p className="text-xs text-slate-400">@OnlinerAdvocated_ai_bot</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-sans hidden sm:inline">Лимиты задаются сервером/env</span>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse"></span>
              </div>
            </div>

            {/* Simulated Live Track Indicator */}
            {isImpulsiveActive && activeProduct && (
              <div className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-900/30 text-xs flex items-center justify-between text-indigo-300 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="animate-spin text-indigo-400">🧘</span>
                  <span><strong>Режим контроля трат:</strong> {activeProduct.title} (День {daysTracked} из 3)</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={handleIncreaseTrackedDays}
                    className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded text-[10px] font-semibold transition"
                  >
                    ⏩ Прокрутить день
                  </button>
                  <button 
                    onClick={() => setIsImpulsiveActive(false)}
                    className="text-slate-400 hover:text-slate-200 p-0.5"
                    title="Выйти из режима"
                  >
                    ❌
                  </button>
                </div>
              </div>
            )}

            {/* Quick-test Presets Panel */}
            <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 shrink-0 flex items-center flex-wrap gap-2">
              <span className="text-xs text-slate-300 flex items-center gap-1 font-medium"><Clock className="w-3.5 h-3.5 text-indigo-400" /> Быстрые тесты:</span>
              <button 
                onClick={() => handleActionClick("test-product", "iphone15")}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-all text-[11px]"
              >
                🍎 iPhone 15 (Фейк-скидка)
              </button>
              <button 
                onClick={() => handleActionClick("test-product", "redminote13")}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-all text-[11px]"
              >
                📱 Redmi Note 13 (Честная скидка)
              </button>
              <button 
                onClick={() => handleActionClick("test-product", "dyson")}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-all text-[11px]"
              >
                💆 Dyson (Накрутка цены перед акцией)
              </button>
            </div>

            {/* Conversation Core Flow Area */}
            <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col justify-between max-h-[460px]">
              
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${
                      msg.sender === "user" ? "self-end items-end ml-auto" : "self-start items-start mr-auto"
                    }`}
                  >
                    <div 
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        msg.sender === "user" 
                          ? "bg-indigo-600 text-slate-100 rounded-tr-none" 
                          : msg.sender === "system"
                            ? "bg-red-950/45 text-red-250 border border-red-900/40"
                            : "bg-slate-900 text-slate-200 border border-slate-800/80 rounded-tl-none font-sans"
                      }`}
                    >
                      {/* Message Text Rendering equipped to understand emojis */}
                      <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                      
                      {/* Product details inline helper */}
                      {msg.type === "product_card" && (() => {
                        const msgProduct = products.find(p => p.id === msg.productId) || activeProduct;
                        if (!msgProduct) return null;
                        return (
                          <div className="mt-4 p-4 bg-slate-950/85 border border-slate-800 rounded-xl space-y-4 shadow-xl">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center space-x-3">
                                <img src={msgProduct.imageUrl} className="w-16 h-16 object-cover rounded-lg border border-slate-850" alt="" />
                                <div>
                                  <h5 className="font-bold text-sm text-slate-100 line-clamp-2">{msgProduct.title}</h5>
                                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                                    <span>⭐ {msgProduct.rating} ({msgProduct.ratingCount} отзыва)</span>
                                    <span className="text-slate-700">|</span>
                                    <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-[10px] text-indigo-300">{msgProduct.category}</span>
                                  </p>
                                </div>
                              </div>
                              <a href={msgProduct.url} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                            
                            {/* Financial facts */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800/80">
                                <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-wider">Магазин просит</span>
                                <span className="text-xs sm:text-sm font-black text-slate-400 line-through block mt-0.5">
                                  {msgProduct.originalPrice} BYN
                                </span>
                              </div>
                              <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800/85">
                                <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-wider">Адвокатская честная</span>
                                <span className="text-xs sm:text-sm font-black text-slate-300 block mt-0.5">
                                  {msgProduct.medianPrice90Days} BYN
                                </span>
                              </div>
                              <div className="bg-slate-900/50 p-2 rounded-xl border border-indigo-950">
                                <span className="text-[9px] text-indigo-400 block uppercase font-mono tracking-wider">Твоя Сделка</span>
                                <span className="text-xs sm:text-sm font-black text-indigo-200 block mt-0.5">
                                  {msgProduct.currentPrice} BYN
                                </span>
                              </div>
                            </div>

                            {/* Index score panel */}
                            <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                              msgProduct.isFakeDiscount
                                ? "bg-rose-950/20 border-rose-900/30 text-rose-300"
                                : "bg-emerald-950/20 border-emerald-900/30 text-emerald-300"
                            }`}>
                              <div className="flex items-center gap-2">
                                {msgProduct.isFakeDiscount ? (
                                  <AlertTriangle className="w-5 h-5 text-rose-450 shrink-0" />
                                ) : (
                                  <Check className="w-5 h-5 text-emerald-450 shrink-0" />
                                )}
                                <div>
                                  <strong className="block font-semibold">
                                    {msgProduct.isFakeDiscount ? "СКИДКА НЕ ПОДТВЕРЖДЕНА ИСТОРИЕЙ" : "ЦЕНА НИЖЕ МЕДИАНЫ"}
                                  </strong>
                                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                                    {msgProduct.isFakeDiscount 
                                      ? (msgProduct.priceManipulationWarning || `Заявленный дисконт слабее реального движения графика`)
                                      : `Выгода -${msgProduct.honestDiscountPercent}% относительно исторической медианы`
                                    }
                                  </span>
                                </div>
                              </div>
                              <div className={`text-right ${
                                msgProduct.isFakeDiscount ? "text-rose-400" : "text-emerald-400"
                              } shrink-0`}>
                                <span className="text-[9px] uppercase font-mono block text-slate-400">Честный индекс</span>
                                <span className="text-base sm:text-lg font-black font-mono">
                                  {msgProduct.isFakeDiscount ? "12/100" : "94/100"}
                                </span>
                              </div>
                            </div>

                            {msgProduct.reviewEvidence && (
                              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/45 text-xs space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                                    <MessageSquare className="w-4 h-4 text-indigo-400" /> Отзывы Onliner
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {msgProduct.reviewEvidence.processedCount}/{msgProduct.reviewEvidence.totalCount || msgProduct.reviewEvidence.processedCount}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Чаще хвалят</span>
                                    <ul className="mt-1 space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                                      {(msgProduct.reviewEvidence.topPros.length ? msgProduct.reviewEvidence.topPros.map(reviewInsightLabel) : msgProduct.pros).slice(0, 3).map((item, index) => (
                                        <li key={index}>{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-rose-400 font-bold uppercase">Чаще ругают</span>
                                    <ul className="mt-1 space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                                      {(msgProduct.reviewEvidence.topCons.length ? msgProduct.reviewEvidence.topCons.map(reviewInsightLabel) : msgProduct.cons).slice(0, 3).map((item, index) => (
                                        <li key={index}>{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Visual Graph insertion under the card */}
                            <PriceHistoryChart 
                              currentPrice={msgProduct.currentPrice}
                              originalPrice={msgProduct.originalPrice}
                              medianPrice90Days={msgProduct.medianPrice90Days}
                              isFakeDiscount={msgProduct.isFakeDiscount}
                              productTitle={msgProduct.title}
                              medianWindowLabel={msgProduct.priceEvidence?.medianWindowLabel}
                              priceHistory={msgProduct.priceHistory}
                            />
                          </div>
                        );
                      })()}

                      {/* Summary of reviews visual card */}
                      {msg.type === "rating_summary" && (() => {
                        const msgProduct = products.find(p => p.id === msg.productId) || activeProduct;
                        return (
                          <div className="mt-4 p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4 text-left w-full">
                            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                              <MessageSquare className="w-4 h-4 text-indigo-400" />
                              <h6 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider font-mono">Анализ суждений владельцев</h6>
                            </div>
                            
                            {(() => {
                              const parsed = parseBulletPoints(msg.text);
                              return (
                                <div className="space-y-3.5">
                                  {parsed.mainVerdict && (
                                    <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 text-xs text-slate-350 leading-relaxed">
                                      <span className="text-[10px] text-indigo-400 font-mono block mb-1 uppercase tracking-wider">Адвокатский Вердикт по отзывам:</span>
                                      {parsed.mainVerdict}
                                    </div>
                                  )}
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="p-3 bg-emerald-950/10 border border-emerald-900/30 rounded-xl space-y-2">
                                      <span className="text-[11px] text-emerald-400 font-bold block flex items-center gap-1">
                                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-405" /> НАРОДНЫЕ ПЛЮСЫ:
                                      </span>
                                      <ul className="space-y-1 text-slate-300 list-disc list-inside">
                                        {parsed.pros.map((p, i) => <li key={i} className="leading-relaxed text-[11px]">{p}</li>)}
                                      </ul>
                                    </div>

                                    <div className="p-3 bg-rose-950/10 border border-rose-900/30 rounded-xl space-y-2">
                                      <span className="text-[11px] text-rose-450 font-bold block flex items-center gap-1">
                                        <ThumbsDown className="w-3.5 h-3.5 text-rose-405" /> СКРЫТЫЕ ЖАЛОБЫ:
                                      </span>
                                      <ul className="space-y-1 text-slate-300 list-disc list-inside">
                                        {parsed.cons.map((c, i) => <li key={i} className="leading-relaxed text-[11px]">{c}</li>)}
                                      </ul>
                                    </div>
                                  </div>
                                  
                                  <span className="text-[9px] text-slate-500 italic block text-right">
                                    * Предоставлено ИИ на основе анализа оценок {msgProduct?.ratingCount || 100}+ покупателей.
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })()}

                      {/* Device comparison visual card */}
                      {msg.type === "comparison" && (() => {
                        const msgProduct = products.find(p => p.id === msg.productId) || activeProduct;
                        return (
                          <div className="mt-4 p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3.5 text-left w-full">
                            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                              <RefreshCw className="w-4 h-4 text-amber-500" />
                              <h6 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider font-mono">Цифровое Сравнение гаджетов</h6>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 items-center text-center">
                              <div className="p-2.5 bg-slate-900/70 rounded-xl border border-slate-800/80 text-xs">
                                <span className="text-[9px] text-slate-500 block font-mono">ТВОЙ АППАРАТ</span>
                                <span className="font-bold text-slate-350 mt-1 block">Текущее устройство</span>
                              </div>
                              <div className="p-2.5 bg-indigo-950/20 rounded-xl border border-indigo-900/40 text-xs">
                                <span className="text-[9px] text-indigo-400 block font-mono">НОВЫЙ КАНДИДАТ</span>
                                <span className="font-bold text-indigo-200 mt-1 block line-clamp-1">{msgProduct?.title || "Новый товар"}</span>
                              </div>
                            </div>
                            
                            <div className="p-3.5 bg-slate-900/50 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                              {msg.text}
                            </div>

                            <div className="p-2.5 bg-indigo-950/20 border border-indigo-900/30 rounded-xl flex items-center justify-between text-xs text-indigo-250">
                              <span className="font-bold">Мнение ИИ-Защитника:</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider font-extrabold ${
                                msg.text.includes("ОТКАЗАТЬСЯ") || msg.text.includes("не стоит") || msg.text.includes("НЕРАЦИОНАЛЬНО") || msg.text.includes("не оправдан")
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              }`}>
                                {msg.text.includes("ОТКАЗАТЬСЯ") || msg.text.includes("не стоит") || msg.text.includes("НЕРАЦИОНАЛЬНО") || msg.text.includes("не оправдан")
                                  ? "⛔ СТРОГИЙ ОТКАЗ"
                                  : "✓ РЕКОМЕНДУЕМАЯ ТРАТА"
                                }
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Anti-impulse quarantine cooling card */}
                      {msg.type === "pulse_tracker" && (() => {
                        const msgProduct = products.find(p => p.id === msg.productId) || activeProduct;
                        if (!msgProduct) return null;
                        return (
                          <div className="mt-4 p-4 bg-gradient-to-br from-indigo-950/30 via-slate-950 to-slate-950 border border-indigo-900/40 rounded-xl space-y-4 text-left w-full shadow-2xl relative overflow-hidden">
                            <div className="absolute right-3 top-3 opacity-5 pointer-events-none">
                              <Thermometer className="w-20 h-20 text-indigo-400" />
                            </div>

                            <div className="flex items-center space-x-2 border-b border-indigo-900/25 pb-2">
                              <Thermometer className="w-4 h-4 text-indigo-400" />
                              <div>
                                <h6 className="text-[11px] font-bold text-slate-200 uppercase tracking-widest font-mono">Карантин эмоциональных покупок</h6>
                                <p className="text-[9px] text-slate-400">Программа детоксикации бюджета</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 items-center">
                              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                                <span className="text-[9px] font-mono uppercase text-slate-400 block pb-1">Дни выдержки</span>
                                <span className="text-lg font-black text-indigo-400">День {daysTracked} из 3</span>
                                <div className="w-full bg-slate-950 h-1.5 rounded-full mt-2 overflow-hidden">
                                  <div 
                                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${(daysTracked / 3) * 100}%` }}
                                  />
                                </div>
                              </div>
                              
                              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                                <span className="text-[9px] font-mono uppercase text-slate-400 block pb-1">Сбережено сейчас</span>
                                <span className="text-lg font-black text-emerald-400 block font-mono">+{msgProduct.currentPrice} BYN</span>
                              </div>
                            </div>

                            <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 text-xs text-slate-350">
                              <div className="flex justify-between font-mono text-[9px] text-slate-400 mb-1.5">
                                <span>Шкала желания:</span>
                                <span className="font-bold text-indigo-300">
                                  {daysTracked === 1 ? "🔥 ПИК ВСПЫШКИ (80%)" : daysTracked === 2 ? "📈 ОХЛАЖДЕНИЕ (35%)" : "❄️ РАЗУМ ПОБЕДИЛ (5%)"}
                                </span>
                              </div>
                              <div className="flex gap-1 h-2">
                                <div className={`flex-1 rounded-sm ${daysTracked >= 1 ? "bg-red-500" : "bg-slate-850"}`} />
                                <div className={`flex-1 rounded-sm ${daysTracked >= 2 ? "bg-yellow-500" : "bg-slate-850"}`} />
                                <div className={`flex-1 rounded-sm ${daysTracked >= 3 ? "bg-emerald-500" : "bg-slate-850"}`} />
                              </div>
                            </div>

                            {/* Interactive reasoning helper inside */}
                            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-xs space-y-2.5">
                              <span className="font-bold text-slate-200 block text-[10px] uppercase font-mono tracking-wider text-indigo-300 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Твое испытание разума:
                              </span>
                              <p className="text-[10px] text-slate-405 leading-snug">
                                Бот одобрит сделку, только если ты укажешь 3 технические причины, почему твой старый гаджет физически мертв:
                              </p>
                              
                              <div className="space-y-1.5">
                                <input
                                  type="text"
                                  placeholder="Причина 1 (например: батарея держит 1 час)"
                                  className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded-lg text-[11px] focus:outline-none focus:border-indigo-600 text-slate-200 placeholder:text-slate-600"
                                />
                                <input
                                  type="text"
                                  placeholder="Причина 2 (например: разбита камера)"
                                  className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded-lg text-[11px] focus:outline-none focus:border-indigo-600 text-slate-200 placeholder:text-slate-600"
                                />
                                <input
                                  type="text"
                                  placeholder="Причина 3 (например: экран мерцает и гаснет)"
                                  className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded-lg text-[11px] focus:outline-none focus:border-indigo-600 text-slate-200 placeholder:text-slate-600"
                                />
                              </div>

                              <button
                                onClick={() => {
                                  setMessages(prev => [
                                    ...prev,
                                    {
                                      id: "audit-user-trigger-" + Date.now(),
                                      sender: "user",
                                      text: "⚖️ Запустить экспертизу моих причин перехода на " + msgProduct.title,
                                      timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
                                    },
                                    {
                                      id: "audit-bot-resp-" + Date.now(),
                                      sender: "bot",
                                      text: `🛡️ **ИИ-АНАЛИЗ ТВОЕЙ АРГУМЕНТАЦИИ:**\n\n1. *"Батарея держит 1 час"* — это физический износ. Оригинальная замена обойдется в **90 BYN** в любом сервисном центре, а ты собрался тратить **${msgProduct.currentPrice} BYN**. Чистая переплата из-за одной детали = **${msgProduct.currentPrice - 90} BYN**!\n\n2. *"Разбита камера"* — если треснуло внешнее стекло, замена стекла стоит копейки. Если сам модуль — ремонт стоит ~150 BYN. \n\n🔒 **ОБЪЕКТИВНЫЙ ВЕРДИКТ ЦИФРОВОГО АДВОКАТА:** \nРациональность входа в сделку = **15%**. Трат эмоциями обнаружено много, реальной технической нужды — нет. Рекомендуется подержать карантин еще 24 часа. Спасенный бюджет сегодня: **${msgProduct.currentPrice} BYN**!`,
                                      timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
                                    }
                                  ]);
                                }}
                                className="w-full py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-slate-100 rounded-lg text-[10px] font-bold uppercase transition flex items-center justify-center gap-1 tracking-wider"
                              >
                                <SparklesIcon className="w-3.5 h-3.5" /> Проверить причины на ИИ-полиграфе
                              </button>
                            </div>

                            {daysTracked < 3 && (
                              <button
                                onClick={handleIncreaseTrackedDays}
                                className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold rounded-lg text-slate-300 transition-all flex items-center justify-center gap-1"
                              >
                                ⏩ Прокрутить день карантина
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Interactive Bot Action Buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 justify-start w-full">
                        {msg.actions.map((act, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(act.action, act.payload)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-indigo-300 rounded-xl text-xs font-semibold border border-slate-800 hover:border-indigo-900/60 transition-all flex items-center space-x-1 shadow-sm"
                          >
                            <span>{act.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="text-[9px] text-slate-500 mt-1 px-1 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {isSendingMessage && (
                  <div className="flex flex-col self-start items-start max-w-[80%] mr-auto">
                    <div className="p-3 bg-slate-900 rounded-2xl rounded-tl-none border border-slate-800 flex items-center space-x-2 text-xs text-slate-400">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-450 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                      <span>Адвокат анализирует данные Onliner...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Scroll anchor */}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Inputs & Manual verification forms */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-3 shrink-0">
              
              {/* If comparison is triggered */}
              {isComparing && (
                <div className="p-2 bg-amber-950/20 border border-amber-900/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Какое твое текущее устройство?
                    </span>
                    <button onClick={() => setIsComparing(false)} className="text-[10px] text-slate-400 hover:text-slate-200">Отмена</button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userOldDevice}
                      onChange={(e) => setUserOldDevice(e.target.value)}
                      placeholder="Например: iPhone 11 или Redmi Note 9"
                      className="flex-1 px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder:text-slate-500 outline-none"
                    />
                    <button
                      onClick={executeComparison}
                      className="px-3 bg-amber-600 hover:bg-amber-500 text-slate-100 rounded-xl text-xs font-semibold transition"
                    >
                      Сравнить
                    </button>
                  </div>
                </div>
              )}

              {/* Manual URL check form */}
              <form onSubmit={handleAnalyzeLink} className="flex gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-850">
                <div className="flex-1 flex items-center pl-2">
                  <Search className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={customLink}
                    onChange={(e) => setCustomLink(e.target.value)}
                    placeholder="Вставь ссылку Onliner.by или напиши товар..."
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAnalyzing || !customLink.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-slate-100 rounded-xl text-xs font-bold transition flex items-center space-x-1 shrink-0"
                >
                  {isAnalyzing ? "..." : "Проверить"}
                </button>
              </form>

              {/* Standard text dialog form */}
              <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={inputText}
                  placeholder="Спроси адвоката... (например: 'что такое OLED экрана?')"
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-indigo-500 text-slate-100 placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={isSendingMessage || !inputText.trim()}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-indigo-400 hover:text-indigo-300 rounded-xl transition"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </form>
              
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
                <span>🛡️ Цифровая защита граждан СНГ</span>
                <span>Onliner.by Buyer Advocate Protocol v1.4</span>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: TELEGRAM CHANNEL BROADCAST SIMULATOR */}
          <section className={`lg:col-span-5 flex flex-col bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden min-h-[620px] ${activeTab === "channel" ? "block" : "hidden lg:flex"}`}>
            
            {/* Channel Header (Open Media resource) */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center font-bold text-slate-100 shadow-lg">
                  📢
                </div>
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-1 text-slate-200">
                    Честный Onliner | Скидки <span className="text-[10px] bg-red-500/10 text-rose-300 px-1 py-0.5 rounded font-mono">CHANNEL</span>
                  </h4>
                  <p className="text-xs text-rose-400">канал готов к подключению • dry-run без токена</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 font-mono lowercase">no ads</span>
            </div>

            {/* CHANNEL AUTONOMOUS ADMIN CONTROLLER (Allows posting deals manually with level of critique!) */}
            <div className="p-3.5 bg-slate-950/70 border-b border-slate-800/80 space-y-3.5 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-200 font-bold flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-500" /> ИИ-Редактор Канала (Панель Администратора)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Автономный постинг</span>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-sans">Admin token для production-действий:</label>
                <input
                  type="password"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                  placeholder="ADMIN_API_TOKEN"
                  className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-700 placeholder:text-slate-600"
                />
                {channelAdminMessage && (
                  <p className="mt-1 text-[10px] text-amber-300 leading-tight">{channelAdminMessage}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 font-sans">Выбери товар из каталога:</label>
                  <select
                    value={selectedProductForPost}
                    onChange={(e) => setSelectedProductForPost(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-slate-200 focus:outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title.substring(0, 32)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 font-sans">Уровень критики ИИ:</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(["mild", "normal", "roast"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setCriticLevel(lvl)}
                        className={`py-2 rounded-lg text-[10px] font-bold border transition ${
                          criticLevel === lvl 
                            ? "bg-rose-900/30 text-rose-400 border-rose-800" 
                            : "bg-slate-900 text-slate-400 border-slate-800/50 hover:bg-slate-800"
                        }`}
                      >
                        {lvl === "mild" ? "Мягкий" : lvl === "normal" ? "Стандарт" : "🔥 РОЗНЕС"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGeneratePost}
                disabled={isGeneratingPost || !selectedProductForPost}
                className="w-full py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 disabled:opacity-40 text-slate-100 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 shadow-md shadow-rose-900/15"
              >
                {isGeneratingPost ? (
                  <span>Генерирую ИИ-обзор...</span>
                ) : (
                  <>
                    <span>🤖 Опубликовать скидку в канал</span>
                    <span className="text-[10px] opacity-75">(без накруток)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleTelegramDoctor}
                disabled={isCheckingTelegram}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 border border-slate-800"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{isCheckingTelegram ? "Проверяю Telegram..." : "Проверить Telegram readiness"}</span>
              </button>

              <button
                type="button"
                onClick={handleOnlinerDoctor}
                disabled={isCheckingOnliner}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 border border-slate-800"
              >
                <Search className="w-4 h-4 text-sky-300" />
                <span>{isCheckingOnliner ? "Проверяю Onliner..." : "Проверить Onliner live/cache"}</span>
              </button>
            </div>

            {/* CHANNEL BROADCAST FEED */}
            <div className="flex-1 p-4 overflow-y-auto space-y-6 max-h-[460px] bg-slate-950/20">
              
              {channelPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="p-3 bg-slate-900 rounded-2xl text-slate-400">
                    <Search className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Настоящих скидок свыше 20% сегодня пока не обнаружено. Патруль продолжает парсинг каталога Onliner.by...
                  </p>
                </div>
              ) : (
                channelPosts.map((post) => (
                  <div key={post.id} className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-xl">
                    
                    {/* Header: Integrity Badge */}
                    <div className="px-4 py-2.5 bg-slate-950 flex items-center justify-between border-b border-slate-850">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-450 font-mono">
                        🔥 Честный Дисконт Патруль
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        post.honestyScore < 30 ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {post.honestyVerdict} (Индекс: {post.honestyScore}/100)
                      </span>
                    </div>

                    {/* Post Image Block */}
                    <div className="p-4 space-y-3.5">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-mono">{post.category}</span>
                          <h5 className="font-bold text-sm text-slate-100 mt-0.5">{post.title}</h5>
                        </div>
                      </div>

                      {/* Advertised discount vs Real gain comparison */}
                      <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-850">
                        <div>
                          <span className="text-[10px] text-slate-500 block font-mono">Рекламная вывеска</span>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-lg font-bold text-red-400">-{post.advertisedDiscount}%</span>
                            <span className="text-[10px] text-slate-400 line-through">от {post.currentPrice + Math.round(post.currentPrice*0.3)} BYN</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-mono">Жесткий ИИ-подсчет</span>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className={`text-lg font-bold ${post.realDiscount <= 1 ? "text-red-400" : "text-emerald-400"}`}>
                              {post.realDiscount > 0 ? `-${post.realDiscount}%` : `${post.realDiscount}%`}
                            </span>
                            <span className="text-[10px] text-slate-400">от медианы ({post.regularPrice} BYN)</span>
                          </div>
                        </div>
                      </div>

                      {/* Pros & Cons summary */}
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 bg-emerald-950/10 border border-emerald-900/35 rounded-xl text-slate-300">
                          <strong className="text-emerald-400 text-[11px] block mb-1">✅ НАРОДНЫЕ ПЛЮСЫ:</strong>
                          <p className="leading-relaxed">{post.pros}</p>
                        </div>
                        <div className="p-2.5 bg-red-950/15 border border-red-900/35 rounded-xl text-slate-300">
                          <strong className="text-red-400 text-[11px] block mb-1">❌ СТРЕМНЫЕ МИНУСЫ (ЧЕСТНО):</strong>
                          <p className="leading-relaxed">{post.cons}</p>
                        </div>
                      </div>

                      {/* Editorial verdict written by Gemini */}
                      <div className="p-3 bg-slate-950 rounded-xl text-xs space-y-1 text-slate-300 border border-slate-850">
                        <span className="text-[10px] uppercase font-mono block text-amber-400">🛡️ ВЕРДИКТ ЦИФРОВОГО АДВОКАТА:</span>
                        <div className="whitespace-pre-line leading-relaxed">{post.buyerAdvocateVerdict}</div>
                      </div>

                      {/* Footer bar with Views & Likes */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-[11px] text-slate-400">
                        <div className="flex items-center space-x-3.5">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> {post.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" /> {post.commentsCount} комм.
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button 
                            type="button"
                            onClick={() => handleLikePost(post.id)}
                            className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 font-semibold rounded-lg flex items-center gap-1 border border-slate-850 hover:text-rose-450 transition-all"
                          >
                            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/10" /> Класс
                          </button>
                          <button 
                            type="button"
                            className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 font-semibold rounded-lg flex items-center gap-1 border border-slate-850 transition-all"
                          >
                            <Share2 className="w-3.5 h-3.5" /> Поделиться
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>
                ))
              )}

            </div>
          </section>

        </div>

      </main>

      {/* Applet Footer copyright limits */}
      <footer className="border-t border-slate-800 bg-slate-900/40 p-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>🛡️ Честный ИИ-Адвокат Onliner.by — Позиционирование абсолютной непредвзятости</span>
          <span className="font-mono">Неофициальный проект AI_Nikitka93 • 2026.</span>
        </div>
      </footer>

    </div>
  );
}

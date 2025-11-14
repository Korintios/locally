import StatusAPI from "./components/statusApi";
import ChatBar from "./components/chatbar/chatBar";
import { useState, useEffect, useRef } from "react";
import "highlight.js/styles/github-dark.css"; // Estilo para código
import { fetchHistory, saveMessagesInAPI } from "./lib/api";
import ChatWithIA from "./components/chatWithIA";

function App() {
	const [prompt, setPrompt] = useState("");
	const [messages, setMessages] = useState(history ? history : []);
	const [isLoadingHistory, setIsLoadingHistory] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const chatContainerRef = useRef(null);

	useEffect(() => {
        const loadHistory = async () => {
			setIsLoadingHistory(true);
            const history = await fetchHistory();
            if (history) {
				console.log("Historial cargado:", history);
                setMessages(history);
            }
			setIsLoadingHistory(false);
        };
        loadHistory();
    }, []);

	async function handleSubmit() {
		if (!prompt.trim()) return;

		const userMessage = {
			role: "user",
			content: prompt,
			timestamp: new Date().toISOString(),
		};

		// Agregar mensaje del usuario
		setMessages((prev) => [...prev, userMessage]);
		setPrompt("");
		setIsLoading(true);

		// Paso final: enviar mensajes al backend y manejar la respuesta.
		await saveMessagesInAPI(prompt, setMessages, setIsLoading);
	}

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col relative">
			{/* StatusAPI flotante */}
			<div className="fixed top-4 right-4 z-50 pointer-events-none">
				<div className="pointer-events-auto">
					<StatusAPI />
				</div>
			</div>

			{/* Área de chat con scroll */}
			<div
				ref={chatContainerRef}
				className="flex-1 w-full overflow-y-auto pb-32 pt-8 px-4"
			>
				{!isLoadingHistory && (
					<ChatWithIA messages={messages} isLoading={isLoading} />
				)}
			</div>

			{/* ChatBar flotante en la parte inferior */}
			<div className="fixed bottom-0 left-0 right-0 bg-linear-to-t from-gray-50 via-gray-50 to-transparent pt-4 pb-6 px-4">
				<div className="max-w-4xl w-full mx-auto">
					<ChatBar
						value={prompt}
						onChange={setPrompt}
						onSubmit={handleSubmit}
						isLoading={isLoading}
					/>
				</div>
			</div>
		</div>
	);
}

export default App;

import StatusAPI from "./components/statusApi";
import ChatBar from "./components/chatbar/chatBar";
import Sidebar from "./components/sidebar/Sidebar";
import { useState, useEffect, useRef } from "react";
import "highlight.js/styles/github-dark.css"; // Estilo para código
import {
	fetchConversations,
	fetchConversationMessages,
	createConversation,
	renameConversation,
	deleteConversation,
	saveMessagesInAPI,
} from "./lib/api";
import ChatWithIA from "./components/chatWithIA";

function App() {
	// Estados principales
	const [prompt, setPrompt] = useState("");
	const [messages, setMessages] = useState([]);
	const [conversations, setConversations] = useState([]);
	const [currentConversationId, setCurrentConversationId] = useState(null);
	const [isLoadingConversations, setIsLoadingConversations] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const chatContainerRef = useRef(null);

	/**
	 * Efecto inicial: Cargar todas las conversaciones al montar el componente.
	 */
	useEffect(() => {
		const loadConversations = async () => {
			setIsLoadingConversations(true);
			const convs = await fetchConversations();
			setConversations(convs);
			setIsLoadingConversations(false);
		};
		loadConversations();
	}, []);

	/**
	 * Efecto para hacer scroll automático al final cuando hay nuevos mensajes.
	 */
	useEffect(() => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop =
				chatContainerRef.current.scrollHeight;
		}
	}, [messages]);

	/**
	 * Maneja la selección de una conversación del historial.
	 * Carga los mensajes de esa conversación.
	 */
	const handleSelectConversation = async (conversationId) => {
		if (conversationId === currentConversationId) return;

		setCurrentConversationId(conversationId);
		const msgs = await fetchConversationMessages(conversationId);
		setMessages(msgs);
	};

	/**
	 * Maneja la creación de una nueva conversación.
	 * Limpia el chat actual y prepara para una nueva conversación.
	 */
	const handleNewConversation = async () => {
		// Simplemente limpiar el estado, la conversación se creará al enviar el primer mensaje
		setCurrentConversationId(null);
		setMessages([]);
		setPrompt("");
	};

	/**
	 * Maneja el renombrado de una conversación.
	 */
	const handleRenameConversation = async (conversationId, newTitle) => {
		const success = await renameConversation(conversationId, newTitle);
		if (success) {
			// Actualizar la lista de conversaciones
			setConversations((prev) =>
				prev.map((conv) =>
					conv._id === conversationId
						? { ...conv, title: newTitle, updated_at: new Date().toISOString() }
						: conv
				)
			);
		}
	};

	/**
	 * Maneja la eliminación de una conversación.
	 */
	const handleDeleteConversation = async (conversationId) => {
		const success = await deleteConversation(conversationId);
		if (success) {
			// Actualizar la lista de conversaciones
			setConversations((prev) =>
				prev.filter((conv) => conv._id !== conversationId)
			);

			// Si la conversación eliminada es la actual, limpiar el chat
			if (conversationId === currentConversationId) {
				setCurrentConversationId(null);
				setMessages([]);
			}
		}
	};

	/**
	 * Maneja el envío de un mensaje.
	 * Si no hay conversación actual, se creará una nueva automáticamente.
	 */
	async function handleSubmit() {
		if (!prompt.trim()) return;

		const userMessage = {
			role: "user",
			content: prompt,
			timestamp: new Date().toISOString(),
		};

		// Agregar mensaje del usuario al estado local
		setMessages((prev) => [...prev, userMessage]);
		setPrompt("");
		setIsLoading(true);

		// Enviar mensaje al backend
		const resultConversationId = await saveMessagesInAPI(
			prompt,
			currentConversationId,
			setMessages,
			setIsLoading,
			setCurrentConversationId
		);

		// Si se creó una nueva conversación, actualizar la lista
		if (
			resultConversationId &&
			resultConversationId !== currentConversationId
		) {
			const convs = await fetchConversations();
			setConversations(convs);
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 flex relative">
			{/* Sidebar */}
			<div
				className={`transition-all duration-300 ${
					isSidebarCollapsed ? "w-12" : "w-64"
				}`}
			>
				<Sidebar
					conversations={conversations}
					currentConversationId={currentConversationId}
					onSelectConversation={handleSelectConversation}
					onNewConversation={handleNewConversation}
					onRenameConversation={handleRenameConversation}
					onDeleteConversation={handleDeleteConversation}
					isCollapsed={isSidebarCollapsed}
					onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
				/>
			</div>

			{/* Área principal de chat */}
			<div className="flex-1 flex flex-col">
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
					{isLoadingConversations ? (
						<div className="flex items-center justify-center h-full">
							<div className="text-gray-500 font-afacad">
								Cargando conversaciones...
							</div>
						</div>
					) : (
						<ChatWithIA messages={messages} isLoading={isLoading} />
					)}
				</div>

				{/* ChatBar flotante en la parte inferior */}
				<div
					className="fixed bottom-0 right-0 bg-linear-to-t from-gray-50 via-gray-50 to-transparent pt-4 pb-6 px-4"
					style={{
						left: isSidebarCollapsed ? "3rem" : "16rem",
					}}
				>
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
		</div>
	);
}

export default App;

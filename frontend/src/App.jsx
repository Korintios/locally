import { Button, Input } from "@heroui/react";
import StatusAPI from "./components/StatusAPI";
import ChatBar from "./components/ChatBar/ChatBar";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css"; // Estilo para código

function App() {
	const [prompt, setPrompt] = useState("");
	const [messages, setMessages] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const chatContainerRef = useRef(null);

	// Cargar mensajes del localStorage al montar el componente
	useEffect(() => {
		const savedMessages = localStorage.getItem("chatMessages");
		if (savedMessages) {
			try {
				setMessages(JSON.parse(savedMessages));
			} catch (error) {
				console.error("Error al cargar mensajes:", error);
			}
		}
	}, []);

	// Guardar mensajes en localStorage cada vez que cambien
	useEffect(() => {
		if (messages.length > 0) {
			localStorage.setItem("chatMessages", JSON.stringify(messages));
		}
	}, [messages]);

	// Scroll automático hacia abajo cuando hay nuevos mensajes
	useEffect(() => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop =
				chatContainerRef.current.scrollHeight;
		}
	}, [messages, isLoading]);

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

		try {
			// Enviar el prompt al backend
			const response = await fetch("http://localhost:8000/api/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ message: prompt }),
			});
			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			let assistantResponse = "";
			const assistantMessage = {
				role: "assistant",
				content: "",
				timestamp: new Date().toISOString(),
			};

			// Agregar mensaje vacío del asistente
			setMessages((prev) => [...prev, assistantMessage]);

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				const lines = chunk.split("\n");

				for (const line of lines) {
					if (line.startsWith("data: ")) {
						const data = JSON.parse(line.substring(6));

						if (data.content) {
							setIsLoading(false);

							assistantResponse += data.content;
							// Actualizar el último mensaje (el del asistente)
							setMessages((prev) => {
								const newMessages = [...prev];
								newMessages[newMessages.length - 1] = {
									...newMessages[newMessages.length - 1],
									content: assistantResponse,
								};
								return newMessages;
							});
						}
						if (data.done) {
							setIsLoading(false);
						}
					}
				}
			}
		} catch (error) {
			// Manejo de errores
			console.error("Error al enviar el prompt:", error);
			setIsLoading(false);
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: "Error al conectar con el servidor.",
					timestamp: new Date().toISOString(),
				},
			]);
		}
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
				<div className="max-w-4xl mx-auto space-y-6">
					{messages.map((message, index) => (
						<div
							key={index}
							className={`flex ${
								message.role === "user" ? "justify-end" : "justify-start"
							}`}
						>
							<div
								className={`max-w-[80%] rounded-full px-3 py-2 ${
									message.role === "user" ? "bg-blue-100 text-black" : ""
								}`}
							>
								{message.role === "user" ? (
									<p className="whitespace-pre-wrap font-afacad text-base">
										{message.content}
									</p>
								) : (
									<div className="prose prose-sm max-w-none font-afacad">
										<ReactMarkdown
											remarkPlugins={[remarkGfm]}
											rehypePlugins={[rehypeHighlight]}
											components={{
												// Personalizar componentes si es necesario
												code: ({ inline, className, children, ...props }) => (
													<code
														className={`${className} ${
															inline
																? "bg-gray-100 px-1 py-0.5 rounded text-sm"
																: "block bg-gray-900 text-white p-3 rounded-lg my-2 overflow-x-auto"
														}`}
														{...props}
													>
														{children}
													</code>
												),
												p: ({ children }) => (
													<p className="mb-2 last:mb-0">{children}</p>
												),
												ul: ({ children }) => (
													<ul className="list-disc ml-4 mb-2">{children}</ul>
												),
												ol: ({ children }) => (
													<ol className="list-decimal ml-4 mb-2">{children}</ol>
												),
												li: ({ children }) => (
													<li className="mb-1">{children}</li>
												),
												a: ({ href, children }) => (
													<a
														href={href}
														target="_blank"
														rel="noopener noreferrer"
														className="text-blue-600 hover:underline"
													>
														{children}
													</a>
												),
												h1: ({ children }) => (
													<h1 className="text-xl font-bold mb-2 mt-3">
														{children}
													</h1>
												),
												h2: ({ children }) => (
													<h2 className="text-lg font-bold mb-2 mt-3">
														{children}
													</h2>
												),
												h3: ({ children }) => (
													<h3 className="text-base font-bold mb-2 mt-2">
														{children}
													</h3>
												),
												blockquote: ({ children }) => (
													<blockquote className="border-l-4 border-gray-300 pl-3 my-2 italic">
														{children}
													</blockquote>
												),
												table: ({ children }) => (
													<div className="overflow-x-auto my-2">
														<table className="min-w-full border-collapse border border-gray-300">
															{children}
														</table>
													</div>
												),
												th: ({ children }) => (
													<th className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold">
														{children}
													</th>
												),
												td: ({ children }) => (
													<td className="border border-gray-300 px-3 py-2">
														{children}
													</td>
												),
											}}
										>
											{message.content}
										</ReactMarkdown>
									</div>
								)}
							</div>
						</div>
					))}

					{/* Mensaje de "Pensando..." */}
					{isLoading && (
						<div className="flex justify-start">
							<div className="px-3">
								<div className="flex items-center space-x-2">
									<div className="flex space-x-1">
										<div className="size-1.5 bg-gray-400 rounded-full animate-bounce"></div>
										<div className="size-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
										<div className="size-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
									</div>
									<span className="text-gray-600 font-afacad">Pensando...</span>
								</div>
							</div>
						</div>
					)}
				</div>
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

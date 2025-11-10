import { Button, Input } from "@heroui/react";
import StatusAPI from "./components/StatusAPI";
import ChatBar from "./components/ChatBar/ChatBar";
import { useState } from "react";

function App() {
	const [prompt, setPrompt] = useState("");
	const [response, setResponse] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	async function handleSubmit() {
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

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				const lines = chunk.split("\n");

				for (const line of lines) {
					if (line.startsWith("data: ")) {
						const data = JSON.parse(line.substring(6));

						if (data.content) {
							setResponse((prev) => prev + data.content);
						}
						if (data.done) {
							setIsLoading(false);
						}
					}
				}
			}

			setPrompt("");
		} catch (error) {
			// Manejo de errores
			console.error("Error al enviar el prompt:", error);
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 p-4 flex flex-col">
			{/* <StatusAPI /> */}
			<StatusAPI />

			{/* Área de chat */}
			<div className="flex-1 max-w-4xl w-full mx-auto mb-4">
				{response && (
					<div className="rounded-lg p-4 mb-4">
						<div className="prose max-w-none">
							<p className="whitespace-pre-wrap font-afacad">{response}</p>
						</div>
					</div>
				)}
			</div>

			{/* Barra de chat fija en la parte inferior */}
			<div className="max-w-4xl w-full mx-auto">
				<ChatBar
					value={prompt}
					onChange={setPrompt}
					onSubmit={handleSubmit}
					isLoading={isLoading}
				/>
			</div>
		</div>
	);
}

export default App;

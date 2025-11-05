import { Button, Input } from "@heroui/react";
import StatusAPI from "./StatusAPI";
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
		<div className="p-4">
			<StatusAPI />
			<h1>Welcome to Locally Backend</h1>
			<div className="flex flex-col gap-4 mt-5 w-80">
				<Input
					placeholder="¿Que tienes en mente?"
					value={prompt}
					onValueChange={setPrompt}
				/>
				<Button color="primary" variant="solid" onPress={handleSubmit}>
					Enviar
				</Button>
			</div>
			{isLoading && <p>Cargando respuesta...</p>}
			{response && (
				<div className="mt-5 p-4 border rounded">
					<h2 className="font-bold mb-2">Respuesta:</h2>
					<p>{response}</p>
				</div>
			)}
		</div>
	);
}

export default App;

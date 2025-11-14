export const fetchHistory = async () => {
    try {
        const response = await fetch("http://localhost:8000/api/history", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) {
            throw new Error("Error fetching chat history");
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching chat history:", error);
        return null;
    }
}

export const saveMessagesInAPI = async (prompt, setMessages, setIsLoading) => {
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
};

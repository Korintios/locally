// ==================== GESTIÓN DE CONVERSACIONES ====================

/**
 * Obtiene la lista de todas las conversaciones.
 * @returns {Promise<Array>} Lista de conversaciones
 */
export const fetchConversations = async () => {
	try {
		const response = await fetch("http://localhost:8000/api/conversations", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});
		if (!response.ok) {
			throw new Error("Error fetching conversations");
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error fetching conversations:", error);
		return [];
	}
};

/**
 * Obtiene los mensajes de una conversación específica.
 * @param {string} conversationId - ID de la conversación
 * @returns {Promise<Array>} Lista de mensajes
 */
export const fetchConversationMessages = async (conversationId) => {
	try {
		const response = await fetch(
			`http://localhost:8000/api/conversations/${conversationId}/messages`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
		if (!response.ok) {
			throw new Error("Error fetching conversation messages");
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error fetching conversation messages:", error);
		return [];
	}
};

/**
 * Crea una nueva conversación.
 * @param {string} title - Título de la conversación (opcional)
 * @returns {Promise<Object|null>} Conversación creada o null si hubo error
 */
export const createConversation = async (title = "Nueva conversación") => {
	try {
		const response = await fetch("http://localhost:8000/api/conversations", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ title }),
		});
		if (!response.ok) {
			throw new Error("Error creating conversation");
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error creating conversation:", error);
		return null;
	}
};

/**
 * Renombra una conversación existente.
 * @param {string} conversationId - ID de la conversación
 * @param {string} newTitle - Nuevo título
 * @returns {Promise<boolean>} True si se renombró exitosamente
 */
export const renameConversation = async (conversationId, newTitle) => {
	try {
		const response = await fetch(
			`http://localhost:8000/api/conversations/${conversationId}`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ title: newTitle }),
			}
		);
		if (!response.ok) {
			throw new Error("Error renaming conversation");
		}
		const data = await response.json();
		return data.success;
	} catch (error) {
		console.error("Error renaming conversation:", error);
		return false;
	}
};

/**
 * Elimina una conversación y todos sus mensajes.
 * @param {string} conversationId - ID de la conversación
 * @returns {Promise<boolean>} True si se eliminó exitosamente
 */
export const deleteConversation = async (conversationId) => {
	try {
		const response = await fetch(
			`http://localhost:8000/api/conversations/${conversationId}`,
			{
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
		if (!response.ok) {
			throw new Error("Error deleting conversation");
		}
		const data = await response.json();
		return data.success;
	} catch (error) {
		console.error("Error deleting conversation:", error);
		return false;
	}
};

// ==================== ENDPOINT LEGACY ====================

/**
 * @deprecated Usar fetchConversations en su lugar
 */
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
};

// ==================== ENVÍO DE MENSAJES ====================

/**
 * Envía un mensaje al backend y maneja la respuesta en streaming.
 * @param {string} prompt - Mensaje del usuario
 * @param {string|null} conversationId - ID de la conversación (null para crear nueva)
 * @param {Function} setMessages - Función para actualizar el estado de mensajes
 * @param {Function} setIsLoading - Función para actualizar el estado de carga
 * @param {Function} setCurrentConversationId - Función para actualizar el conversation_id actual
 * @returns {Promise<string|null>} ID de la conversación o null si hubo error
 */
export const saveMessagesInAPI = async (
	prompt,
	conversationId,
	setMessages,
	setIsLoading,
	setCurrentConversationId
) => {
	try {
		// Enviar el prompt al backend con el conversation_id
		const response = await fetch("http://localhost:8000/api/chat", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				message: prompt,
				conversation_id: conversationId,
			}),
		});

		const reader = response.body.getReader();
		const decoder = new TextDecoder();

		let assistantResponse = "";
		let newConversationId = conversationId;
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

					// Si el backend devuelve un nuevo conversation_id (conversación recién creada)
					if (data.conversation_id) {
						newConversationId = data.conversation_id;
						setCurrentConversationId(newConversationId);
					}

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

		return newConversationId;
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
		return null;
	}
};
